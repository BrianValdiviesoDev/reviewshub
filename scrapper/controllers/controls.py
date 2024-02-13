
from fastapi import APIRouter, status, HTTPException
from services.controls import health
from services.requests import executePendingRequests, stopScrapper
router = APIRouter(prefix="/controls",
                   tags=["controls"],
                   responses={404: {"message": "Not found"}})


@router.get("/health", status_code=status.HTTP_200_OK)
async def checkHealth():
    return await health()

@router.post("/start", status_code=status.HTTP_200_OK)
async def executeAll():
    return executePendingRequests()


@router.post("/stop", status_code=status.HTTP_200_OK)
async def stop():
    return stopScrapper()
