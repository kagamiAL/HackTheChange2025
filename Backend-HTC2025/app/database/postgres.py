"""PostgreSQL engine + session dependency for FastAPI."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings
import logging

logger = logging.getLogger(__name__)


def _build_async_engine() -> AsyncEngine:
    return create_async_engine(
        settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
        echo=settings.sqlalchemy_echo,
        pool_pre_ping=True,
        pool_size=settings.postgres_pool_size,
        max_overflow=settings.postgres_max_overflow,
    )


engine: AsyncEngine = _build_async_engine()
async_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


async def get_postgres_session() -> AsyncIterator[AsyncSession]:
    """Yield a scoped async session for FastAPI dependencies."""

    session = async_session_factory()
    logger.debug("Postgres session created.")

    try:
        yield session
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
        logger.debug("Postgres session closed.")


__all__ = [
    "get_postgres_session",
]
