import logging

from fastapi import FastAPI

from app.config import Environment, settings
from app.routes import auth_router

logger = logging.getLogger(__name__)


def configure_logging() -> None:
    """Configure application logging settings.

    Sets up the root logger with the configured log level and format,
    and reduces verbosity for third-party library loggers (SQLAlchemy,
    uvicorn, asyncio) to WARNING level.
    """
    logging.basicConfig(
        level=(
            logging.DEBUG
            if settings.environment == Environment.DEVELOPMENT
            else logging.INFO
        ),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Reduce verbosity of third-party loggers
    for log_name in [
        "sqlalchemy.engine",
        "sqlalchemy.pool",
        "sqlalchemy.dialects",
        "sqlalchemy.orm",
        "uvicorn.access",
        "asyncio",
    ]:
        logging.getLogger(log_name).setLevel(logging.WARNING)


configure_logging()


def create_application() -> FastAPI:
    """Create and configure FastAPI application.

    Factory function that creates a fully configured FastAPI application
    instance with all middleware, exception handlers, and routers registered.

    Returns:
        FastAPI: Configured FastAPI application instance ready
        to serve requests.
    """
    app = FastAPI(
        title=settings.app_name,
        debug=settings.environment == Environment.DEVELOPMENT,
        version="0.0.1",
        description="Voluntr API main backend",
    )

    def health_check():
        return {"status": "ok"}

    app.get("/health", tags=["Health"])(health_check)
    app.include_router(auth_router)
    logger.info("FastAPI application created and configured.")

    return app


app = create_application()
