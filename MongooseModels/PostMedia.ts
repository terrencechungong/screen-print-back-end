import { Schema, model } from "mongoose";
import { Document } from "mongodb";

type ThumbnailType = {
    fileType: string;
    url: string;
    naturalAspectRatio: number;
    thumbnailIsFromVideo: boolean;
    thumbnailTimestamp?: number;
}
const ThumbnailSchema = new Schema<ThumbnailType>({
    fileType: { type: String, required: true },
    url: { type: String, required: true },
    naturalAspectRatio: { type: Number, required: true },
    thumbnailIsFromVideo: { type: Boolean, required: true },
    thumbnailTimestamp: { type: Number },
})

export type PostMediaType = {
    id?: string;
    fileType: string;
    regUrl: string;
    smallUrl?: string;
    isGif?: boolean;
    defined?: boolean;
    naturalAspectRatio: number;
    thumbnail?: ThumbnailType;
}

export interface PostMediaDocument extends Document {
    id?: string;
    fileType: string;
    regUrl: string;
    smallUrl?: string;
    isGif?: boolean;
    defined?: boolean;
    naturalAspectRatio: number;
    thumbnail?: ThumbnailType;
}

export const postMediaSchema = new Schema<PostMediaType>({
    id: {type:String},
    isGif: {type: Boolean},
    fileType: { type: String, enum: ['image/jpeg', 'image/png', 'video/quicktime', 'video/mp4', 'image/gif', ''] },
    regUrl: { type: String },
    smallUrl: {type: String},
    defined: {type: Boolean},
    naturalAspectRatio: { type: Number, required: true },
    thumbnail: { type: ThumbnailSchema },
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Create the User model from the schema
export const PostMedia = model<PostMediaType>('PostMedia', postMediaSchema); 