"""
ForecastBustTransformer — Spatiotemporal Transformer for NWP Bust Detection.

Architecture:
  - Spatial encoder: ConvNext-style patch embedding per lead-time frame
  - Temporal encoder: Causal multi-head attention across lead times
  - Decoder: Per-cell sigmoid bust probability

Input:  [batch, lead_days=10, lat=121, lon=121, features=12]
Output: [batch, lead_days=10, lat=121, lon=121]  (bust probability map)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch import Tensor
import math
from typing import Tuple


class ConvNextBlock(nn.Module):
    """ConvNext-style depthwise conv block for spatial feature extraction."""

    def __init__(self, dim: int, kernel_size: int = 7, expansion: int = 4):
        super().__init__()
        self.dw_conv = nn.Conv2d(dim, dim, kernel_size, padding=kernel_size // 2, groups=dim)
        self.norm = nn.LayerNorm(dim)
        self.pw_conv1 = nn.Linear(dim, dim * expansion)
        self.act = nn.GELU()
        self.pw_conv2 = nn.Linear(dim * expansion, dim)
        self.gamma = nn.Parameter(torch.ones(dim) * 1e-6)

    def forward(self, x: Tensor) -> Tensor:
        # x: [B, C, H, W]
        residual = x
        x = self.dw_conv(x)
        x = x.permute(0, 2, 3, 1)  # [B, H, W, C]
        x = self.norm(x)
        x = self.pw_conv1(x)
        x = self.act(x)
        x = self.pw_conv2(x)
        x = self.gamma * x
        x = x.permute(0, 3, 1, 2)  # [B, C, H, W]
        return residual + x


class PatchEmbedding(nn.Module):
    """Embed spatial NWP grid into patch tokens."""

    def __init__(self, in_channels: int = 12, d_model: int = 256, patch_size: int = 4):
        super().__init__()
        self.patch_size = patch_size
        self.proj = nn.Sequential(
            nn.Conv2d(in_channels, d_model // 2, kernel_size=patch_size, stride=patch_size),
            nn.LayerNorm([d_model // 2, 1, 1]),  # approximate
            nn.GELU(),
            nn.Conv2d(d_model // 2, d_model, kernel_size=1),
        )
        self.norm = nn.LayerNorm(d_model)
        self.convnext = ConvNextBlock(d_model)

    def forward(self, x: Tensor) -> Tensor:
        # x: [B, C, H, W]
        x = self.proj[0](x)  # patch conv
        x = self.proj[2](x)  # GELU
        x = self.proj[3](x)  # pointwise
        x = self.convnext(x)
        # Flatten spatial: [B, C, H', W'] -> [B, H'*W', C]
        B, C, H, W = x.shape
        x = x.flatten(2).transpose(1, 2)  # [B, N, C]
        x = self.norm(x)
        return x, H, W


class SpatialPositionalEncoding(nn.Module):
    """2D learnable positional encoding for grid patches."""

    def __init__(self, d_model: int, max_h: int = 32, max_w: int = 32):
        super().__init__()
        self.row_embed = nn.Embedding(max_h, d_model // 2)
        self.col_embed = nn.Embedding(max_w, d_model // 2)

    def forward(self, H: int, W: int, device: torch.device) -> Tensor:
        row_ids = torch.arange(H, device=device)
        col_ids = torch.arange(W, device=device)
        row_emb = self.row_embed(row_ids)  # [H, d//2]
        col_emb = self.col_embed(col_ids)  # [W, d//2]
        # Broadcast to [H, W, d]
        pos = torch.cat([
            row_emb.unsqueeze(1).expand(H, W, -1),
            col_emb.unsqueeze(0).expand(H, W, -1),
        ], dim=-1)  # [H, W, d]
        return pos.view(H * W, -1)  # [N, d]


class CausalTemporalAttention(nn.Module):
    """Causal multi-head attention across lead-time axis."""

    def __init__(self, d_model: int, nhead: int, dropout: float = 0.1):
        super().__init__()
        self.attn = nn.MultiheadAttention(d_model, nhead, dropout=dropout, batch_first=True)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model * 4, d_model),
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: Tensor, causal_mask: Tensor) -> Tensor:
        # x: [B*N_patches, T, d_model]
        attn_out, _ = self.attn(x, x, x, attn_mask=causal_mask)
        x = self.norm1(x + self.dropout(attn_out))
        x = self.norm2(x + self.dropout(self.ff(x)))
        return x


class SpatialDecoder(nn.Module):
    """Upsample patch tokens back to original grid resolution."""

    def __init__(self, d_model: int, patch_size: int = 4, out_channels: int = 1):
        super().__init__()
        self.upsample = nn.Sequential(
            nn.ConvTranspose2d(d_model, d_model // 2, kernel_size=patch_size, stride=patch_size),
            nn.GELU(),
            nn.Conv2d(d_model // 2, d_model // 4, kernel_size=3, padding=1),
            nn.GELU(),
            nn.Conv2d(d_model // 4, out_channels, kernel_size=1),
        )

    def forward(self, x: Tensor, H: int, W: int) -> Tensor:
        # x: [B, N, d] -> [B, d, H, W] -> [B, 1, H_orig, W_orig]
        B, N, d = x.shape
        x = x.transpose(1, 2).view(B, d, H, W)
        return self.upsample(x)


class ForecastBustTransformer(nn.Module):
    """
    Spatiotemporal transformer for forecast bust detection.

    Processes 10 lead-day forecast frames simultaneously with:
    - Per-frame spatial ConvNext encoding
    - Causal temporal attention across lead days
    - Upsampling decoder to produce per-cell bust probability maps

    Supports Monte Carlo Dropout for uncertainty quantification.
    """

    def __init__(
        self,
        d_model: int = 256,
        nhead: int = 8,
        num_layers: int = 4,
        in_channels: int = 12,
        lead_days: int = 10,
        patch_size: int = 4,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.d_model = d_model
        self.lead_days = lead_days
        self.patch_size = patch_size

        # Spatial encoder (shared across lead times)
        self.patch_embed = PatchEmbedding(in_channels, d_model, patch_size)
        self.spatial_pos_enc = SpatialPositionalEncoding(d_model)

        # Temporal positional encoding
        self.temporal_pos_enc = nn.Embedding(lead_days, d_model)

        # Temporal transformer layers
        self.temporal_layers = nn.ModuleList([
            CausalTemporalAttention(d_model, nhead, dropout)
            for _ in range(num_layers)
        ])

        # Spatial decoder
        self.decoder = SpatialDecoder(d_model, patch_size)

        # MC Dropout layer (active even in eval mode for uncertainty estimation)
        self.mc_dropout = nn.Dropout(p=dropout)

        self._init_weights()

    def _init_weights(self) -> None:
        for m in self.modules():
            if isinstance(m, (nn.Linear, nn.Conv2d, nn.ConvTranspose2d)):
                nn.init.trunc_normal_(m.weight, std=0.02)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def _build_causal_mask(self, T: int, device: torch.device) -> Tensor:
        """Upper triangular mask for causal attention."""
        mask = torch.triu(torch.ones(T, T, device=device), diagonal=1)
        mask = mask.masked_fill(mask == 1, float("-inf"))
        return mask

    def forward(self, x: Tensor) -> Tensor:
        """
        Args:
            x: [B, T, H, W, F] — batch, lead_days, lat, lon, features

        Returns:
            bust_prob: [B, T, H, W] — bust probability per cell per lead day
        """
        B, T, H, W, num_features = x.shape

        # Process each lead-time frame spatially
        spatial_tokens = []
        patch_H, patch_W = None, None

        for t in range(T):
            frame = x[:, t, :, :, :].permute(0, 3, 1, 2)  # [B, num_features, H, W]
            tokens, ph, pw = self.patch_embed(frame)  # [B, N, d]
            patch_H, patch_W = ph, pw

            # Add spatial positional encoding
            sp_enc = self.spatial_pos_enc(ph, pw, x.device)  # [N, d]
            tokens = tokens + sp_enc.unsqueeze(0)

            spatial_tokens.append(tokens)  # [B, N, d]

        # Stack: [B, T, N, d]
        spatial_stack = torch.stack(spatial_tokens, dim=1)

        # Reshape for temporal attention: process each patch position over time
        # [B, T, N, d] -> [B*N, T, d]
        N = patch_H * patch_W
        x_temp = spatial_stack.permute(0, 2, 1, 3).reshape(B * N, T, self.d_model)

        # Add temporal positional encoding
        t_ids = torch.arange(T, device=x.device)
        t_enc = self.temporal_pos_enc(t_ids)  # [T, d]
        x_temp = x_temp + t_enc.unsqueeze(0)

        # Apply MC dropout before temporal attention
        x_temp = self.mc_dropout(x_temp)

        # Causal temporal attention
        causal_mask = self._build_causal_mask(T, x.device)
        for layer in self.temporal_layers:
            x_temp = layer(x_temp, causal_mask)

        # Reshape back: [B*N, T, d] -> [B, T, N, d]
        x_out = x_temp.reshape(B, N, T, self.d_model).permute(0, 2, 1, 3)

        # Decode each lead time
        outputs = []
        for t in range(T):
            frame_tokens = x_out[:, t, :, :]  # [B, N, d]
            decoded = self.decoder(frame_tokens, patch_H, patch_W)  # [B, 1, H, W]
            outputs.append(decoded.squeeze(1))

        # Stack outputs: [B, T, H_up, W_up]
        bust_logits = torch.stack(outputs, dim=1)

        # Interpolate to exact input spatial size (H, W) if upsampling/patching introduced rounding differences
        if bust_logits.shape[2] != H or bust_logits.shape[3] != W:
            B_out, T_out, H_out, W_out = bust_logits.shape
            bust_logits = F.interpolate(
                bust_logits.view(B_out * T_out, 1, H_out, W_out),
                size=(H, W),
                mode="bilinear",
                align_corners=False,
            ).view(B_out, T_out, H, W)

        return torch.sigmoid(bust_logits)

    def enable_mc_dropout(self) -> None:
        """Enable dropout layers for Monte Carlo inference."""
        self.train()
        # Keep batch norm in eval mode
        for m in self.modules():
            if isinstance(m, (nn.BatchNorm2d, nn.LayerNorm)):
                m.eval()

    def predict_with_uncertainty(
        self, x: Tensor, n_passes: int = 30
    ) -> Tuple[Tensor, Tensor, Tensor]:
        """
        Monte Carlo Dropout inference for uncertainty quantification.

        Returns:
            mean: [B, T, H, W] — mean bust probability
            std:  [B, T, H, W] — standard deviation (uncertainty)
            preds: [n_passes, B, T, H, W] — all sampled predictions
        """
        self.enable_mc_dropout()
        preds = []
        with torch.no_grad():
            for _ in range(n_passes):
                preds.append(self.forward(x))

        preds_stack = torch.stack(preds, dim=0)  # [n_passes, B, T, H, W]
        mean = preds_stack.mean(dim=0)
        std = preds_stack.std(dim=0)
        return mean, std, preds_stack
