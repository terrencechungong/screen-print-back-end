import { Document } from "mongodb";
import { Schema, Types, model } from "mongoose";
import { UserDocument } from "./User";
import { WorkspaceDocument } from "./Workspace";


export type ReactionType = {
    emoji: string;
    reactor: Schema.Types.ObjectId | UserDocument;
};

const ReactionSchema = new Schema<ReactionType>({
    emoji: { type: String, required: true },
    reactor: { type: Schema.Types.ObjectId, ref: 'User' },
});


export interface ConversationMessageDocument extends Document {
    messageCreator: Schema.Types.ObjectId | UserDocument;
    content: string;
    replies: Schema.Types.ObjectId[] | ConversationMessageDocument[];
    reactions: Types.DocumentArray<ReactionType>;
    hasBeenEdited: boolean;
}

export const conversationMessageSchema = new Schema<ConversationMessageDocument>({
    messageCreator: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String },
    replies: [{ type: Schema.Types.ObjectId, ref: 'ConversationMessage' }],
    reactions: { type: [ReactionSchema] },
    hasBeenEdited: { type: Boolean },
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

export const ConversationMessage = model<ConversationMessageDocument>('ConversationMessage', conversationMessageSchema);