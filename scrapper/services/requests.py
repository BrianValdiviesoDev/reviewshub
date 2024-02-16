from bson import ObjectId
from server.mongoClient import db
from models.requests import Request, RequestStatus
from models.queues import EventTypes, QueueEvent
from services.producer import RabbitMQ_Producer
import os

collection = db['requests']
amazon_queue = os.environ.get("AMAZON_QUEUE")
api_queue = os.environ.get("API_QUEUE")

async def findAllRequests():
    requests = list(collection.find())
    for request in requests:
        request['_id'] = str(request['_id'])
        request['productId'] = str(request['productId'])
    return requests

async def findNextPendingRequest():
    request = collection.find_one({"status": RequestStatus.PENDING.name})
    return request

def createRequest(request:Request):
    result = collection.insert_one(request)
    request['_id'] = str(result.inserted_id)
    request['productId'] = str(request['productId'])
    rabbit = RabbitMQ_Producer()
    event:QueueEvent = {
        "event": EventTypes.new_request.name,
        "data":{
            "request": request
        }
    }
    rabbit.send(event, amazon_queue)

def setRequestInProgress(requestId:str):
    result = collection.update_one(
        {"_id": ObjectId(requestId)}, {"$set": {"status": RequestStatus.IN_PROGRESS.name}})
    sendUpdateRequest(requestId, RequestStatus.IN_PROGRESS.name)
    return result

def completeRequest(requestId:str):
    result = collection.update_one(
        {"_id": ObjectId(requestId)}, {"$set": {"status": RequestStatus.COMPLETED.name}})
    sendUpdateRequest(requestId, RequestStatus.COMPLETED.name)
    return result

def errorRequest(requestId:str, error:str):
    result = collection.update_one(
        {"_id": ObjectId(requestId)}, {"$set": {"status": RequestStatus.ERROR.name, "error": error}})
    sendUpdateRequest(requestId, RequestStatus.ERROR.name, error)
    return result

def sendUpdateRequest(requestId:str, status:str, error:str = None):
    rabbit = RabbitMQ_Producer()
    event:QueueEvent = {
        "event": EventTypes.request_updated.name,
        "data": {
            "requestId": requestId,
            "status": status,
            "error": error
        }
    }
    rabbit.send(event, api_queue)