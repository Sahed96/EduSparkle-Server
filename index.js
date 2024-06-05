require('dotenv').config()
const express =require('express');
const cors = require('cors');
const stripe = require("stripe")(process.env.STRIPE_KEY)
const app = express();

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sahed96.5o5zjc5.mongodb.net/?retryWrites=true&w=majority&appName=Sahed96`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    await client.connect();

    const scholarshipCollection = client.db('EduSparkleDB').collection('Scholarship')
    const paymentCollection = client.db('EduSparkleDB').collection('payments')
  
    app.get('/allScholarship', async(req,res) =>{
        const result = await scholarshipCollection.find().toArray()
        res.send(result)
    })

    app.get('/scholarshipDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
  
      const result = await scholarshipCollection.findOne(query);
      res.send(result);
  })

  // payment stripe

  app.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price*100)
    console.log(amount,'total price');
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
    
      currency: "usd",
      payment_method_types: ['card']
    });
  
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });

  app.post('/payments', async (req,res) => {
    const payment = req.body
    const result = await paymentCollection.insertOne(payment)

    res.send(result)
  })
  
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req, res)=>{
    res.send('EduSparkle server running')
})

app.listen(port, () => {
    console.log(`EduSparkle server is running on port ${port}`);
})