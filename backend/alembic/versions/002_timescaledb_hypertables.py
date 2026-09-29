"""TimescaleDB hypertables

Revision ID: 002
Revises: 001
Create Date: 2026-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    # Convert time-series tables to TimescaleDB hypertables
    op.execute(
        "SELECT create_hypertable('bust_detections', 'created_at', "
        "if_not_exists => TRUE, migrate_data => TRUE);"
    )
    op.execute(
        "SELECT create_hypertable('historical_errors', 'valid_time', "
        "if_not_exists => TRUE, migrate_data => TRUE);"
    )
    # Add compression policy (compress chunks older than 7 days)
    op.execute(
        "SELECT add_compression_policy('bust_detections', INTERVAL '7 days', "
        "if_not_exists => TRUE);"
    )
    op.execute(
        "ALTER TABLE bust_detections SET (timescaledb.compress, "
        "timescaledb.compress_segmentby = 'region_id');"
    )


def downgrade():
    pass  # Cannot easily un-hypertable; recreate from scratch
