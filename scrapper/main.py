import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from services.consumer import RabbitMQ_Consumer
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

load_dotenv()

logging.info('Waiting for messages. To exit, press CTRL+C')

app = FastAPI(debug=True)


origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



global rabbitService
rabbitService = RabbitMQ_Consumer()

if __name__ == "__main__":
    uvicorn.run(app)

# Inicia el server: uvicorn main:app --reload
# Documentación con Swagger: http://127.0.0.1:8000/docs
# Documentación con Redocly: http://127.0.0.1:8000/redoc
