const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const User = require('./models/User');
const Call = require('./models/Call');
const Opportunity = require('./models/Opportunity');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();
const OpenAI = require('openai');
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-9622dc4529a04a32836ca4e44ceca0f6'
});

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

// Function to send email
const sendEmail = async (from, subject, text, password, to, name="") => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'terrencechungong@gmail.com',
      pass: 'yafg picr outr fvrh' // Generate an app-specific password in Google Accountiqjf dmuq ltxe onyt
 
    }
  });

  const mailOptions = {
    from: from,
    to: 'squeezeplayhi@gmail.com',
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
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
      phoneNumber: '+14154498579',
      personalPhoneNumber: phoneNumber
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
app.get('/me', async (req, res) => {
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
app.post('/opportunities', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const opportunity = new Opportunity(req.body);
    console.log('Created opportunity:', opportunity);
    
    await opportunity.save();
    console.log('Saved opportunity');
    
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pipeline: opportunity._id }
    });
    console.log('Updated user pipeline');

    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/opportunities', async (req, res) => {
  try {
    const { id } = req.query;
    console.log('Fetching opportunities',  `for ID: ${id}`);
    const user = await User.findById(id).populate('pipeline');
    console.log('Found user with populated pipeline:', user);
    res.json(user.pipeline);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/opportunities/:id', async (req, res) => {
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

app.put('/opportunities/:id', async (req, res) => {
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

app.delete('/opportunities/:id', async (req, res) => {
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
app.get('/calls', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('calls');
    res.json(user.calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/calls/:id', async (req, res) => {
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
     console.log(callData);

    // Find user by phone number
    const userPhoneNumber = callData.variables.to;
    const user = await User.findOne({ phoneNumber: '1111111111' });

    if (!user) {
      console.error(`No user found for phone number: ${userPhoneNumber}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract name and email from the transcript using Deepseek
    
    // Summarize the inquiry using Deepseek
    const inquirySummary = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: callData.concatenated_transcript }
      ],
      model: "deepseek-chat",
    });

    const summaryText = inquirySummary.choices[0].message.content;

    // Generate follow-up email content using OpenAI
    const emailResponse = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant tasked with writing professional follow-up emails. Write in a friendly but professional tone."
        },
        { 
          role: "user", 
          content: `Write a follow up email for ${callData.analysis.name}. The call summary is: ${summaryText}. Include the summary and ask if they have any questions.`
        }
      ],
      model: "deepseek-chat",
    });

    const followUpEmailContent = emailResponse.choices[0].message.content;

    // Send email to the user
    await sendEmail(user.email, 'Follow-up on Your Inquiry', followUpEmailContent, user.password, callData.analysis.email);



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

    // Create new opportunity from call data
    const newOpportunity = new Opportunity({
      name: callData.analysis.name,
      stage: 'NEW LEAD',
      source: 'call',
      inquiry: summaryText,
      contactInfo: {
        email: callData.analysis.email,
        phoneNumber: callData.analysis.phone,
        name: callData.analysis.name,
        companyName: callData.analysis.company || 'Not provided'
      }
    });

    await newOpportunity.save();

    // Add opportunity to user's pipeline
    await User.findByIdAndUpdate(user._id, {
      $push: { pipeline: newOpportunity._id }
    });

    
    // Optionally, add call to user's calls array
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

// Order Form API
app.post('/api/order', async (req, res) => {
  try {
    const { userId, name, designDetails, quantity, size, color, email, phone } = req.body;
    console.log('Order form request body:', req.body);

    // Fetch the user from the database using the provided userId
    const user = await User.findById(userId);
    console.log('Found user:', user);
    
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the inquiry text
    const inquiryText = `Order Details:\nDesign: ${designDetails}\nQuantity: ${quantity}\nSize: ${size}\nColor: ${color}`;
    console.log('Created inquiry text:', inquiryText);

    // Create a new opportunity
    const newOpportunity = new Opportunity({
      name: name,
      stage: 'NEW LEAD', 
      source: 'order form',
      inquiry: inquiryText,
      contactInfo: {
        email: email,
        phoneNumber: phone,
        name: name || 'Customer',
        companyName:  'Not provided'
      }
    });
    console.log('Created new opportunity:', newOpportunity);

    await newOpportunity.save();
    // Add the opportunity to the user's pipeline
    await User.findByIdAndUpdate(userId, {
      $push: { pipeline: newOpportunity._id }
    });
    console.log('Saved opportunity');

    // Send follow-up email using OpenAI
    const followUpEmailContent = await generateFollowUpEmail(inquiryText, user.email, name);
    console.log('Generated follow-up email content');

    // Send the email
    await sendEmail('terrencechungong@gmail.com', 'Thank you for your order!', followUpEmailContent, user.password, email, name);
    console.log('Sent follow-up email');

    res.status(201).json({ message: 'Order submitted successfully', opportunityId: newOpportunity._id });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Function to generate follow-up email content using OpenAI
const generateFollowUpEmail = async (inquiryText, userEmail, name) => {
  const emailResponse = await openai.chat.completions.create({
    messages: [
      { 
        role: "system", 
        content: "You are a helpful assistant tasked with writing professional follow-up emails. Write in a friendly but professional tone."
      },
      { 
        role: "user", 
        content: `Write a follow-up email for an order inquiry. The details are: ${inquiryText}. Include a thank you note and ask if they have any questions. The name of the customer is ${name}.`
      }
    ],
    model: "deepseek-chat",
  });

  return emailResponse.choices[0].message.content;
};

// MongoDB Connection
mongoose.connect('mongodb+srv://terrencechungong:qdaFK6cBxJ5CCAw0@cluster0.nwvnp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('MongoDB connection established successfully');
    const PORT = process.env.PORT || 5000;
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