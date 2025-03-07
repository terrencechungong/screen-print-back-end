"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedTemplate = void 0;
const mongoose_1 = require("mongoose");
const PostMedia_1 = require("./PostMedia");
const savedTemplateSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    content: { type: String, required: true },
    postMedia: [{ type: PostMedia_1.postMediaSchema }],
    shortVideo: { type: PostMedia_1.postMediaSchema }
}, {
    timestamps: true
});
exports.SavedTemplate = (0, mongoose_1.model)('SavedTemplate', savedTemplateSchema);
