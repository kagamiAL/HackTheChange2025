"""Friendships

Revision ID: fecf967201a3
Revises: ef1ad8ca0ea6
Create Date: 2025-11-08 20:37:59.827971

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "fecf967201a3"
down_revision: Union[str, Sequence[str], None] = "ef1ad8ca0ea6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE friend_request_status AS ENUM (
                'pending',
                'accepted',
                'rejected'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )

    friend_request_status_enum = postgresql.ENUM(
        "pending",
        "accepted",
        "rejected",
        name="friend_request_status",
        create_type=False,
    )

    # Friend requests table
    op.create_table(
        "friendrequests",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("sender_id", sa.BigInteger(), nullable=False),
        sa.Column("receiver_id", sa.BigInteger(), nullable=False),
        sa.Column("status", friend_request_status_enum, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sender_id", "receiver_id"),
    )
    op.create_index(
        op.f("ix_friendrequests_receiver_id"),
        "friendrequests",
        ["receiver_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_friendrequests_sender_id"),
        "friendrequests",
        ["sender_id"],
        unique=False,
    )

    # Friendships table
    op.create_table(
        "friendships",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id1", sa.BigInteger(), nullable=False),
        sa.Column("user_id2", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("user_id1 < user_id2"),
    )
    op.create_index(
        op.f("ix_friendships_user_id1"),
        "friendships",
        ["user_id1"],
        unique=False,
    )
    op.create_index(
        op.f("ix_friendships_user_id2"),
        "friendships",
        ["user_id2"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_friendrequests_sender_id"), table_name="friendrequests")
    op.drop_index(op.f("ix_friendrequests_receiver_id"), table_name="friendrequests")
    op.drop_table("friendrequests")

    op.drop_index(op.f("ix_friendships_user_id2"), table_name="friendships")
    op.drop_index(op.f("ix_friendships_user_id1"), table_name="friendships")
    op.drop_table("friendships")

    op.execute("DROP TYPE IF EXISTS friend_request_status CASCADE;")
