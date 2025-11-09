from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class SavedOpportunity(Base):
    """Saved opportunity by users."""

    __tablename__ = "saved_opportunities"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    opportunity_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )
