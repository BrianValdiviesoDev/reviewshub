# REVIEWS HUB

## Quick start

__ATENTION__

First of all you need to set environment variables.

1 - Create an .env file in the root of this project with all the environment variables.

2 - Go to front folder and edit .env file to set as you need. (api url and scrapper url).

### Wake up

Build all images and wake up all

```bash
docker compose up -d --build
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

Create a base company
```bash
db.getCollection("company").insertOne({name:"ReviewsHub"})
```

Take the ObjectId of the company and create a SUPERADMIN user
```bash
db.getCollection("users").insertOne({
    "name" : "Brian Valdivieso",
    "email" : "admin@admin.com",
    "password" : "$2b$10$.BSyPv0/T7wMMzb4Mmiw5.oAaYVp4tex7rzoLCOWjb.rj4183pKA2",
    "rol" : "SUPERADMIN",
    "createdAt" : ISODate("2023-12-06T09:51:05.092+0000"),
    "updatedAt" : ISODate("2023-12-06T09:51:05.092+0000"),
    "__v" : NumberInt(0),
    "company" : ObjectId("your_company_id")
})

```

Now you can log in as admin@admin.com wiht password 123456 in the front.

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

![schema](infra.png)

## Development
You can run docker-compose-infra.yml to run a docker network with mongo, redis and selenium and you can run on your console the front, api and scrapper for development.

```bash
  docker-compose -f docker-compose-infra.yml up -d
```

## Links
[Front](http://localhost:3000/)

[API docs](http://localhost:4000/api)

[Scrapper docs](http://localhost:5000/docs)

[Selenium hub UI](http://localhost:4444/ui)