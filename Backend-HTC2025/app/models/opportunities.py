from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Opportunity(Base):
    """Opportunity available in the system."""

    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    api_id: Mapped[str] = mapped_column(
        BigInteger,
        nullable=False,
        unique=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        nullable=False,
    )

    url: Mapped[str] = mapped_column(
        nullable=False,
    )

    organization: Mapped[str] = mapped_column(
        nullable=False,
    )

    organization_logo: Mapped[str] = mapped_column(
        nullable=True,
    )

    dates: Mapped[str] = mapped_column(
        nullable=True,
    )

    duration: Mapped[str] = mapped_column(
        nullable=True,
    )
