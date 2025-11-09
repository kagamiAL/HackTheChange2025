from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.models.user import User
from app.models.friendships import Friendship
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

    async def accept_friend_request(self, reciever: User, request_id: int) -> None:
        """Accept a friend request by its ID."""
        stmt = select(FriendRequest).where(
            and_(
                FriendRequest.id == request_id,
                FriendRequest.receiver_id == reciever.id,
                FriendRequest.status == Friend_Request_Status.pending,
            )
        )
        result = await self._session.execute(stmt)
        friend_request = result.scalar_one_or_none()

        if friend_request is None:
            raise ValueError("Friend request not found.")

        friend_request.status = Friend_Request_Status.accepted

        user1_id, user2_id = sorted(
            [friend_request.sender_id, friend_request.receiver_id]
        )

        friendship = Friendship(
            user1_id=user1_id,
            user2_id=user2_id,
        )
        self._session.add(friendship)
        await self._session.commit()
