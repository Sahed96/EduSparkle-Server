require('dotenv').config()
const express =require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const stripe = require("stripe")(process.env.STRIPE_KEY)
const app = express();

const port = process.env.PORT || 5000;



app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://edu-sparkle-2959f.web.app",
      
    ]
  })
);
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
    // await client.connect();

    const scholarshipCollection = client.db('EduSparkleDB').collection('Scholarship')
    const paymentCollection = client.db('EduSparkleDB').collection('payments')
    const applicantCollection = client.db('EduSparkleDB').collection('applicants')
    const reviewCollection = client.db('EduSparkleDB').collection('reviews')
    const userCollection = client.db('EduSparkleDB').collection('users')


     // jwt related api
     app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '24h' });
      res.send({ token });
    })

    // middleware

    const verifyToken = (req, res, next) => {
      
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

  
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

  
    app.post('/users', async(req,res) => {
      const user = req.body
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users',verifyToken,verifyAdmin, async(req,res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.patch('/users', async(req,res) => {
      const email = req.query.email
      const value = req.query.value
      const result = await userCollection.findOneAndUpdate(
       {email: email}, {$set: {role: value}} 
      )
      res.send(result)
    })

    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      
      const user = await userCollection.findOne({ email });
      let userRole = '';
      if (user?.role === 'admin') {
        userRole = 'admin';
      }
      if (user?.role === 'moderator') {
        userRole = 'moderator';
      }
      res.send({ userRole });
    });

    app.get('/allScholarship', async(req,res) =>{
        const result = await scholarshipCollection.find().toArray()
        res.send(result)
    })

    app.get('/count',verifyToken,verifyAdmin, async(req,res) => {
      const appliedCount = await applicantCollection.estimatedDocumentCount()
      const scholarshipCount = await scholarshipCollection.estimatedDocumentCount()
      res.send({appliedCount,scholarshipCount})
    })

    app.get('/topScholarship', async(req,res) =>{
      const sort = req.query.sort
      if(sort === 'fees'){
        const result = await scholarshipCollection.find().sort({Application_Fees: 1}).limit(6).toArray()
       return res.send(result)
      }

        const result = await scholarshipCollection.find().limit(6).toArray()
        res.send(result)
    })

    
    app.get('/scholarshipDetails/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
  
      const result = await scholarshipCollection.findOne(query);
      res.send(result);
  })

  app.get('/applicant/:id',verifyToken, async (req,res) => {
    const id = req.params.id
    
    const result= await paymentCollection.findOne({transactionId: id})
    res.send(result)
  })

  app.post('/applicantData',verifyToken, async (req, res) => {
    const applied = req.body;
    
    const result = await applicantCollection.insertOne(applied)
    res.send(result)
  })

  app.post('/addScholarship',verifyToken, async (req, res) => {
    const addData = req.body;
    
    const result = await scholarshipCollection.insertOne(addData)
    res.send(result)
  })

  app.get('/allAppliedApplication',verifyToken, async(req,res) => {
    const result = await applicantCollection.find().toArray()
    res.send(result)
  })


  app.post('/reviewData',verifyToken, async (req, res) => {
    const review = req.body;
    
    const result = await reviewCollection.insertOne(review)
    res.send(result)
  })

  app.get('/myReviews/:email',verifyToken, async(req,res) => {
    const email = req.params.email
    const result = await reviewCollection.find({email}).toArray()
    res.send(result)
  })

  app.get('/allReview', async(req,res) => {
    
    const result = await reviewCollection.find().toArray()
    res.send(result)
  })

  app.get('/singleApplyData/:id', async(req,res)=> {
    const id = req.params.id
    const result = await applicantCollection.findOne({scholarshipId: id}) 
    res.send(result)
  })

  app.get('/applicantDetails/:id',verifyToken, async(req,res)=> {
    const id = req.params.id
    const result = await applicantCollection.findOne({_id: new ObjectId(id)}) 
    res.send(result)
  })

  app.patch('/applicantStatus/:id',verifyToken, async(req,res) => {
    const id =req.params.id
    const filter = {_id: new ObjectId(id)}
    const updateDoc = {
      $set: {
        status: 'rejected'
      }
    }
    const result = await applicantCollection.updateOne(filter,updateDoc)
    res.send(result)
  })

  app.patch('/adminFeedback/:id',verifyToken, async(req,res) => {
    const id =req.params.id
    const data = req.body.feedback

    const filter = {_id: new ObjectId(id)}
    const updateDoc = {
      $set: {
        feedback: data
      }
    }
    const result = await applicantCollection.updateOne(filter,updateDoc)
    res.send(result)
  })

  app.delete('/handleDelete',verifyToken, async(req,res) => {
    const id = req.query.id
    const api = req.query.api
    if(api === 'applicationDelete'){
      const result = await applicantCollection.deleteOne({_id: new ObjectId(id)})
    res.send(result)
    }
    if(api === 'reviewDelete'){
      const result = await reviewCollection.deleteOne({_id: new ObjectId(id)})
    res.send(result)
    }
    if(api === 'userDelete'){
      const result = await userCollection.deleteOne({_id: new ObjectId(id)})
    res.send(result)
    }
    if(api === 'scholarshipDelete'){
      const result = await scholarshipCollection.deleteOne({_id: new ObjectId(id)})
    res.send(result)
    }
  })


  app.get('/myApplication/:email',verifyToken, async (req, res) =>{
    const email = req.params.email
 
    const result = await applicantCollection.find({email}).toArray();
    res.send(result);
  })

  // payment stripe

  app.post("/create-payment-intent",verifyToken, async (req, res) => {
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

  app.post('/payments',verifyToken, async (req,res) => {
    const payment = req.body
    const result = await paymentCollection.insertOne(payment)

    res.send(result)
  })
  
    
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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