from fastapi import FastAPI
from app.config import Environment, settings


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

    return app


app = create_application()
