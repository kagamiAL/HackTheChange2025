"""Pydantic schemas for friend-related operations."""

from __future__ import annotations

from pydantic import BaseModel


class FriendRequestSchema(BaseModel):
    friend_email: str
