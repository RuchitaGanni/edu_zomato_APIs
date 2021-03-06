var moment =require('moment')
var express = require('express');
var app = express();
var dotenv = require('dotenv');
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
dotenv.config();
var mongoUrl = "mongodb+srv://ruchita:ruchita123@cluster0.2ssc4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"; //process.env.MongoLiveUrl;
var cors = require('cors')
const bodyParser = require('body-parser')
var port = process.env.PORT || 8124;

// save the database connection
var db;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// first default route
app.get('/', (req, res) => {
    res.send("Hiii From Node APIs")
})

// return all the city
app.get('/locations', (req, res) => {
    db.collection('locations').find({}, { projection: { _id: 0 } }).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

// return all the mealType
app.get('/mealTypes', (req, res) => {
    db.collection('mealtypes').find().toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

/*
// return all the restaurants
app.get('/restaurants',(req,res) => {
    db.collection('restaurants').find().toArray((err,result) => {
        if(err) throw err;
        res.send(result)
    })
})*/

// restaurant wrt to id
app.get('/restaurant/:id', (req, res) => {
    var id = parseInt(req.params.id);
    db.collection('restaurant').find({ "restaurant_id": id }).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

// query params example
/// wrt to city_name
app.get('/restaurants', (req, res) => {
    var query = {};
    if (req.query.city) {
        query = { state_id: Number(req.query.city) }
    }
    db.collection('restaurant').find(query).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

//find rest wrt to restaurant id
app.get('/restaurants/:restId', (req, res) => {
    var restId = parseInt(req.params.restId);

    db.collection('restaurant').find({ "restaurant_id": restId }).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

// restaurant wrt to mealId
app.get('/filter/:mealId', (req, res) => {
    var id = parseInt(req.params.mealId);
    var sort = { cost: 1 }
    var skip = 0;
    var limit = 1000000000000
    var query = { "mealTypes.mealtype_id": id };
    if (req.query.sortKey) {
        var sortKey = req.query.sortKey
        if (sortKey > 1 || sortKey < -1 || sortKey == 0) {
            sortKey = 1
        }
        sort = { cost: Number(sortKey) }
    }
    if (req.query.skip && req.query.limit) {
        skip = Number(req.query.skip)
        limit = Number(req.query.limit)
    }

    if (req.query.lcost && req.query.hcost) {
        var lcost = Number(req.query.lcost);
        var hcost = Number(req.query.hcost);
    }

    if (req.query.cuisine && req.query.lcost && req.query.hcost) {
        query = {
            $and: [{ cost: { $gt: lcost, $lt: hcost } }],
            "cuisines.cuisine_id": Number(req.query.cuisine),
            "mealTypes.mealtype_id": id
        }
    }
    else if (req.query.cuisine) {
        query = { "mealTypes.mealtype_id": id, "cuisines.cuisine_id": Number(req.query.cuisine) }
        // query = {"mealTypes.mealtype_id":id,"cuisines.cuisine_id":{$in:[2,5]}}
    } else if (req.query.lcost && req.query.hcost) {
        query = { $and: [{ cost: { $gt: lcost, $lt: hcost } }], "mealTypes.mealtype_id": id }
    }

    db.collection('restaurant').find(query).sort(sort).skip(skip).limit(limit).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

// return all the menu of restaurant
app.get('/menu/:restid', (req, res) => {
    var restid = Number(req.params.restid)
    db.collection('rest_menu').find({ restaurant_id: restid }).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

app.post('/menuItem', (req, res) => {
    console.log(req.body);
    db.collection('rest_menu').find({ menu_id: { $in: req.body } }).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })

})

app.put('/updateStatus/:id', (req, res) => {
    var id = Number(req.params.id);
    var status = req.body.status ? req.body.status : "Pending"
    db.collection('orders').updateOne(
        { id: id },
        {
            $set: {
                "date": req.body.date,
                "bank_status": req.body.bank_status,
                "bank": req.body.bank,
                "status": status
            }
        }
    )
    res.send('data updated')
})

// return all the orders against user
app.get('/orders/:email', (req, res) => {
    // console.log(req.params.email)
    db.collection('orders').find({email:req.params.email,orderType:"zomato"}).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

app.post('/placeOrder', (req, res) => {
    console.log(req.body);
    const now = moment();
    let aJsDate = JSON.stringify(now.toDate());
    aJsDate=aJsDate.replace("T"," ").replace("\"","").split(".");
    req.body['date']=aJsDate[0];
    db.collection('orders').insertOne(req.body, (err, result) => {
        if (err) throw err;
        res.send("order placed")
    })
})

app.delete('/deletOrders', (req, res) => {
    db.collection('orders').remove({}, (err, result) => {
        if (err) throw err;
        res.send(result)
    })
})


app.put('/updateDelvStatus', (req, res) => {
    console.log(req.query)
    id = Number(req.query.orderNo);
    let statusMsg="";
    statusCode=Number(req.query.status);
    if(statusCode==2){
        statusMsg="Payment Successful";
    }if(statusCode==3){
        statusMsg="Payment Failed";
    }
    if(statusCode==4){
        statusMsg="Out for Delivery";
    }
    if(statusCode==5){
        statusMsg="Deliveried";
    }

    db.collection('orders').updateOne(
        { orderid: id },
        {
            $set: {
                "date": new Date(),
                "status": statusMsg
            }
        }, (err, result) => {
            if (err) throw err;
           res.send(result)

        }
    )
})


// connecting with mongodb
MongoClient.connect(mongoUrl, (err, client) => {
    if (err) console.log("Error While Connecting");
    db = client.db('edureka');
    app.listen(port, () => {
        console.log(`listening on port ${port}`)
    })
})

