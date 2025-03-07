"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = exports.postSchema = void 0;
const mongoose_1 = require("mongoose");
const PostVariation_1 = require("./PostVariation");
const includedAccountSchema = new mongoose_1.Schema({
    socialPage: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SocialPage' },
    unique: { type: Boolean, required: true },
});
exports.postSchema = new mongoose_1.Schema({
    includedAccounts: [{ type: includedAccountSchema }],
    postType: { type: String, enum: ['SHORT', 'NORMAL', 'NONE'] },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['SCHEDULED', 'AWAITING_APPROVAL', 'DRAFT'] },
    lastUpdatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    scheduledDate: { type: Date },
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace' },
    hasBeenPostedAtLeastOnce: { type: Boolean },
    postVariations: {
        type: Map, // Map allows dynamic keys
        of: PostVariation_1.postVariationSchema, // Values must match PostVariationType
    },
    conversationMessages: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'ConversationMessage' }],
    notes: { type: String },
    labels: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Label' }],
    pinterestTitle: { type: String },
    youtubeShortsTitle: { type: String }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
// Create the User model from the schema
exports.Post = (0, mongoose_1.model)('Post', exports.postSchema);
