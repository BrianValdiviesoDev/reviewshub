
from fastapi import APIRouter, status, HTTPException
from services.products import findProductAsMatch
from services.logger import getLogFileByDate
router = APIRouter(prefix="/logger",
                   tags=["logger"],
                   responses={404: {"message": "Not found"}})


@router.get("/",  status_code=status.HTTP_200_OK)
async def findAll(fromDate:str, toDate:str):
    req = await getLogFileByDate(fromDate, toDate)
    return req


@router.get("/matches",  status_code=status.HTTP_200_OK)
def findAll(id:str):
    req = findProductAsMatch(id)
    return req