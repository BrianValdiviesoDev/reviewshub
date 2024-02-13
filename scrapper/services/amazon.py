from datetime import datetime
import json
import time
from server.mongoClient import db
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from amazoncaptcha import AmazonCaptcha
from server.logger import print_log
from selenium.common.exceptions import WebDriverException
import os
from dotenv import load_dotenv
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
load_dotenv()

collection = db['requests']

refreshCounter = 0

selenium_hub = os.environ.get("SELENIUM_HUB_URL")

debug_mode = os.environ.get("DEBUG")
hub_mode = os.environ.get("HUB_MODE")


class AmazonScrapper:
    def __init__(self, requestID, productID, url=None):
        self.options = Options()
        if debug_mode == False:
            self.options.add_argument("--headless")

        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")

        self.requestID = requestID
        self.productID = productID
        self.url = url
        if hub_mode == 'true':
            self.browser = webdriver.Remote(
                command_executor=selenium_hub,
                options=self.options,
            )
        else:
            self.browser = webdriver.Chrome(options=self.options)

        print_log("Init amazon scrapper", 'info',
                  self.requestID, self.productID)

        self.browser.set_window_size(1920, 4000)

    async def openUrl(self, url):
        try:
            self.url = url
            print_log(f"open url: {url}", 'info',
                      self.requestID, self.productID)
            self.browser.get(url)

            await self.check503()
        except WebDriverException as wde:
            print_log(
                f"Error opening url {url}", 'error', self.requestID, self.productID, json.dumps({'error': str(wde)}))
            raise wde

    async def check503(self):
        print_log("check 503", 'info', self.requestID,
                  self.productID, {"counter": refreshCounter})
        try:
            title = self.browser.title
            print_log(f"Title: {title}", 'info',
                      self.requestID, self.productID)
            if "Sorry" in title:
                print_log("503 title found", 'info',
                          self.requestID, self.productID)
                loopError = await self.refresh()
                if loopError:
                    print_log("Error: sub-frame-error found", 'error',
                              self.requestID, self.productID)
                    self.takeScreenshot("check503")
                    return False
        except WebDriverException as wde:
            print_log("Error: title not found", 'error',
                      self.requestID, self.productID)
            raise wde

        try:
            errorFrame = self.browser.find_element(By.ID, 'sub-frame-error')

            if errorFrame:
                print_log("503 frame found", 'info',
                          self.requestID, self.productID)
                loopError = await self.refresh()
                if loopError:
                    print_log("Error: sub-frame-error found", 'info',
                              self.requestID, self.productID)
                    self.takeScreenshot("check503")
                    return False
        except:
            print_log("Frame error not found", 'info',
                      self.requestID, self.productID)

        try:
            links = self.browser.find_elements(By.TAG_NAME, 'a')
            try:
                for link in links:
                    if link.get_attribute('href').find('/ref=cs_503_logo') != -1:
                        loopError = await self.refresh()
                        if not loopError:
                            await self.check503()
                        return True
            except:
                print_log("Error: href attribute not found in link",
                          'error', self.requestID, self.productID)
        except:
            print_log("Dogs not found", 'info', self.requestID, self.productID)

    async def refresh(self):
        global refreshCounter
        print_log("refreshing", 'info', self.requestID, self.productID)
        if refreshCounter > 5:
            print_log("Error: refreshing loop", 'error',
                      self.requestID, self.productID, json.dump({"counter": refreshCounter}))
            self.takeScreenshot("refresh")
            return False
        self.openNewTab()
        refreshCounter = refreshCounter + 1
        return True

    def openNewTab(self):
        try:
            # Abrir una nueva pestaña o ventana en lugar de refrescar la página actual
            self.browser.execute_script("window.open('', '_blank');")
            self.browser.switch_to.window(self.browser.window_handles[-1])

            self.browser.get(self.url)
            self.browser.refresh()
            time.sleep(5)
            return True

        except WebDriverException as e:
            print_log(
                f"Error during openNewTab: {str(e)}", 'error', self.requestID, self.productID)
            return False

    async def checkCaptcha(self):
        print_log("checking captcha", 'info', self.requestID, self.productID)
        try:
            forms = self.browser.find_elements(By.TAG_NAME, "form")
            captchaUrl = ''
            for form in forms:
                try:
                    action = form.get_attribute('action')
                    if action.lower().find('captcha') != -1:
                        try:
                            captchaUrl = form.find_elements(By.TAG_NAME, 'img')[
                                0].get_attribute('src')
                            break
                        except:
                            print_log(
                                "Error: captcha image not found", 'error', self.requestID, self.productID)
                except:
                    print_log(
                        "Error: action attribute not found in form", 'error', self.requestID, self.productID)

            if captchaUrl != '':
                captcha = AmazonCaptcha.fromlink(captchaUrl)
                captcha = captcha.solve()
                print_log(f"Captcha: {captcha}", 'info',
                          self.requestID, self.productID)
                try:
                    field = self.browser.find_element(
                        By.NAME, 'field-keywords')
                    field.send_keys(captcha)
                    # TODO await to check if captcha is correct
                    try:
                        self.browser.find_element(
                            By.TAG_NAME, 'button').click()
                    except:
                        print_log("Error: button not found", 'error',
                                  self.requestID, self.productID)
                        self.takeScreenshot("checkCaptcha")
                except:
                    print_log(
                        "Error: captcha input not found by name 'field-keywords'", 'error', self.requestID, self.productID)
                    self.takeScreenshot("checkCaptcha")
        except:
            print_log("Error: captcha forms not found",
                      'error', self.requestID, self.productID)
            self.takeScreenshot("checkCaptcha")

    async def acceptCookies(self):
        print_log("accepting cookies", 'info', self.requestID, self.productID)
        try:
            cookies_dialog = self.browser.find_element(By.ID, 'sp-cc')
            if cookies_dialog.is_displayed():
                cookies_dialog.find_element(By.ID, 'sp-cc-accept').click()
                # TODO await to check if cookies are accepted
        except:
            print_log("Error: cookies dialog not found",
                      'warning', self.requestID, self.productID)

    async def findProducts(self, url, min_results=5):
        print_log(f"searching products", 'info',
                  self.requestID, self.productID)
        products_founded = []
        pages = 1
        while len(products_founded) < min_results:
            await self.openUrl(f"{url}&page={pages}")
            pages = pages+1

            if (pages > 3 and len(products_founded) == 0):
                print_log("Error: no products found", 'error',
                          self.requestID, self.productID)
                return product_founded

            try:
                results = self.browser.find_element(
                    By.CLASS_NAME, 's-result-list')

                try:
                    products = results.find_elements(
                        By.CLASS_NAME, 's-result-item')

                    for product in products:
                        if len(products_founded) >= min_results:
                            break
                        try:
                            uuid = product.get_attribute('data-uuid')
                        except:
                            uuid = ''
                            print_log(f"UUID not found", 'warning',
                                      self.requestID, self.productID)

                        try:
                            asin = product.get_attribute('data-asin')
                        except:
                            asin = ''
                            print_log(f"ASIN not found", 'warning',
                                      self.requestID, self.productID)

                        if uuid:
                            try:
                                sponsored = product.find_element(
                                    By.CLASS_NAME, 'puis-sponsored-label-info-icon')
                                sponsored = True
                            except:
                                sponsored = False

                            try:
                                title_h2 = product.find_element(
                                    By.TAG_NAME, 'h2')
                                title = title_h2.text

                                try:
                                    product_url = title_h2.find_element(
                                        By.TAG_NAME, 'a').get_attribute('href')
                                except:
                                    product_url = ""
                                    print_log(
                                        f"URL by tag 'a' in product with uuid: {uuid} not found", 'warning', self.requestID, self.productID)
                            except:
                                title = ""
                                print_log(
                                    f"Title by tag 'h2' in product with uuid: {uuid} not found", 'warning', self.requestID, self.productID)

                            try:
                                image = product.find_element(
                                    By.TAG_NAME, 'img').get_attribute('src')
                            except:
                                image = ""
                                print_log(
                                    f"Image by tag 'img' in product with uuid: {uuid} not found", 'warning', self.requestID, self.productID)
                            try:
                                price = product.find_element(
                                    By.CLASS_NAME, 'a-price').text
                            except:
                                price = ""
                                print_log(
                                    f"Price by class 'a-price' in product with uuid: {uuid} not found", 'warning', self.requestID, self.productID)

                            try:
                                reviews_div = product.find_element(
                                    By.CLASS_NAME, 'a-row.a-size-small')
                                reviews = reviews_div.find_element(
                                    By.CLASS_NAME, 'a-size-base').text
                                try:
                                    rating_div = reviews_div.find_element(
                                        By.TAG_NAME, 'span')
                                    rating = rating_div.get_attribute(
                                        'aria-label')
                                except:
                                    rating = ""
                                    print_log(
                                        f"Rating by tag 'span' in product with uuid: {uuid} not found", 'warning', self.requestID, self.productID)
                            except:
                                reviews = ""
                                rating = ""
                                print_log(
                                    f"Reviews by class 'a-row.a-size-small' in product with uuid: {uuid} not found", 'warning', self.requestID, self.productID)

                            product_founded = {
                                "name": title,
                                "originUrl": product_url,
                                "image": image,
                                "price": price,
                                "rating": rating,
                                "reviews": reviews,
                                "metadata": {
                                    "amazon_uuid": uuid,
                                    "amazon_asin": asin,
                                    "sponsored": sponsored,
                                },
                            }
                            if title != "" and product_url != "":
                                products_founded.append(product_founded)

                except:
                    print_log(
                        f"Error getting products by class 's-result-item'", 'error', self.requestID, self.productID)
                    self.takeScreenshot("findProducts")
                    return products_founded
            except:
                print_log(
                    f"Error getting results by class 's-result-list'", 'error', self.requestID, self.productID)
                self.takeScreenshot("findProducts")
                return products_founded
        return products_founded

    async def getReviewsStats(self, url):
        print_log(f"getting reviews stats", 'info',
                  self.requestID, self.productID)
        await self.openUrl(f"{url}")
        await self.checkCaptcha()
        await self.acceptCookies()
        try:
            reviews_section = self.browser.find_element(
                By.ID, 'reviewsMedley')
            try:
                rating_histogram = reviews_section.find_element(
                    By.ID, 'cm_cr_dp_d_rating_histogram')
                total_reviews = rating_histogram.find_element(
                    By.CLASS_NAME, 'averageStarRatingNumerical').text

                average_reviews_div = rating_histogram.find_element(
                    By.CLASS_NAME, 'AverageCustomerReviews')
                spans = average_reviews_div.find_elements(By.TAG_NAME, 'span')

            except:
                print_log(
                    f"Results by ID 'cm_cr_dp_d_rating_histogram' not found", 'warning', self.requestID, self.productID)

            try:
                histogram_table = reviews_section.find_element(
                    By.ID, 'histogramTable')
                histogram_rows = histogram_table.find_elements(
                    By.TAG_NAME, 'tr')

                five_stars = histogram_rows[0].find_elements(By.TAG_NAME, 'td')[
                    2].text

                four_stars = histogram_rows[1].find_elements(By.TAG_NAME, 'td')[
                    2].text

                three_stars = histogram_rows[2].find_elements(By.TAG_NAME, 'td')[
                    2].text

                two_stars = histogram_rows[3].find_elements(By.TAG_NAME, 'td')[
                    2].text

                one_stars = histogram_rows[4].find_elements(By.TAG_NAME, 'td')[
                    2].text

                return {
                    "total_reviews": total_reviews,
                    "five_stars": five_stars,
                    "four_stars": four_stars,
                    "three_stars": three_stars,
                    "two_stars": two_stars,
                    "one_stars": one_stars,
                }
            except:
                print_log(
                    f"Error getting results by ID 'histogramTable'", 'error', self.requestID, self.productID)
        except:
            print_log(
                f"Error getting results by ID 'reviewsMedley'", 'error', self.requestID, self.productID)
            self.takeScreenshot("getReviewsStats")

    async def scrapeReviews(self, url, min_results=100):
        print_log(f"scrapping reviews", 'info', self.requestID, self.productID)
        await self.openUrl(f"{url}")
        await self.checkCaptcha()
        await self.acceptCookies()
        try:
            footer = self.browser.find_element(
                By.ID, 'reviews-medley-footer')
            all_reviews_link = footer.find_element(By.TAG_NAME, 'a')
            all_reviews_link.click()
        except:
            print_log(
                f"Results by ID 'reviews-medley-footer' not found", 'warning', self.requestID, self.productID)
            self.takeScreenshot("scrapeReviews")
            return []

        reviews_founded = []
        while len(reviews_founded) < min_results:
            try:
                global_info = self.browser.find_element(
                    By.ID, 'filter-info-section').text
            except:
                print_log(
                    f"Results by ID 'filter-info-section' not found", 'warning', self.requestID, self.productID)

            try:
                reviews = self.browser.find_elements(By.CLASS_NAME, 'review')
                counter = 0
                for review in reviews:
                    counter = counter+1
                    print(f"reading review {counter}/{len(reviews)}")
                    try:
                        review_id = review.get_attribute('id')
                    except:
                        review_id = ''
                        print_log(
                            f"Attribute 'id' not found", 'warning', self.requestID, self.productID)

                    try:
                        user_profile = review.find_element(
                            By.CLASS_NAME, 'a-profile')
                        user_profile_link = user_profile.get_attribute('href')
                        try:
                            username = user_profile.find_element(
                                By.CLASS_NAME, 'a-profile-name').text
                        except:
                            username = ''
                            print_log(
                                f"Username by class 'a-profile-name' not found", 'warning', self.requestID, self.productID)

                        try:
                            userAvatar = user_profile.find_element(
                                By.TAG_NAME, 'img').get_attribute('src')
                        except:
                            userAvatar = ''
                            print_log(
                                f"UserAvatar by tag 'img' not found", 'warning', self.requestID, self.productID)
                    except:
                        username = ''
                        userAvatar = ''
                        print_log(
                            f"User profile by class 'a-profile' not found", 'warning', self.requestID, self.productID)

                    try:
                        stars_classes = review.find_element(
                            By.CLASS_NAME, 'review-rating').get_attribute('class')
                        try:
                            rating = stars_classes.split(
                                'a-star-')[1].split(' ')[0]
                        except:
                            rating = ''
                            print_log(
                                f"Can not split star classes by 'a-star-'", 'warning', self.requestID, self.productID)
                    except:
                        rating = ''
                        print_log(
                            f"Stars by class 'review-rating' not found", 'warning', self.requestID, self.productID)

                    try:
                        reviewDate = review.find_element(
                            By.CLASS_NAME, 'review-date').text
                    except:
                        reviewDate = ''
                        print_log(
                            f"Date by class 'review-date' not found", 'warning', self.requestID, self.productID)

                    try:
                        title_div = review.find_element(
                            By.CLASS_NAME, 'review-title')
                        title = title_div.text

                        try:
                            review_url = title_div.get_attribute('href')
                        except:
                            review_url = ''
                            print_log(
                                f"Review url by tag 'a' not found", 'warning', self.requestID, self.productID)
                    except:
                        title = ''
                        print_log(
                            f"Ttitle by class 'review-title' not found", 'warning', self.requestID, self.productID)

                    try:
                        description = review.find_element(
                            By.CLASS_NAME, 'review-text-content').text
                    except:
                        description = ''
                        print_log(
                            f"Description by class 'review-text-content' not found", 'warning', self.requestID, self.productID)

                    review_founded = {
                        "url": review_url,
                        "title": title,
                        "description": description,
                        "rating": rating,
                        "username": username,
                        "userAvatar": userAvatar,
                        "reviewDate": reviewDate,
                        "metadata": {
                            'amazon_review_id': review_id,
                            'amazon_user_profile': user_profile_link,
                        },
                    }
                    reviews_founded.append(review_founded)
            except:
                print_log(
                    f"Error getting results by class 'review'", 'error', self.requestID, self.productID)
                break

            try:
                print_log("getting next page", 'info',
                          self.requestID, self.productID)
                next_button = self.browser.find_element(
                    By.CLASS_NAME, 'a-last')
                if next_button.get_attribute('class').find('a-disabled') != -1:
                    print_log("No more pages", 'info',
                              self.requestID, self.productID)
                    break
                next_button.click()
            except:
                print_log(
                    f"Error getting next button by class 'a-last'", 'error', self.requestID, self.productID)
                break

        return reviews_founded

    async def scrapeProductInfo(self, url):
        print_log(f"scrapping product info", 'info',
                  self.requestID, self.productID)

        try:
            await self.openUrl(f"{url}")
        except WebDriverException as wde:
            print_log(
                f"Error opening url {url}", 'error', self.requestID, self.productID, json.dumps({'error': str(wde)}))
            raise wde

        await self.checkCaptcha()
        await self.acceptCookies()
        product_overview = {}
        product_specs = {}
        features = ""
        product_description = ""

        try:
            product_overview_div = self.browser.find_element(
                By.ID, 'poExpander')
            try:
                product_overview_table = product_overview_div.find_elements(
                    By.TAG_NAME, 'table')[0]
                rows = product_overview_table.find_elements(By.TAG_NAME, 'tr')
                product_overview = {}
                for row in rows:
                    columns = row.find_elements(By.TAG_NAME, 'td')
                    product_overview[columns[0].text] = columns[1].text
            except:
                product_overview = {}
                print_log(
                    "No table find by tag name 'table' in product overview div", 'warning', self.requestID, self.productID)
        except:
            print_log(
                "No product overview find by id 'poExpander'", 'warning', self.requestID, self.productID)

        try:
            features = self.browser.find_element(
                By.ID, 'featurebullets_feature_div').text
        except:
            print_log(
                "No features div find by id 'featurebullets_feature_div'", 'warning', self.requestID, self.productID)

        try:
            product_specs_table = self.browser.find_element(
                By.ID, 'productDetails_techSpec_section_1')
            product_specs = {}
            rows = product_specs_table.find_elements(By.TAG_NAME, 'tr')
            for row in rows:
                try:
                    field = row.find_element(By.TAG_NAME, 'th')
                    value = row.find_element(By.TAG_NAME, 'td')
                    product_specs[field.text] = value.text
                except:
                    print_log("No th or td tag find in row of productDetails_techSpec_section_1",
                              'warning', self.requestID, self.productID)
        except:
            print_log(
                "No product specs table find by id 'productDetails_techSpec_section_1'", 'warning', self.requestID, self.productID)

        try:
            product_description = self.browser.find_element(
                By.ID, 'productDescription').text
        except:
            print_log(
                "No product description find by id 'productDescription'", 'warning', self.requestID, self.productID)

        return {
            "product_overview": product_overview,
            "features": features,
            "product_specs": product_specs,
            "product_description": product_description,
        }

    def close(self):
        try:
            print_log(f"closing session {self.browser.session_id}", 'info', self.requestID,
                      self.productID, json.dumps({'session_id': self.browser.session_id}))
            self.browser.quit()
            self.browser.close()
        except:
            print_log(f"Error closing session {self.browser.session_id}", 'error', self.requestID, self.productID, json.dumps(
                {'session_id': self.browser.session_id}))

    def takeScreenshot(self, origin: str):
        try:
            date = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
            path = f'{date}_{self.requestID}_{self.productID}_{origin}'
            print_log(f"taking screenshot", 'info', self.requestID, self.productID, json.dumps(
                {'screenshot': f'screenshots/{path}.png'}))

            result = self.browser.save_screenshot(
                f'logs/screenshots/{path}.png')
            if not result:
                print_log(f"Error taking screenshot", 'error', self.requestID, self.productID, json.dumps(
                    {'screenshot': f'logs/screenshots/{path}.png'}))
        except Exception as e:
            print_log(f"Error taking screenshot", 'error', self.requestID, self.productID, json.dumps(
                {'screenshot': f'logs/screenshots/{path}.png', 'error': str(e)}))
