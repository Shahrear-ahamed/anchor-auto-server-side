const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

// middleware are here
app.use(cors());
app.use(express.json());

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

    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
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
