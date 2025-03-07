const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Call = require('../models/Call');
const { AuthenticationError, UserInputError } = require('apollo-server-express');

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await User.findById(user.id)
        .populate('pipeline')
        .populate('calls');
    },
    
    opportunity: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const opportunity = await Opportunity.findById(id);
      if (!opportunity) throw new UserInputError('Opportunity not found');
      return opportunity;
    },
    
    opportunities: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const userDoc = await User.findById(user.id).populate('pipeline');
      return userDoc.pipeline;
    },
    
    call: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const call = await Call.findById(id).populate('opportunityId');
      if (!call) throw new UserInputError('Call not found');
      return call;
    },
    
    calls: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const userDoc = await User.findById(user.id).populate({
        path: 'calls',
        populate: { path: 'opportunityId' }
      });
      return userDoc.calls;
    },
    
    callsByOpportunity: async (_, { opportunityId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const calls = await Call.find({ opportunityId }).populate('opportunityId');
      return calls;
    }
  },

  Mutation: {
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new UserInputError('User not found');
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new UserInputError('Invalid password');
      
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return { token, user };
    },
    
    register: async (_, { email, password }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new UserInputError('Email already taken');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password: hashedPassword
      });
      
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return { token, user };
    },
    
    createOpportunity: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const opportunity = await Opportunity.create(input);
      await User.findByIdAndUpdate(user.id, {
        $push: { pipeline: opportunity.id }
      });
      
      return opportunity;
    },
    
    updateOpportunity: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const opportunity = await Opportunity.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true }
      );
      
      if (!opportunity) throw new UserInputError('Opportunity not found');
      return opportunity;
    },
    
    deleteOpportunity: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const opportunity = await Opportunity.findByIdAndDelete(id);
      if (!opportunity) throw new UserInputError('Opportunity not found');
      
      await User.findByIdAndUpdate(user.id, {
        $pull: { pipeline: id }
      });
      
      await Call.deleteMany({ opportunityId: id });
      
      return true;
    },
    
    createCall: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const call = await Call.create(input);
      await User.findByIdAndUpdate(user.id, {
        $push: { calls: call.id }
      });
      
      return await Call.findById(call.id).populate('opportunityId');
    },
    
    updateCall: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const call = await Call.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true }
      ).populate('opportunityId');
      
      if (!call) throw new UserInputError('Call not found');
      return call;
    },
    
    deleteCall: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const call = await Call.findByIdAndDelete(id);
      if (!call) throw new UserInputError('Call not found');
      
      await User.findByIdAndUpdate(user.id, {
        $pull: { calls: id }
      });
      
      return true;
    }
  }
};

module.exports = resolvers; 