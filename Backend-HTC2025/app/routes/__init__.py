"""Available FastAPI routers."""

from .auth import router as auth_router
from .friends import router as friends_router
from .opportunity import router as opportunity_router

__all__ = ["auth_router", "friends_router", "opportunity_router"]
