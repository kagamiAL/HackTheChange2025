"""Opportunities and Saved Opportunities tables

Revision ID: 01f90ea05cc1
Revises: fecf967201a3
Create Date: 2025-11-09 19:17:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "01f90ea05cc1"
down_revision: Union[str, Sequence[str], None] = "fecf967201a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create opportunities and saved_opportunities tables."""
    op.create_table(
        "opportunities",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("api_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("organization", sa.String(), nullable=False),
        sa.Column("organization_logo", sa.String(), nullable=True),
        sa.Column("dates", sa.String(), nullable=True),
        sa.Column("duration", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_opportunities_api_id"),
        "opportunities",
        ["api_id"],
        unique=True,
    )

    op.create_table(
        "saved_opportunities",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("opportunity_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_saved_opportunities_user_id"),
        "saved_opportunities",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_saved_opportunities_opportunity_id"),
        "saved_opportunities",
        ["opportunity_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop opportunities and saved_opportunities tables."""
    op.drop_index(
        op.f("ix_saved_opportunities_opportunity_id"),
        table_name="saved_opportunities",
    )
    op.drop_index(
        op.f("ix_saved_opportunities_user_id"),
        table_name="saved_opportunities",
    )
    op.drop_table("saved_opportunities")

    op.drop_index(op.f("ix_opportunities_api_id"), table_name="opportunities")
    op.drop_table("opportunities")
