from services.amazon import AmazonScrapper
import requests as http_requests
import os

reviews_hub = os.environ.get("REVIEWS_HUB_URL")


async def health():
    try:
        scrapper = AmazonScrapper('test', 'test')
        scrapper.openUrl('https://www.amazon.com/')
        scrapper.close()
    except Exception as e:
        return f"Can not open url with AmazonScrapper: {e}"

    try:
        response = http_requests.get(f"{reviews_hub}/users")
        if response.status_code != 401:
            return f"Can not connect to API: {response.status_code}"
    except Exception as e:
        return f"Can not connect to API: {e}"

    return "OK"
