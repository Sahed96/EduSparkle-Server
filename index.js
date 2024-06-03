const express =require('express');
const cors = require('cors');

const app = express();

require('dotenv').config()
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sahed96.5o5zjc5.mongodb.net/?retryWrites=true&w=majority&appName=Sahed96`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
  
    app.get('/allScholarship', async(req,res) =>{
        const result = await scholarshipCollection.find().toArray()
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