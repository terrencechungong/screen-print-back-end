const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const User = require('./models/User');
const Call = require('./models/Call');
const Opportunity = require('./models/Opportunity');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Auth Routes
app.post('/register', async (req, res) => {
  try {
    const { email, password, phoneNumber } = req.body;
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    user = new User({
      email,
      password,
      phoneNumber
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Routes
app.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('pipeline')
      .populate('calls');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Opportunity Routes
app.post('/opportunities', auth, async (req, res) => {
  try {
    const opportunity = new Opportunity(req.body);
    await opportunity.save();
    
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pipeline: opportunity._id }
    });

    res.status(201).json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/opportunities', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('pipeline');
    res.json(user.pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/opportunities/:id', auth, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/opportunities/:id', auth, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/opportunities/:id', auth, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pipeline: req.params.id }
    });

    res.json({ message: 'Opportunity deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Call Routes
app.get('/calls', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('calls');
    res.json(user.calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/calls/:id', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    res.json(call);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bland AI Webhook
app.post('/webhook/bland-ai/call', async (req, res) => {
  try {
    const callData = req.body;
    console.log(callData)
    // Find user by phone number
    const userPhoneNumber = callData.variables.phone_number;
    const user = await User.findOne({ phoneNumber: userPhoneNumber });
    
    if (!user) {
      console.error(`No user found for phone number: ${userPhoneNumber}`);
      return res.status(404).json({ error: 'User not found' });
    }

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

    await User.findByIdAndUpdate(user._id, {
      $push: { calls: newCall._id }
    });

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

// MongoDB Connection
mongoose.connect('mongodb+srv://terrencechungong:qdaFK6cBxJ5CCAw0@cluster0.nwvnp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('MongoDB connection established successfully');
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// MongoDB Connection Error Handling
mongoose.connection.on('error', err => {
  console.error('MongoDB initial connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB connection is disconnected');
});

process.on('SIGINT', () => {
  mongoose.connection.close().then(() => {
    console.log('MongoDB connection is disconnected due to application termination');
    process.exit(0);
  }).catch(err => {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  });
});