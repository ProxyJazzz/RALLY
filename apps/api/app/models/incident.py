"""
RALLY — Incident ORM model.

Schema is managed exclusively via Alembic migrations.
Do NOT call Base.metadata.create_all() from application code.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class IncidentStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    TRIAGING = "TRIAGING"
    INVESTIGATING = "INVESTIGATING"
    PLANNING = "PLANNING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    RESOLVED = "RESOLVED"
    NEEDS_HUMAN = "NEEDS_HUMAN"
    EXECUTION_BLOCKED = "EXECUTION_BLOCKED"
    RECOVERY_FAILED = "RECOVERY_FAILED"


class IncidentSeverity(str, enum.Enum):
    SEV1 = "SEV1"   # Critical — immediate response required
    SEV2 = "SEV2"   # High     — significant impact
    SEV3 = "SEV3"   # Medium   — partial degradation
    SEV4 = "SEV4"   # Low      — minor impact


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[IncidentStatus] = mapped_column(
        Enum(IncidentStatus, name="incident_status"),
        nullable=False,
        default=IncidentStatus.RECEIVED,
    )
    severity: Mapped[IncidentSeverity] = mapped_column(
        Enum(IncidentSeverity, name="incident_severity"),
        nullable=False,
        default=IncidentSeverity.SEV3,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<Incident id={self.id!s} title={self.title!r} status={self.status}>"
