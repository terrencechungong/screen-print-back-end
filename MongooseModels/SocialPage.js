"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialPage = exports.YoutubeData = exports.LinkedInData = exports.socialPageSchema = exports.LinkedinDataSchema = exports.YoutubeDataSchema = void 0;
const mongoose_1 = require("mongoose");
exports.YoutubeDataSchema = new mongoose_1.Schema({
    channelId: { type: String, required: true },
    tokens: {
        access_token: { type: String, required: true },
        refresh_token: { type: String, required: true },
        scope: { type: String, required: true },
        token_type: { type: String, required: true },
        expiry_date: { type: Number, required: true },
    },
}, { _id: false });
exports.LinkedinDataSchema = new mongoose_1.Schema({
    tokens: {
        access_token: { type: String, required: true },
        expires_in: { type: Number, required: true }, // seconds until expiration
    },
    id: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
}, { _id: false });
exports.socialPageSchema = new mongoose_1.Schema({
    username: { type: String, required: true },
    platform: {
        type: String, required: true, enum: ['Facebook', 'Instagram', 'LinkedIn', 'Pinterest', 'GoogleBusiness', 'TikTok',
            'Youtube', 'WhatsApp'
        ]
    },
    profilePictureUrl: { type: String },
    youtubeData: exports.YoutubeDataSchema,
    linkedinData: exports.LinkedinDataSchema,
    isNewlyAdded: { type: Boolean },
    youtubeLastFetch: { type: Date },
    linkedinLastFetch: { type: Date },
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
exports.LinkedInData = (0, mongoose_1.model)('LinkedinData', exports.LinkedinDataSchema);
exports.YoutubeData = (0, mongoose_1.model)('YoutubeData', exports.YoutubeDataSchema);
// Create the User model from the schema
exports.SocialPage = (0, mongoose_1.model)('SocialPage', exports.socialPageSchema);
