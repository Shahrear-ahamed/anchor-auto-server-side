const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.PAYMENT_API_KEY);
const port = process.env.PORT || 5000;
const app = express();

// middleware are here
app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = header.split(" ")[1];
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decode = decode;
      next();
    });
  }
};

/**
 * ---------------------------------
 *
 * ----- database connection -------
 *
 * ---------------------------------
 */

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6rafhhf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();

    // database
    const productCollection = client.db("anchor-auto").collection("products");
    const userCollection = client.db("anchor-auto").collection("users");
    const blogCollection = client.db("anchor-auto").collection("blogs");
    const orderCollection = client.db("anchor-auto").collection("orders");
    const userInfoCollection = client
      .db("anchor-auto")
      .collection("use-information");

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decode.email;
      const requestedAccount = await userCollection.findOne({
        email: decodedEmail,
      });
      if (requestedAccount.role === "admin") {
        next();
      } else {
        res.status(403).code({ message: "Forbidden Access" });
      }
    };
    // make payment intent
    app.post("/make-payment", verifyJwt, async (req, res) => {
      const paymentInfo = req.body;
      const price = paymentInfo.price;
      const amount = price * 100;
      const payment_Intent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: payment_Intent.client_secret });
    });

    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    // make user collection

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email };
      const updatedData = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updatedData, {
        upsert: true,
      });
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ result, token });
    });
    app.put("/userupdate/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const filter = { _id: ObjectId(id) };
      const updateData = {
        $set: user,
      };
      const result = await userInfoCollection.updateOne(filter, updateData, {
        upsert: true,
      });
      res.send(result);
    });

    // get products api
    app.get("/homeproduct", async (req, res) => {
      const result = await productCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get("/product/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    // post order for order
    app.post("/order/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decode.email;
      const order = req.body;
      if (email === decodedEmail) {
        const result = await orderCollection.insertOne(order);
        const successMessage = {
          ...result,
          message: "Your order successfully places,keep Patience for delivery",
        };
        res.send(successMessage);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });
    // get my orders
    app.get("/myorder/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const result = await orderCollection.find(filter).toArray();
      res.send(result);
    });
    // get single order
    app.get("/singleorderitem/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(filter);
      res.send(result);
    });

    // get admin and dashboard data
    app.get("/user/:email", verifyJwt, async (req, res) => {
      const email = req.decode.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    // get home page news and blogs from database
    app.get("/news", async (req, res) => {
      const result = await blogCollection.find().limit(3).toArray();
      res.send(result);
    });
    app.get("/news/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });
  } finally {
    // client.close()
  }
};
run().catch(console.dir);

/**
 * ---------------------------------
 *
 * ---- server response from -------
 *
 * ---------------------------------
 */

app.get("/", (req, res) => {
  res.send("Anchor tools manufacturer server is running");
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
