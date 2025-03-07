import { Schema } from "mongoose";
import { postMediaSchema, PostMediaType } from "./PostMedia";

export interface PostVariationType {
    postCaption: string;
    shortVideo: PostMediaType;
    postMedia: PostMediaType[]
}

export const postVariationSchema = new Schema<PostVariationType>({
    postCaption: { type: String },
    shortVideo: { type: postMediaSchema},
    postMedia: [{ type: postMediaSchema}],
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Create the User model from the schema