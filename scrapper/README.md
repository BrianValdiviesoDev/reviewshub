# Content creator API

A platform to scrape social media contents

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`MONGO_DB_URI` : mongodb://user:pwd@ip:port/database_name

`REVIEWS_HUB_URL` : api url to allow querys

`REVIEWS_BACKOFFICE_URL` : front url to allow querys

`SELENIUM_HUB_URL` : selenium hub url

`DEBUG` : debug mode to print information (true or false)

`HUB_MODE` : true to use selenium hub and false to use chrome in standalone

`PRODUCTS_TO_SEARCH` : number of products to find in scrapping

`REVIEWS_TO_READ` : number of reviews to read in scrapping

## Tech Stack

FastApi, MongoDB

## Installation

### Requirements

Python 3.11.5 or highest

Pip 23.2.1 or highest

MongoDB server

### Development

1. Clone the project

2. (Optional) Create a python environment

```bash
  cd your_project_folder
  python -m venv /env
```

3. Start virtual environment

```bash
    cd your_project_folder/env/Scripts
    ./activate
    cd ../..
```

4. Install packages

```bash
  python -m pip install -r  requirements.txt
```

5. Run locally

```bash
    uvicorn main:app --reload
```

5. Run in debug mode:
   You can see a log in console setting an environment variable

```bash
    DEBUG=true uvicorn main:app --reload
```

5. Run scrapper:
   You need to open another instance of the project in other port to run scrapper and no block api responses

```bash
    uvicorn main:app --reload --port 8002
```

## TODOs

- [x] Refactor: separate platforms from social sources
- [ ] Implements authorization with API Gateway
- [ ] Create a queue of scrapes
- [ ] Add linkedin scraper
- [ ] Add tiktok scraper
- [ ] Add instagram scraper
- [ ] Add facebook scraper
- [ ] Add twitter scraper
- [ ] Add web scraper
- [ ] Add blog scraper
- [ ] Add rss reader
- [ ] Add SEO tools
