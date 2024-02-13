import time
import requests as http_requests
import asyncio

from bson import ObjectId
from models.products import MarketPlaces, ProductType
from services.amazon import AmazonScrapper
from fastapi import HTTPException
import threading
from pymongo import DESCENDING, ReturnDocument
from server.mongoClient import db
from models.requests import Request, RequestStatus, RequestType
from server.logger import print_log
import os

reviews_hub = os.environ.get("REVIEWS_HUB_URL")

collection = db['requests']
scrapper_lock = threading.Lock()
productsCollection = db['products']
reviewsCollection = db['reviews']

stop_scrapper = False
scrapperThread: threading.Thread = None

productsToSearch = int(os.environ.get("PRODUCTS_TO_SEARCH"))
reviewsToRead = int(os.environ.get("REVIEWS_TO_READ"))


async def findAllRequests():
    requests = list(collection.find())
    for request in requests:
        request['_id'] = str(request['_id'])
        request['productId'] = str(request['productId'])
    return requests


async def executeNextPendingRequest():
    global stop_scrapper
    stop_scrapper = False
    if scrapper_lock.locked():
        raise HTTPException(status_code=400, detail="Scrapper is busy")

    request = list(collection.find({"status": RequestStatus.PENDING.name}).sort(
        "createdAt", DESCENDING).limit(1))
    if len(request) == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    request = request[0]

    scrapperThread = threading.Thread(
        target=executeRequest, args=(request['_id'],))
    scrapperThread.start()
    return


def executePendingRequests():
    print_log("Service: execute pending requests")
    global stop_scrapper
    stop_scrapper = False
    if scrapper_lock.locked():
        raise HTTPException(status_code=400, detail="Scrapper is busy")

    global scrapperThread
    scrapperThread = threading.Thread(
        target=executeAllPendingRequests)
    scrapperThread.start()
    return


def executeAllPendingRequests():
    print_log("Service: execute all pending requests")
    global scrapperThread
    global stop_scrapper

    requests = collection.find({'status': RequestStatus.PENDING.name})
    if requests is None:
        scrapperThread.stop()
        raise "Request not found"
    counter = 0
    for request in requests:
        counter += 1
        print_log(
            f"Execute request {counter}/{len(list(requests))}", 'info', request['_id'])
        if stop_scrapper:
            print_log(
                f"STOP SCRAPPING ALL REQUESTS AT {counter}/{len(list(requests))}", 'warning', request['_id'])
            scrapperThread.stop()
            break
        executeRequest(request['_id'])

    requests = collection.find({'status': RequestStatus.PENDING.name})
    if requests and len(list(requests)) > 0:
        print_log(
            f"EXECUTE ALL PENDING REQUESTS AGAIN WITH {len(list(requests))}")
        executeAllPendingRequests()


def stopScrapper():
    print_log("STOP SCRAPPER", 'info')
    global stop_scrapper
    stop_scrapper = True
    return


def executeRequest(id: str):
    print_log(f"EXECUTE REQUEST: {id}", 'info', id)
    request = collection.find_one({'_id': id})
    if request is None:
        print_log("REQUEST NOT FOUND", 'error', id)
        raise "Request not found"
    if request['status'] != RequestStatus.PENDING.name:
        print_log("REQUEST IS NOT PENDING", 'warning', id)
        raise "Request is not pending"
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    collection.update_one(
        {"_id": id}, {"$set": {"status": RequestStatus.IN_PROGRESS.name}})
    with scrapper_lock:
        result = loop.run_until_complete(
            scrapeUrl(url=request['url'], productId=request['productId'], type=request['type'], requestId=id))
    status = RequestStatus.COMPLETED.name
    error = ''
    if 'error' in result:
        status = RequestStatus.ERROR.name
        error = result
    collection.update_one(
        {"_id": id}, {"$set": {"status": status, 'error': error}})

    loop.close()


async def scrapeUrl(url: str, productId: str, type: RequestType, requestId: str):
    print_log(f"INIT_SCRAPE URL: {url}", 'info', requestId, productId)
    try:
        if 'amazon.' in url:
            print_log("SCRAPE WITH AMAZON", 'info', requestId, productId)

            if (type == RequestType.FIND_PRODUCT.name):
                restartCounter = 0
                scrapperCompleted = False
                while restartCounter <= 5 and not scrapperCompleted:
                    scrapper = AmazonScrapper(
                        requestID=requestId, productID=productId, url=url)
                    try:
                        productsList = await scrapper.findProducts(url, productsToSearch)
                        scrapper.close()
                        scrapperCompleted = True
                    except Exception as e:
                        print_log(
                            f"Error scrapping products: {e}", 'error', requestId, productId)
                        print_log(
                            f"Restarting {restartCounter}", 'info', requestId, productId)
                        scrapper.close()
                        time.sleep(5)
                        restartCounter += 1
                        if restartCounter > 5 and not scrapperCompleted:
                            raise e

                print_log(
                    f"PRODUCTS FOUNDED {len(productsList)}", 'result', requestId, productId)
                matches = []
                for product in productsList:
                    product['marketplace'] = MarketPlaces.AMAZON
                    product['type'] = ProductType.SCRAPPED
                    # TODO check if product exists
                    created = productsCollection.insert_one(product)
                    matches.append(
                        {'product': ObjectId(created.inserted_id), 'percentage': []})
                    request = {
                        "productId": ObjectId(created.inserted_id),
                        "url": product['originUrl'],
                        "type": RequestType.GET_PRODUCT_INFO.name,
                        "status": RequestStatus.PENDING.name
                    }
                    collection.insert_one(request)
                productsCollection.update_one(
                    {"_id": productId}, {"$push": {"matches": {"$each": matches}}})

            elif (type == RequestType.GET_REVIEWS.name):
                restartCounter = 0
                scrapperCompleted = False
                while restartCounter <= 3 and not scrapperCompleted:
                    try:
                        scrapper = AmazonScrapper(
                            requestID=requestId, productID=productId)
                        reviews = await scrapper.scrapeReviews(url, reviewsToRead)
                        scrapper.close()
                        scrapperCompleted = True
                    except Exception as e:
                        print_log(
                            f"Error scrapping reviews: {e}", 'error', requestId, productId)
                        print_log(
                            f"Restarting {restartCounter}", 'info', requestId, productId)
                        scrapper.close()
                        restartCounter += 1

                if restartCounter > 3 and not scrapperCompleted:
                    return "Error scrapping reviews"

                print_log(
                    f"REVIEWS FOUNDED: {len(reviews)}", 'result', requestId, productId)
                if len(reviews) > 0:
                    for review in reviews:
                        review['product'] = ObjectId(productId)
                        review['type'] = "SCRAPPED"
                    reviewsCollection.insert_many(reviews)

                try:
                    print_log("calling API to buildFacts",
                              'info', requestId, productId)
                    response = http_requests.post(
                        f"{reviews_hub}/queues/endScrapeReviews/{productId}")

                    print_log(
                        f"API RESPONSE to buildFacts: {response.text}", 'info', requestId, productId)
                except Exception as e:
                    print_log(
                        f"Can not call api to buildFacts: {e}", 'error', requestId, productId)

            elif (type == RequestType.GET_PRODUCT_INFO.name):
                restartCounter = 0
                scrapperCompleted = False
                while restartCounter <= 3 and not scrapperCompleted:
                    try:
                        scrapper = AmazonScrapper(
                            requestID=requestId, productID=productId)
                        product = await scrapper.scrapeProductInfo(url)
                        scrapper.close()
                        scrapperCompleted = True
                    except Exception as e:
                        print_log(
                            f"Error scrapping product info: {e}", 'error', requestId, productId)
                        print_log(
                            f"Restarting {restartCounter}", 'info', requestId, productId)
                        scrapper.close()
                        restartCounter += 1

                if restartCounter > 3 and not scrapperCompleted:
                    return "Error scrapping product info"

                metadata = {}
                productData = productsCollection.find_one(
                    {'_id': ObjectId(productId)})
                if productData:
                    metadata = productData['metadata']
                    for key in product:
                        metadata[key] = product[key]

                product_description = ''
                if product["product_description"] is not None:
                    product_description = product["product_description"]
                productsCollection.update_one(
                    {"_id": ObjectId(productId)}, {"$set": {"metadata": metadata, "properties": product_description}})
                try:

                    product = productsCollection.find_one(
                        {'matches.product': ObjectId(productId)})
                    if product:
                        id = str(product['_id'])
                        data = {"matches": [str(productId)]}
                        print_log("calling API to check matches",
                                  'info', requestId, productId)
                        http_requests.post(
                            f"{reviews_hub}/queues/checkMatches/{id}", json=data)
                except Exception as e:
                    print_log(
                        f"Can not call api to checkMatches: {e}", 'error', requestId, productId)

            else:
                scrapper.close()
                print_log(f"REQUEST TYPE IS NOT SUPPORTED",
                          'error', requestId, productId)
                return f"error: Request type is not supported (${type})"

        else:
            print_log("REQUEST IS NOT SUPPORTED",
                      'error', requestId, productId)
            return "error: Request is not supported"
    except Exception as e:
        print_log(
            f"error executing request: {e}", 'error', requestId, productId)
        return f"error executing request: {e}"

    print_log("END_SCRAPE URL", 'info', requestId, productId)
    return 'ok'
    result = collection.delete_one({'_id': id})
    if result.deleted_count == 1:
        return

    raise HTTPException(status_code=404, detail="Request not found")
