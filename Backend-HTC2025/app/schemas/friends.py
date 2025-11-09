"""Pydantic schemas for friend-related operations."""

from __future__ import annotations

from pydantic import BaseModel


class FriendRequestSchema(BaseModel):
    friend_email: str


class ManageFriendRequestSchema(BaseModel):
    request_id: int
    accept: bool


class PendingFriendRequestSchema(BaseModel):
    id: int
    sender_email: str
    sender_name: str
    status: str
    created_at: str
