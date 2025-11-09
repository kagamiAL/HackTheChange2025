from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base

import enum


class Friend_Request_Status(enum.Enum):
    """Enumeration for friend request status."""

    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class FriendRequest(Base):
    """Friend request between users."""

    __tablename__ = "friendrequests"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    sender_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    receiver_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    status: Mapped[Friend_Request_Status] = mapped_column(
        Enum(Friend_Request_Status),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )
