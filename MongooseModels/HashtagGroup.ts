import { Schema, model } from "mongoose";
import { Document } from "mongodb";

export interface HashtagGroupDocument extends Document {
    name: string;
    hashtags: string[];
}

const hashtagGroupSchema = new Schema<HashtagGroupDocument>({
    name: { type: String, required: true },
    hashtags: [{ type: String }]
}, {
    timestamps: true
});

export const HashtagGroup = model<HashtagGroupDocument>('HashtagGroup', hashtagGroupSchema); 