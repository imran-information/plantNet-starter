require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')


const port = process.env.PORT || 9000
const app = express()
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eedxn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {
    // plantNet db collections 
    const db = client.db('plantNet')
    const usersCollection = db.collection('users');
    const plantsCollection = db.collection('plants')
    const ordersCollection = db.collection('orders')

    // verify Admin middleware 
    const verifyAdmin = async (req, res, next) => {
      const email = req.user.email;
      const user = await usersCollection.findOne({ email })
      if (!user || user.role !== 'admin') {
        return res.status(401).send({ message: 'Unauthorized access' })
      }
      next()
    }
    // verify Seller middleware 
    const verifySeller = async (req, res, next) => {
      const email = req.user.email;
      const user = await usersCollection.findOne({ email })
      if (!user || user.role !== 'seller') {
        return res.status(401).send({ message: 'Unauthorized access' })
      }
      next()
    }

    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // save or update a user db
    app.post('/users/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const newUser = req.body
        const exitUser = await usersCollection.findOne({ email: email });
        if (exitUser) {
          res.send({ message: 'user already exist' })
          return;
        }
        const result = await usersCollection.insertOne({ ...newUser, role: 'customer', timestamp: new Date() })
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // get all user data 
    app.get('/users/:email', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const email = req.params.email;
        console.log(email);
        const query = {
          email: {
            $ne: email
          }
        }
        const result = await usersCollection.find(query).toArray()
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })
    // get role specific user  
    app.get('/users/role/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        const { role } = await usersCollection.findOne({ email })
        res.send(role)
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // update & modify a user role by admin
    app.patch('/users/role/:email', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const email = req.params.email;
        const { role } = req.body;
        const query = { email: email };
        const updateDoc = {
          $set: {
            role: role,
            status: 'Verified',
          },
        };
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
      } catch (err) {
        res.status(500).send(err);
      }
    });
    // customer update role request send to admin
    app.patch('/users/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email }
        const user = await usersCollection.findOne(query)
        if (!user || user.status === 'Requested') return res.status(409).send({ message: 'You Have already requested, please wait some time' })
        const updateDoc = {
          $set: {
            status: 'Requested',
          }
        }
        const result = await usersCollection.updateOne(query, updateDoc)
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // save a plant db
    app.post('/plants', verifyToken, verifySeller, async (req, res) => {
      try {
        const plant = req.body;
        const result = await plantsCollection.insertOne(plant);
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // a seller specific get all plant data
    app.get('/plants/seller', verifyToken, verifySeller, async (req, res) => {
      try {
        const email = req.user.email;
        const query = { 'seller.email': email }
        const result = await plantsCollection.find(query).toArray()
        res.send(result)
      } catch (err) {
        res.status(500).send
      }
    })

    // delete a plant data by id
    app.delete('/plants/:id', verifyToken, verifySeller, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await plantsCollection.deleteOne(query)
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })


    // get all plant data 
    app.get('/plants', async (req, res) => {
      try {
        const result = await plantsCollection.find().toArray()
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })
    // get a plant data by id
    app.get('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await plantsCollection.findOne(query)
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })
    // save a plant order db 
    app.post('/orders', verifyToken, async (req, res) => {
      try {
        const orderInfo = req.body;
        // console.log(orderInfo);
        const result = await ordersCollection.insertOne(orderInfo);
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })
    // increase/decrease a plant quantity data by id 
    app.patch('/plants/quantity/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const { updatedQuantity, status } = req.body;
        // console.log(updatedQuantity);
        const query = { _id: new ObjectId(id) }
        let updateDoc = {
          $inc: {
            quantity: -updatedQuantity
          },
        }
        if (status === 'increase') {
          updateDoc = {
            $inc: {
              quantity: updatedQuantity
            },
          }
        }
        const result = await plantsCollection.updateOne(query, updateDoc)
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })
    // specific customer  get all orders data Using aggregation
    app.get('/orders/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        const result = await ordersCollection.aggregate([
          {
            $match: { 'customer.email': email }
          },
          {
            $addFields: {
              plantId: { $toObjectId: '$plantId' },
            },
          },
          {
            $lookup: {
              from: 'plants',
              localField: 'plantId',
              foreignField: '_id',
              as: 'plants',
            }
          },
          {
            $unwind: '$plants'
          },
          {
            $addFields: {
              name: '$plants.name',
              category: '$plants.category',
              image: '$plants.image',
            }
          },
          {
            $project: {
              plants: 0
            }
          }
        ]).toArray()
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // specific seller/:email  get all orders data Using aggregation
    app.get('/orders', verifyToken, verifySeller, async (req, res) => {
      try {
        const email = req.user.email;
        console.log(email);
        const result = await ordersCollection.aggregate([
          {
            $match: { 'seller.email': email }
          },
          {
            $addFields: {
              plantId: { $toObjectId: '$plantId' },
            },
          },
          {
            $lookup: {
              from: 'plants',
              localField: 'plantId',
              foreignField: '_id',
              as: 'plants',
            }
          },
          {
            $unwind: '$plants'
          },
          {
            $addFields: {
              name: '$plants.name',
            }
          },
          {
            $project: {
              plants: 0
            }
          }
        ]).toArray()
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })
    // order cancel/delete by id 
    app.delete('/orders/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const { status } = await ordersCollection.findOne(query)
        console.log(status);
        if (status === 'Delivered') {
          return res.status(409).send({ message: 'Your Order already delivered..' })

        }
        const result = await ordersCollection.deleteOne(query)
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // update a order status by id
    app.patch('/orders/status/:id', verifyToken, verifySeller, async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const query = { _id: new ObjectId(id) }
        const updateDoc = {
          $set: {
            status: status,
          }
        }
        const result = await ordersCollection.updateOne(query, updateDoc)
        res.send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })



    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from plantNet Server..')
})

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`)
})
