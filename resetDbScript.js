db.getCollection("products").deleteMany({"type":"SCRAPPED"})
db.getCollection("requests").deleteMany({})
db.getCollection("reviews").deleteMany({})
db.getCollection("products").updateMany({"type":"MANUAL"},{$set:{"matches":[], "facts":[], "pipeline":{
        "findInMarketplaces" : false,
        "readProducts" : false,
        "matching" : false,
        "readReviews" : false,
        "buildFacts" : false,
        "done" : false
    }}})
db.getCollection("products").find({})
