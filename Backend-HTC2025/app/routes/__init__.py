"""Available FastAPI routers."""

from .auth import router as auth_router
from .friends import router as friends_router

__all__ = ["auth_router", "friends_router"]
