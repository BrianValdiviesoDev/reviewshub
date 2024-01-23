# REVIEWS HUB

## Quick start

__ATENTION__

First of all you need to set environment variables.

1 - Create an .env file in the root of this project with all the environment variables.

2 - Go to front folder and edit .env file to set as you need. (api url and scrapper url).

### Building Dockers

Build front docker
```bash
cd front
docker build -t reviews-front .
```

Build api docker
```bash
cd api
docker build -t reviews-api .
```

Build scrapper docker
```bash
cd scrapper
docker build -t reviews-scrapper .
```

### Deploy dockers
```bash
docker compose up -d
```

## Prepare MongoDB

Create your database and your user.
```bash
use your_database

db.createUser(
  {
    user: "your_user",
    pwd: "your_password",
    roles: [ { role: "readWrite", db: "your_database" } ]
  }
)
```


## Environment variables
__MONGO_ROOT_USERNAME__ : root username in mongo

__MONGO_ROOT_PASSWORD__ : root password

__MONGO_DB_USERNAME__ : user with access to database


__MONGO_DB_PASSWORD__ : password to access to database

__MONGO_DB_URI__ : mongo db uri as mongodb://rootUser:rootPassword@host:port/databaseName

__OPENAI_API_KEY__ : yout OpenAi token

## Structure
- Mongo: to save all the data
- Redis: to manage a queue of OpenAi querys
- Scrapper: to scrappe
- API: to manage all front querys
- Front: to interact with plattform
- Selenium Hub: to manage all browser instances
- Selenium chrome-node: an instance for scrappe. Here you run a browser and you can build more instances.



## Links
[Front](http://localhost:3000/)

[API docs](http://localhost:4000/api)

[Scrapper docs](http://localhost:5000/docs)

[Selenium hub UI](http://localhost:4444/ui)