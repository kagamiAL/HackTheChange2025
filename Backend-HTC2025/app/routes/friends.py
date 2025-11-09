### FastAPI route for friend-related endpoints

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.auth import get_current_user
from app.database.postgres import get_postgres_session
from app.models.user import User

router = APIRouter(prefix="/friends", tags=["Friends"])


@router.get("/", status_code=status.HTTP_200_OK, summary="Get list of friends")
async def get_friends(
    db: AsyncSession = Depends(get_postgres_session),
    user: User = Depends(get_current_user),
):
    """Retrieve the list of friends for the current user."""
    # Placeholder implementation
    return {"friends": []}
