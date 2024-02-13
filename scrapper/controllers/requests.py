
from fastapi import APIRouter, status, HTTPException
from services.requests import executeNextPendingRequest
from models.requests import Request
router = APIRouter(prefix="/requests",
                   tags=["requests"],
                   responses={404: {"message": "Not found"}})

@router.post("/next", status_code=status.HTTP_200_OK)
async def executeNext():
    return await executeNextPendingRequest()

