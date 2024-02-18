import asyncio
import threading
from bson import ObjectId
from models.products import MarketPlaces, ProductType
from models.requests import RequestStatus, RequestType
from server.logger import print_log
from services.amazon import AmazonScrapper
import os
import time
from services.products import createProduct, addMatchesToProduct, updateProduct
from services.requests import createRequest, completeRequest, errorRequest, setRequestInProgress, findNextPendingRequest
from services.reviews import createManyReviews

reviews_hub = os.environ.get("REVIEWS_HUB_URL")
productsToSearch = int(os.environ.get("PRODUCTS_TO_SEARCH"))
reviewsToRead = int(os.environ.get("REVIEWS_TO_READ"))

scrapperThread: threading.Thread = None
scrapper_lock = threading.Lock()

def scrapeInThread(url:str, type:RequestType, requestId:str, productId:str):
    global scrapperThread
    if scrapperThread is not None and scrapperThread.is_alive():
        print_log("SCRAPE THREAD ALREADY RUNNING", 'error', requestId, productId)
        return
    scrapperThread = threading.Thread(
        target=runScraper, args=(url, type, requestId, productId))
    scrapperThread.start()

def runScraper(url:str, type:RequestType, requestId:str, productId:str):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    with scrapper_lock:
        loop.run_until_complete(
            scrapeUrl(url, type, requestId, productId))
    loop.close()

async def scrapeUrl(url:str, type:RequestType, requestId:str, productId:str):
    print_log(f"INIT_SCRAPE URL: {url}", 'info', requestId, productId)
    setRequestInProgress(requestId)
    try:
        if 'amazon.' in url:
            print_log("SCRAPE WITH AMAZON", 'info', requestId, productId)

            if (type == RequestType.FIND_PRODUCT.name):
                await findProductsInAmazon(url=url, requestId=requestId, productId=productId)
            elif (type == RequestType.GET_PRODUCT_INFO.name):
                await readProductInAmazon(url=url, requestId=requestId, productId=productId)
            elif (type == RequestType.GET_REVIEWS.name):
                await getReviewsInAmazon(url=url, requestId=requestId, productId=productId)

            completeRequest(requestId)
        else:
            print_log("REQUEST IS NOT SUPPORTED",
                      'error', requestId, productId)
            errorRequest(requestId, "Request is not supported")
    except Exception as e:
        print_log(
            f"error executing request: {e}", 'error', requestId, productId)
        errorRequest(requestId, f"Error executing request: {e}")

    print_log("END_SCRAPE URL", 'info', requestId, productId)
    return

async def executeNextPendingRequest():
    request = await findNextPendingRequest()
    if request is not None:
        await scrapeUrl(request['url'], request['type'], str(request['_id']), str(request['productId']))

    return

async def findProductsInAmazon(url:str, requestId:str, productId:str):
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
        created = createProduct(product)

        matches.append(
            {'product': ObjectId(created.inserted_id), 'percentage': []})
        request = {
            "productId": ObjectId(created.inserted_id),
            "url": product['originUrl'],
            "type": RequestType.GET_PRODUCT_INFO.name,
            "status": RequestStatus.PENDING.name
        }
        createRequest(request)
    
    addMatchesToProduct(productId, matches)


async def getReviewsInAmazon(url:str, requestId:str, productId:str):
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
        createManyReviews(reviews)


async def readProductInAmazon(url:str, requestId:str, productId:str):
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
    for key in product:
        metadata[key] = product[key]

    product_description = ''
    if product["product_description"] is not None:
        product_description = product["product_description"]
    updateProduct(productId, {"metadata": metadata, "properties": product_description})
