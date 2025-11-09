from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Friendship(Base):
    """Friendship relationship between users."""

    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    user_id1: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    user_id2: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )
