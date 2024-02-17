import os
import pika
import json
from dotenv import load_dotenv
from models.queues import EventTypes, QueueEvent
from services.scraping import scrapeInThread

load_dotenv()

rabbit_host = os.environ.get("RABBITMQ_HOST")
rabbit_port = os.environ.get("RABBITMQ_PORT")
rabbit_user = os.environ.get("RABBITMQ_USER")
rabbit_pass = os.environ.get("RABBITMQ_PASS")
amazon_queue = os.environ.get("AMAZON_QUEUE")

class RabbitMQ_Consumer:

    def __init__(self):
        credentials = pika.PlainCredentials(rabbit_user, rabbit_pass)
        parameters = pika.ConnectionParameters(host=rabbit_host, port=rabbit_port, credentials=credentials)
        connection = pika.BlockingConnection(parameters)
        self.channel = connection.channel()
        self.consume()

    def consume(self):
        self.channel.queue_declare(queue=amazon_queue, durable=True)
        
        def callback(ch, method, properties, body):
            try:           
                message = body.decode()
                content = json.loads(message)
                if content['event'] == EventTypes.new_request.name:
                    rq = content['data']['request']
                    scrapeInThread(rq['url'], rq['type'], rq['_id'], rq['productId'])
            except Exception as e:
                print(f"Error: {e}")        

        self.channel.basic_consume(queue=amazon_queue, on_message_callback=callback, auto_ack=True)
        self.channel.start_consuming()

    def close_connection(self):
        self.channel.stop_consuming()
        self.connection.close()