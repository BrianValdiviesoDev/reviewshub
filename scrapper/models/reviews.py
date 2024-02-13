import uuid
from pydantic import BaseModel, Field
from typing import Optional


class Review(BaseModel):
    id: str = Field(default_factory=uuid.uuid4, alias="_id")
    url: str = Field(default=None)
    title: str = Field(default=None)
    description: str = Field(default=None)
    product: str = Field(default=None)
    rating: Optional[float] = Field(default=None)
    username: Optional[str] = Field(default=None)
    userAvatar: Optional[str] = Field(default=None)
    reviewDate: Optional[str] = Field(default=None)
    buyDate: Optional[str] = Field(default=None)
    images: Optional[list[str]] = Field(default=None)
    positiveVotes: Optional[int] = Field(default=None)
    negativeVotes: Optional[int] = Field(default=None)
    metadata: Optional[dict] = Field(default=None)
