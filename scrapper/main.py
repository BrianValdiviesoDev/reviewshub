import os
import pika
import json
from dotenv import load_dotenv
from models.queues import EventTypes, QueueEvent
from services.scraping import scrapeInThread, runScraper, scrapeUrl
load_dotenv()

rabbit_host = os.environ.get("RABBITMQ_HOST")
rabbit_port = os.environ.get("RABBITMQ_PORT")
rabbit_user = os.environ.get("RABBITMQ_USER")
rabbit_pass = os.environ.get("RABBITMQ_PASS")
amazon_queue = os.environ.get("AMAZON_QUEUE")

class RabbitMQ_Consumer:

    def __init__(self):
        print("Connecting to RabbitMQ...")
        credentials = pika.PlainCredentials(rabbit_user, rabbit_pass)
        parameters = pika.ConnectionParameters(host=rabbit_host, port=rabbit_port, credentials=credentials)
        connection = pika.BlockingConnection(parameters)
        self.channel = connection.channel()
        self.consume()
        print("Connected to RabbitMQ")

    def consume(self):
        print("Consuming messages...")
        self.channel.queue_declare(queue=amazon_queue, durable=True)
        
        def callback(ch, method, properties, body):
            print(f"====================================")
            print(f"Received message: {body}")
            print(f"====================================")
            try:           
                message = body.decode()
                content = json.loads(message)
                if content['event'] == EventTypes.new_request.name:
                    rq = content['data']['request']
                    runScraper(rq['url'], rq['type'], rq['_id'], rq['productId'])
            except Exception as e:
                print(f"Error: {e}")      

            print(f"================ ACK ====================")
            self.channel.basic_ack(delivery_tag=method.delivery_tag)

        self.channel.basic_consume(queue=amazon_queue, on_message_callback=callback, auto_ack=False)
        self.channel.start_consuming()

    def close_connection(self):
        self.channel.stop_consuming()
        self.connection.close()


if __name__ == "__main__":
    print("INITIALIZING CONSUMER...")
    rabbit = RabbitMQ_Consumer()