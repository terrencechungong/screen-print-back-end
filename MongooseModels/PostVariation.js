"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postVariationSchema = void 0;
const mongoose_1 = require("mongoose");
const PostMedia_1 = require("./PostMedia");
exports.postVariationSchema = new mongoose_1.Schema({
    postCaption: { type: String },
    shortVideo: { type: PostMedia_1.postMediaSchema },
    postMedia: [{ type: PostMedia_1.postMediaSchema }],
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
// Create the User model from the schema
