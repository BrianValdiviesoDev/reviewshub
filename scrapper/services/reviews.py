from server.mongoClient import db
from models.queues import EventTypes, QueueEvent
from services.producer import RabbitMQ_Producer
import os

collection = db['reviews']
api_queue = os.environ.get("API_QUEUE") 

def createManyReviews(reviews):
    productId = str(reviews[0]['product'])
    ids = collection.insert_many(reviews)
    rabbit = RabbitMQ_Producer()
    event:QueueEvent = {
        "event": EventTypes.new_reviews_scrapped.name,
        "data": {
            "productId": productId,
        }
    }
    rabbit.send(event,api_queue)
    return ids