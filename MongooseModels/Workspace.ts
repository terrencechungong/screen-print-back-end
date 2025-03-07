import { Schema, model } from "mongoose";
import { Document } from "mongodb";
import { UserDocument } from "./User";
import { SocialPageDocument } from "./SocialPage";
import { PostDocument } from "./Post";
import { HashtagGroupDocument } from "./HashtagGroup";
import { SavedTemplateDocument } from "./SavedTemplate";
import { TemplateVariableDocument } from "./TemplateVariable";

export interface LabelDocument extends Document {
    color: string;
    textColor: string;
    label: string
}

const labelSchema = new Schema<LabelDocument>({
    color: { type: String, required: true },
    textColor: { type: String, required: true },
    label: { type: String, required: true }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

export interface interactionSchema {
    type: string;
    videoId: string;
    commentId: string;
    parentId: string;
    author: {
        displayName: string;
        channelId: string;
        profileImageUrl: string;
    };
    text: string;
    publishedAt: string;
    videoUrl: string;
    pageToReplyFrom: {
        platform: string;
        socialPageId: string;
        profilePictureUrl: string;
        displayName: string;
    };
    children: Partial<interactionSchema>[];
}

const InteractionSchema = new Schema<interactionSchema>({
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
    children: { type: [Schema.Types.Mixed], default: [] },
    pageToReplyFrom: {
        platform: { type: String, required: true },
        socialPageId: { type: String, required: true },
        profilePictureUrl: { type: String, required: true },
        displayName: { type: String, required: true },
    },
});

export interface BusinessInfo {

    businessName: string;
    businessType: string[];
    socialType: 'business' | 'personal';
    shortBusinessBio: string;
    audienceType: 'global' | 'national' | 'local';
    targetAudience: string[];
}



export interface BrandManagement {
    businessInfo: BusinessInfo;
}





const businessInfo = new Schema<BusinessInfo>({

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

            (val: string[]) => val.length <= 3,
            'Target audience cannot have more than 3 items'

        ]

    }

})


export interface WorkspaceDocument extends Document {
    name: string;
    collaborators: Schema.Types.ObjectId[] | UserDocument[];
    linkedAccounts: Schema.Types.ObjectId[] | SocialPageDocument[];
    posts: Schema.Types.ObjectId[] | PostDocument[];
    createdBy: Schema.Types.ObjectId | UserDocument;
    labels: Schema.Types.ObjectId[] | LabelDocument[];
    savedHashtagGroups: Schema.Types.ObjectId[] | HashtagGroupDocument[];
    savedTemplates: Schema.Types.ObjectId[] | SavedTemplateDocument[];
    workspacePicture: string;
    youtubeLastFetchedDate: Date;
    interactions: interactionSchema[];
    templateVariables: Schema.Types.ObjectId[] | TemplateVariableDocument[];
    brandManagement: BrandManagement;
}

export const workspaceSchema = new Schema<WorkspaceDocument>({
    name: { type: String, required: true },
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    linkedAccounts: [{ type: Schema.Types.ObjectId, ref: 'SocialPage' }],
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    labels: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
    workspacePicture: { type: String, required: true },
    collaboratorPermissions: {
        type: Map,
        of: {
            type: Map,
            of: Boolean
        },
        key: Schema.Types.ObjectId // {collaboratorId: {permission: true || false}}
    },
    // recentMedia: {},
    savedHashtagGroups: [{ type: Schema.Types.ObjectId, ref: 'HashtagGroup' }],
    savedTemplates: [{ type: Schema.Types.ObjectId, ref: 'SavedTemplate' }],
    // savedUserTemplates: {},
    youtubeLastFetchedDate: { type: Date, default: null },
    interactions: { type: [InteractionSchema], default: [] },
    postMediaLibraryItems: [{ type: Schema.Types.ObjectId, ref: 'PostMedia' }],
    templateVariables: [{ type: Schema.Types.ObjectId, ref: 'TemplateVariable' }],
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
export const Workspace = model<WorkspaceDocument>('Workspace', workspaceSchema);
export const Label = model<LabelDocument>('Label', labelSchema);