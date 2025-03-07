import { Document } from "mongodb";
import { Schema, model } from "mongoose";
import { UserDocument } from "./User";
import { postVariationSchema, PostVariationType } from "./PostVariation";
import { LabelDocument, WorkspaceDocument } from "./Workspace";
import { ConversationMessageDocument } from "./ConversationMessage";
import { SocialPageDocument } from "./SocialPage";

export type IncludedAccountType = {
    socialPage: Schema.Types.ObjectId | SocialPageDocument;
    unique: boolean;
}

const includedAccountSchema = new Schema<IncludedAccountType>({
    socialPage: { type: Schema.Types.ObjectId, ref: 'SocialPage' },
    unique: { type: Boolean, required: true },
});

export interface PostDocument extends Document {
    includedAccounts: IncludedAccountType[];
    postType: 'SHORT' | 'NORMAL' | 'NONE';
    createdBy: Schema.Types.ObjectId | UserDocument;
    lastUpdatedBy: Schema.Types.ObjectId | UserDocument;
    workspace: Schema.Types.ObjectId | WorkspaceDocument;
    status: 'SCHEDULED' | 'AWAITING_APPROVAL' | 'DRAFT';
    hasBeenPostedAtLeastOnce: boolean;
    scheduledDate: Date;
    postVariations: { [postVariationKey: string]: PostVariationType };
    conversationMessages: Schema.Types.ObjectId[] | ConversationMessageDocument[];
    notes: string;
    labels: Schema.Types.ObjectId[] | LabelDocument[];
    pinterestTitle: string;
    youtubeShortsTitle: string;
}

export const postSchema = new Schema<PostDocument>({
    includedAccounts: [{ type: includedAccountSchema }],
    postType: { type: String, enum: ['SHORT', 'NORMAL', 'NONE'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['SCHEDULED', 'AWAITING_APPROVAL', 'DRAFT'] },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    scheduledDate: { type: Date },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    hasBeenPostedAtLeastOnce: { type: Boolean },
    postVariations: {
        type: Map, // Map allows dynamic keys
        of: postVariationSchema, // Values must match PostVariationType
    },
    conversationMessages: [{ type: Schema.Types.ObjectId, ref: 'ConversationMessage' }],
    notes: { type: String },
    labels: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
    pinterestTitle: { type: String },
    youtubeShortsTitle: { type: String }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Create the User model from the schema
export const Post = model<PostDocument>('Post', postSchema);