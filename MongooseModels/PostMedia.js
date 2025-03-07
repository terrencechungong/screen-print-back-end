"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostMedia = exports.postMediaSchema = void 0;
const mongoose_1 = require("mongoose");
const ThumbnailSchema = new mongoose_1.Schema({
    fileType: { type: String, required: true },
    url: { type: String, required: true },
    naturalAspectRatio: { type: Number, required: true },
    thumbnailIsFromVideo: { type: Boolean, required: true },
    thumbnailTimestamp: { type: Number },
});
exports.postMediaSchema = new mongoose_1.Schema({
    id: { type: String },
    isGif: { type: Boolean },
    fileType: { type: String, enum: ['image/jpeg', 'image/png', 'video/quicktime', 'video/mp4', 'image/gif', ''] },
    regUrl: { type: String },
    smallUrl: { type: String },
    defined: { type: Boolean },
    naturalAspectRatio: { type: Number, required: true },
    thumbnail: { type: ThumbnailSchema },
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
// Create the User model from the schema
exports.PostMedia = (0, mongoose_1.model)('PostMedia', exports.postMediaSchema);
