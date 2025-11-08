from fastapi import FastAPI
from app.config import Environment, config


def create_application() -> FastAPI:
    """Create and configure FastAPI application.

    Factory function that creates a fully configured FastAPI application
    instance with all middleware, exception handlers, and routers registered.

    Returns:
        FastAPI: Configured FastAPI application instance ready
        to serve requests.
    """
    app = FastAPI(
        title=config.app_name,
        debug=config.environment == Environment.DEVELOPMENT,
        version="0.0.1",
        description="Voluntr API main backend",
    )

    return app


app = create_application()
