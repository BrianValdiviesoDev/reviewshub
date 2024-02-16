from bson import ObjectId
from models.queues import EventTypes, QueueEvent
from services.producer import RabbitMQ_Producer
from server.mongoClient import db
import os

collection = db['products']
api_queue = os.environ.get("API_QUEUE")

def createProduct(product):
    #TODO check if product exists with amazonUUID
    result = collection.insert_one(product)
    product['_id'] = str(result.inserted_id)
    rabbit = RabbitMQ_Producer()
    event:QueueEvent = {
        "event": EventTypes.new_product.name,
        "data": {
            "product": product
        }
    }
    rabbit.send(event)
    return result

def addMatchesToProduct(productId:str, matches:list):
    result = collection.update_one(
        {"_id": ObjectId(productId)}, {"$push": {"matches": {"$each": matches}}})
    return result

def updateProduct(productId:str, data:dict):
    result = collection.update_one(
        {"_id": ObjectId(productId)}, {"$set": data})
    
    originalProducts = findProductAsMatch(productId)
    rabbit = RabbitMQ_Producer()
    for product in originalProducts:
        event:QueueEvent = {
            "event": EventTypes.check_match.name,
            "data": {
                "productId": str(product),
                "matchId": str(productId)
            }
        }
        rabbit.send(event, api_queue)

def findProductAsMatch(productId:str):
    results = list(collection.find({"matches.product": ObjectId(productId)}))
    product_ids = [str(result['_id']) for result in results]
    return product_ids