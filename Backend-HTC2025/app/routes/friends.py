### FastAPI route for friend-related endpoints

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.auth import get_current_user
from app.database.postgres import get_postgres_session
from app.services.friends import FriendsService
from app.dependencies.users import user_lookup_service_dependency
from app.schemas.friends import (
    FriendRequestSchema,
    ManageFriendRequestSchema,
    PendingFriendRequestSchema,
)
from app.models.user import User

router = APIRouter(prefix="/friends", tags=["Friends"])


def get_friends_service(
    session: AsyncSession = Depends(get_postgres_session),
) -> FriendsService:
    return FriendsService(session)


@router.get("/", status_code=status.HTTP_200_OK, summary="Get list of friends")
async def get_friends(
    friends_service: FriendsService = Depends(get_friends_service),
    user: User = Depends(get_current_user),
):
    """Retrieve the list of friends for the current user."""
    # Placeholder implementation
    friends_list = await friends_service.get_friends_list(user)
    return {"friends": friends_list}


@router.get(
    "/requests/pending",
    status_code=status.HTTP_200_OK,
    summary="Get pending friend requests",
)
async def get_pending_friend_requests(
    friends_service: FriendsService = Depends(get_friends_service),
    user: User = Depends(get_current_user),
):
    """Retrieve pending friend requests sent to the current user."""
    pending_requests = await friends_service.get_pending_friend_requests(user)
    return {
        "pending_requests": [
            PendingFriendRequestSchema(
                id=request.id,
                sender_email=sender.email,
                sender_name=sender.full_name or sender.email,
                status=request.status.value,
                created_at=request.created_at.isoformat(),
            ).model_dump()
            for request, sender in pending_requests
        ]
    }


@router.post(
    "/requests/send", status_code=status.HTTP_201_CREATED, summary="Send friend request"
)
async def send_friend_request(
    friend_request: FriendRequestSchema,
    friends_service: FriendsService = Depends(get_friends_service),
    user_lookup_service=Depends(user_lookup_service_dependency),
    user: User = Depends(get_current_user),
):
    """Send a friend request to another user."""
    # Placeholder implementation
    if friend_request.friend_email == user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send friend request to oneself.",
        )
    friend = await user_lookup_service.get_by_email(friend_request.friend_email)
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with the given email does not exist.",
        )
    await friends_service.send_friend_request(sender=user, receiver=friend)
    return {"message": f"Friend request sent to user {friend.email}."}


@router.post(
    "/requests/manage", status_code=status.HTTP_200_OK, summary="Accept friend request"
)
async def manage_friend_request(
    manage_request: ManageFriendRequestSchema,
    friends_service: FriendsService = Depends(get_friends_service),
    user: User = Depends(get_current_user),
):
    """Accept a friend request."""
    # Placeholder implementation
    await friends_service.manage_friend_request(
        reciever=user,
        request_id=manage_request.request_id,
        accept=manage_request.accept,
    )
    return {"message": "Friend request accepted."}
