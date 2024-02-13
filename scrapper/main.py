from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from controllers import requests, logger, controls

load_dotenv()

reviews_hub = os.environ.get("REVIEWS_HUB_URL")
reviews_backoffice = os.environ.get("REVIEWS_BACKOFFICE_URL")

app = FastAPI()


origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost:8080",
    reviews_hub,
    reviews_backoffice,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(requests.router)
app.include_router(logger.router)
app.include_router(controls.router)

if not os.path.exists("logs"):
    os.mkdir("logs")

if not os.path.exists("logs/screenshots"):
    os.mkdir("logs/screenshots")

app.mount("/screenshots", StaticFiles(directory="logs/screenshots"),
          name="screenshots")

if __name__ == "__main__":
    uvicorn.run(app)

# Inicia el server: uvicorn main:app --reload
# Documentación con Swagger: http://127.0.0.1:8000/docs
# Documentación con Redocly: http://127.0.0.1:8000/redoc
