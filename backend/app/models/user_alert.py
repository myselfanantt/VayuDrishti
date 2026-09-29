from sqlalchemy import Column, String, DateTime, Float, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class UserAlert(Base):
    __tablename__ = "user_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region_id = Column(String(64), nullable=False, index=True)
    threshold = Column(Float, nullable=False, default=0.7)
    email = Column(String(256))
    webhook_url = Column(String(512))
    is_active = Column(Boolean, default=True)
    last_triggered_at = Column(DateTime(timezone=True))
    trigger_count = Column(Float, default=0)
    filters = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
