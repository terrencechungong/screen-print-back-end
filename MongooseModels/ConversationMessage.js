"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationMessage = exports.conversationMessageSchema = void 0;
const mongoose_1 = require("mongoose");
const ReactionSchema = new mongoose_1.Schema({
    emoji: { type: String, required: true },
    reactor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
});
exports.conversationMessageSchema = new mongoose_1.Schema({
    messageCreator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String },
    replies: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'ConversationMessage' }],
    reactions: { type: [ReactionSchema] },
    hasBeenEdited: { type: Boolean },
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
exports.ConversationMessage = (0, mongoose_1.model)('ConversationMessage', exports.conversationMessageSchema);
