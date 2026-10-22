"""create incidents table

Revision ID: 0001
Revises: 
Create Date: 2026-10-19 00:00:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types first
    incident_status = postgresql.ENUM(
        "RECEIVED",
        "TRIAGING",
        "INVESTIGATING",
        "PLANNING",
        "AWAITING_APPROVAL",
        "EXECUTING",
        "VERIFYING",
        "RESOLVED",
        "NEEDS_HUMAN",
        "EXECUTION_BLOCKED",
        "RECOVERY_FAILED",
        name="incident_status",
        create_type=True,
    )
    incident_severity = postgresql.ENUM(
        "SEV1", "SEV2", "SEV3", "SEV4",
        name="incident_severity",
        create_type=True,
    )

    op.create_table(
        "incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            incident_status,
            nullable=False,
            server_default="RECEIVED",
        ),
        sa.Column(
            "severity",
            incident_severity,
            nullable=False,
            server_default="SEV3",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_incidents_status", "incidents", ["status"])
    op.create_index("ix_incidents_created_at", "incidents", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_incidents_created_at", table_name="incidents")
    op.drop_index("ix_incidents_status", table_name="incidents")
    op.drop_table("incidents")
    op.execute("DROP TYPE IF EXISTS incident_status")
    op.execute("DROP TYPE IF EXISTS incident_severity")
