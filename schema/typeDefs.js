const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    pipeline: [Opportunity!]
    calls: [Call!]
    createdAt: String!
  }

  type Opportunity {
    id: ID!
    value: Float!
    invoiceGenerated: Boolean!
    invoiceLink: String
    inquiry: String!
    contactInfo: ContactInfo!
  }

  type ContactInfo {
    email: String!
    phoneNumber: String!
    name: String!
    companyName: String!
  }

  type Call {
    id: ID!
    transcriptUrl: String!
    summary: String!
    opportunityId: ID!
    opportunity: Opportunity
    date: String!
  }

  input ContactInfoInput {
    email: String!
    phoneNumber: String!
    name: String!
    companyName: String!
  }

  input OpportunityInput {
    value: Float!
    inquiry: String!
    contactInfo: ContactInfoInput!
  }

  input UpdateOpportunityInput {
    value: Float
    invoiceGenerated: Boolean
    invoiceLink: String
    inquiry: String
    contactInfo: ContactInfoInput
  }

  input CallInput {
    transcriptUrl: String!
    summary: String!
    opportunityId: ID!
  }

  input UpdateCallInput {
    transcriptUrl: String
    summary: String
    opportunityId: ID
  }

  type Query {
    # User queries
    me: User
    
    # Opportunity queries
    opportunity(id: ID!): Opportunity
    opportunities: [Opportunity!]!
    
    # Call queries
    call(id: ID!): Call
    calls: [Call!]!
    callsByOpportunity(opportunityId: ID!): [Call!]!
  }

  type Mutation {
    # User mutations
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!): AuthPayload!
    
    # Opportunity mutations
    createOpportunity(input: OpportunityInput!): Opportunity!
    updateOpportunity(id: ID!, input: UpdateOpportunityInput!): Opportunity!
    deleteOpportunity(id: ID!): Boolean!
    
    # Call mutations
    createCall(input: CallInput!): Call!
    updateCall(id: ID!, input: UpdateCallInput!): Call!
    deleteCall(id: ID!): Boolean!
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;

module.exports = typeDefs; 