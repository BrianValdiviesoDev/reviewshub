import uuid
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class RequestStatus(Enum):
    PENDING = 1,
    COMPLETED = 2,
    CANCELLED = 3
    ERROR = 4,
    IN_PROGRESS = 5


class RequestType(Enum):
    FIND_PRODUCT = 1,
    GET_REVIEWS = 2,
    GET_PRODUCT_INFO = 3


class Request(BaseModel):
    id: str = Field(default_factory=uuid.uuid4, alias="_id")
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    type: RequestType = Field(default=RequestType.FIND_PRODUCT)
    executionDate: Optional[str] = Field(default=None)
    productId: str = Field(default=None)
    url: str = Field(default=None)
    error: str = Field(default=None)
