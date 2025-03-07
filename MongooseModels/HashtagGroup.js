"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashtagGroup = void 0;
const mongoose_1 = require("mongoose");
const hashtagGroupSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    hashtags: [{ type: String }]
}, {
    timestamps: true
});
exports.HashtagGroup = (0, mongoose_1.model)('HashtagGroup', hashtagGroupSchema);
