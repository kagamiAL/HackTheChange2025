from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.models.user import User
from app.models.friendrequests import FriendRequest, Friend_Request_Status


class FriendsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _validate_friend_request(self, sender: User, receiver: User) -> None:
        """Validate that a friend request can be sent from sender to receiver."""
        if sender.id == receiver.id:
            raise ValueError("Cannot send friend request to oneself.")

        stmt = select(FriendRequest).where(
            or_(
                and_(
                    FriendRequest.sender_id == sender.id,
                    FriendRequest.receiver_id == receiver.id,
                ),
                and_(
                    FriendRequest.sender_id == receiver.id,
                    FriendRequest.receiver_id == sender.id,
                ),
            )
        )
        result = await self._session.execute(stmt)
        existing_request = result.scalar_one_or_none()

        if existing_request is not None:
            raise ValueError("A friend request already exists between these users.")

    async def send_friend_request(self, sender: User, receiver: User) -> None:
        """Send a friend request from one user to another."""

        await self._validate_friend_request(sender, receiver)

        friend_request = FriendRequest(
            sender_id=sender.id,
            receiver_id=receiver.id,
            status=Friend_Request_Status.pending,
        )
        self._session.add(friend_request)
        await self._session.commit()
