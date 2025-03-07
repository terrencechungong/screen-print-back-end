"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = exports.Workspace = exports.workspaceSchema = void 0;
const mongoose_1 = require("mongoose");
const labelSchema = new mongoose_1.Schema({
    color: { type: String, required: true },
    textColor: { type: String, required: true },
    label: { type: String, required: true }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
const InteractionSchema = new mongoose_1.Schema({
    type: { type: String, required: true },
    videoId: { type: String, required: true },
    commentId: { type: String, required: true },
    parentId: { type: String },
    author: {
        displayName: { type: String, required: true },
        channelId: { type: String, required: true },
        profileImageUrl: { type: String, required: true },
    },
    text: { type: String, required: true },
    publishedAt: { type: String, required: true },
    videoUrl: { type: String, required: true },
    // @ts-ignore
    children: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    pageToReplyFrom: {
        platform: { type: String, required: true },
        socialPageId: { type: String, required: true },
        profilePictureUrl: { type: String, required: true },
        displayName: { type: String, required: true },
    },
});
const businessInfo = new mongoose_1.Schema({
    businessName: { type: String, },
    businessType: [{ type: String, }], // Array of strings
    socialType: {
        type: String,
        required: true,
        enum: ['business', 'personal']
    },
    shortBusinessBio: { type: String, },
    audienceType: {
        type: String,
        required: true,
        enum: ['global', 'national', 'local']
    },
    targetAudience: {
        type: [String],
        required: true,
        validate: [
            (val) => val.length <= 3,
            'Target audience cannot have more than 3 items'
        ]
    }
});
exports.workspaceSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    collaborators: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    linkedAccounts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'SocialPage' }],
    posts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Post' }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    labels: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Label' }],
    workspacePicture: { type: String, required: true },
    collaboratorPermissions: {
        type: Map,
        of: {
            type: Map,
            of: Boolean
        },
        key: mongoose_1.Schema.Types.ObjectId // {collaboratorId: {permission: true || false}}
    },
    // recentMedia: {},
    savedHashtagGroups: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'HashtagGroup' }],
    savedTemplates: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'SavedTemplate' }],
    // savedUserTemplates: {},
    youtubeLastFetchedDate: { type: Date, default: null },
    interactions: { type: [InteractionSchema], default: [] },
    postMediaLibraryItems: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'PostMedia' }],
    templateVariables: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'TemplateVariable' }],
    businessInfo: {
        type: businessInfo,
        default: {
            businessName: '',
            businessType: [],
            socialType: 'business',
            shortBusinessBio: '',
            audienceType: 'global',
            targetAudience: []
        }
    }
    // everything that is saved for all users in a workspace
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});
// Create the User model from the schema
exports.Workspace = (0, mongoose_1.model)('Workspace', exports.workspaceSchema);
exports.Label = (0, mongoose_1.model)('Label', labelSchema);
