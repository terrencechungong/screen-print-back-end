"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Call = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const CallSchema = new mongoose_1.default.Schema({
    callId: { type: String, unique: true, required: true },
    callerNumber: String,
    recipientNumber: String,
    duration: Number, // In seconds
    transcript: String,
    keywords: [String], // Extracted from transcript
    sentiment: String, // "positive", "negative", "neutral"
    createdAt: { type: Date, default: Date.now },
});
exports.Call = mongoose_1.default.model('Call', CallSchema);
