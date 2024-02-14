import os
import pika
from dotenv import load_dotenv

load_dotenv()

rabbit_host = os.environ.get("RABBITMQ_HOST")
rabbit_port = os.environ.get("RABBITMQ_PORT")
rabbit_user = os.environ.get("RABBITMQ_USER")
rabbit_pass = os.environ.get("RABBITMQ_PASS")
outcoming_queue = os.environ.get("RABBITMQ_OUTCOMING_QUEUE")
incoming_queue = os.environ.get("RABBITMQ_INCOMING_QUEUE")

class RabbitMQ_Consumer:

    def __init__(self):
        credentials = pika.PlainCredentials(rabbit_user, rabbit_pass)
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=rabbit_host, port=rabbit_port, credentials=credentials))
        self.channel = connection.channel()
        self.consume()

    def consume(self):
        self.channel.queue_declare(queue=incoming_queue, durable=True)

        def callback(ch, method, properties, body):
            print(f"Received message: {body.decode()}")

        self.channel.basic_consume(queue=incoming_queue, on_message_callback=callback, auto_ack=True)

        print('Waiting for messages. To exit press CTRL+C')
        self.channel.start_consuming()


class RabbitMQ_Producer:

    def __init__(self):
        credentials = pika.PlainCredentials(rabbit_user, rabbit_pass)
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=rabbit_host, port=rabbit_port, credentials=credentials))
        self.channel = connection.channel()

    def send(self, message):
        print(f"Sending message: {message}")
        self.channel.queue_declare(queue=outcoming_queue, durable=True)
        self.channel.basic_publish(exchange='', routing_key=outcoming_queue, body=message)
        print(f"Sent message: {message}")