const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

// middleware are here
app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const header = req.header.authorization;
  if (!header) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = header.split(" ")[1];
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decode == decode;
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

    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    // make user collection

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      console.log(user);
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

    // get products api
    app.get("/homeproduct", async (req, res) => {
      const result = await productCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
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
