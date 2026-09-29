"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-09-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "forecast_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", sa.String(64), nullable=False),
        sa.Column("model_name", sa.String(32), nullable=False),
        sa.Column("init_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("domain", sa.String(32), server_default="INDIA"),
        sa.Column("resolution", sa.Float(), server_default="0.25"),
        sa.Column("lead_days", sa.Integer(), server_default="10"),
        sa.Column("status", sa.String(16), server_default="pending"),
        sa.Column("metadata", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id"),
    )
    op.create_index("ix_forecast_runs_init_time", "forecast_runs", ["init_time"])
    op.create_index("ix_forecast_runs_run_id", "forecast_runs", ["run_id"])

    op.create_table(
        "bust_detections",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", sa.String(64), nullable=False),
        sa.Column("region_id", sa.String(64), nullable=False),
        sa.Column("region_name", sa.String(128)),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("lead_day", sa.Integer(), nullable=False),
        sa.Column("bust_probability", sa.Float(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("uncertainty_low", sa.Float()),
        sa.Column("uncertainty_high", sa.Float()),
        sa.Column("severity", sa.String(16)),
        sa.Column("synoptic_regime", sa.String(64)),
        sa.Column("shap_values", sa.JSON()),
        sa.Column("narrative", sa.Text()),
        sa.Column("similar_events", sa.JSON()),
        sa.Column("is_verified", sa.Boolean(), server_default="false"),
        sa.Column("actual_bust", sa.Boolean()),
        sa.Column("verification_mae", sa.Float()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bust_detections_run_id", "bust_detections", ["run_id"])
    op.create_index("ix_bust_detections_region_id", "bust_detections", ["region_id"])
    op.create_index("ix_bust_detections_created_at", "bust_detections", ["created_at"])

    op.create_table(
        "synoptic_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128)),
        sa.Column("onset_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True)),
        sa.Column("center_lat", sa.Float()),
        sa.Column("center_lon", sa.Float()),
        sa.Column("intensity", sa.String(32)),
        sa.Column("affected_regions", sa.JSON()),
        sa.Column("bust_mae_avg", sa.Float()),
        sa.Column("description", sa.Text()),
        sa.Column("is_synthetic", sa.Boolean(), server_default="false"),
        sa.Column("metadata", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("region_id", sa.String(64), nullable=False),
        sa.Column("threshold", sa.Float(), server_default="0.7"),
        sa.Column("email", sa.String(256)),
        sa.Column("webhook_url", sa.String(512)),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True)),
        sa.Column("trigger_count", sa.Float(), server_default="0"),
        sa.Column("filters", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "historical_errors",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", sa.String(64), nullable=False),
        sa.Column("model_name", sa.String(32), nullable=False),
        sa.Column("valid_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("variable", sa.String(32), nullable=False),
        sa.Column("lead_day", sa.Integer(), nullable=False),
        sa.Column("mae", sa.Float()),
        sa.Column("rmse", sa.Float()),
        sa.Column("bias", sa.Float()),
        sa.Column("region_id", sa.String(64)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hist_errors_lat_lon_time", "historical_errors", ["lat", "lon", "valid_time"])


def downgrade():
    op.drop_table("historical_errors")
    op.drop_table("user_alerts")
    op.drop_table("synoptic_events")
    op.drop_table("bust_detections")
    op.drop_table("forecast_runs")
