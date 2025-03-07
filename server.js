const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { expressMiddleware } = require('@apollo/server/express4');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');
const User = require('./models/User');
const Call = require('./models/Call');
require('dotenv').config();
const {createServer} = require('http')
const cors = require('cors')

const app = express();
app.use(express.json());
const httpServer = createServer(app);


// Connect to MongoDB

// Auth context middleware
const getUser = token => {
  if (token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Invalid token');
    }
  }
};

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
    const user = getUser(token.replace('Bearer ', ''));
    return { user };
  },
});

// Basic registration endpoint
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add this webhook endpoint
app.post('/webhook/bland-ai/call', async (req, res) => {
  try {
    const callData = req.body;
    
    // // Find user by phone number
    // const userPhoneNumber = callData.variables.phone_number;
    // const user = await User.findOne({ phoneNumber: userPhoneNumber });
    
    // if (!user) {
    //   console.error(`No user found for phone number: ${userPhoneNumber}`);
    //   return res.status(404).json({ error: 'User not found' });
    // }
    console.log(callData)
    // Create new call record
    const newCall = new Call({
      callId: callData.call_id,
      fromNumber: callData.from,
      toNumber: callData.to,
      duration: callData.call_length,
      summary: callData.summary,
      concatenatedTranscript: callData.concatenated_transcript,
      transcripts: callData.transcripts,
      analysis: callData.analysis,
      recordingUrl: callData.recording_url,
      status: callData.status,
      createdAt: callData.created_at
    });

    await newCall.save();

    // Add call to user's calls array
    // await User.findByIdAndUpdate(user._id, {
    //   $push: { calls: newCall._id }
    // });

    res.status(200).json({
      message: 'Call data processed successfully',
      callId: newCall._id
    });

  } catch (error) {
    console.error('Error processing call webhook:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: ${server.graphqlPath}`);
  });
}


console.log('MongoDB URI:', 'mongodb+srv://terrencechungong:qdaFK6cBxJ5CCAw0@cluster0.nwvnp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

mongoose.connect('mongodb+srv://terrencechungong:qdaFK6cBxJ5CCAw0@cluster0.nwvnp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(async () => {
        console.log('MongoDB connection established successfully');
        await server.start();
        app.use('/graphql', cors(), express.json(), expressMiddleware(server));

        const PORT = 5000;
        httpServer.listen(PORT, () => {
            console.log(`Server is now running on http://localhost:${PORT}/graphql`);
        });

        app.listen(3030, () => console.log('S3 API running on port 3030'));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

mongoose.connection.on('error', err => {
    console.error('MongoDB initial connection error:', err);
});
// To handle connection getting disconnected
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB connection is disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
    mongoose.connection.close().then(() => {
        console.log('MongoDB connection is disconnected due to application termination');
        process.exit(0);
    }).catch(err => {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    });
});