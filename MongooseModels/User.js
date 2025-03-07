"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.userSchema = void 0;
const mongoose_1 = require("mongoose");
exports.userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    // timeZone: { type: String, required: true, enum: ['UTC', 'EST', 'PST', 'CST', 'MST', 'PDT', 'CDT', 'MDT'] },
    // linkedAccounts: {},
    workspaces: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace' }],
    mostRecentWorkspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace' },
    hasCompletedOnboarding: { type: Boolean, default: false },
    profilePicture: { type: String, required: true },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true
    }
    // make a hashmap for workspace to permissions
    // subscriptionLevel: {
    //     type: String,
    //     required: true,
    //     enum: ['Basic', 'Premium', 'Enterprise']
    // },
    // subscriptionExpiration: {
    //     type: Date,
    //     required: false
    // }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
// Create the User model from the schema
exports.User = (0, mongoose_1.model)('User', exports.userSchema);
