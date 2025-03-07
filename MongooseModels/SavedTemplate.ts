import { Schema, model } from "mongoose";
import { Document } from "mongodb";
import { postMediaSchema } from "./PostMedia";

export interface SavedTemplateDocument extends Document {
    name: string;
    content: string;
    postMedia: typeof postMediaSchema[];
    shortVideo: typeof postMediaSchema;
}

const savedTemplateSchema = new Schema<SavedTemplateDocument>({
    name: { type: String, required: true },
    content: { type: String, required: true },
    postMedia: [{ type: postMediaSchema }],
    shortVideo: { type: postMediaSchema }
}, {
    timestamps: true
});

export const SavedTemplate = model<SavedTemplateDocument>('SavedTemplate', savedTemplateSchema); 