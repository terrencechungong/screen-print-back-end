import { Schema, model } from "mongoose";
import { Document } from "mongodb";

export interface YoutubeData {
    channelId: string;
    tokens: {
        access_token: string;
        refresh_token: string;
        scope: string;
        token_type: string;
        expiry_date: number;
    };
}

export const YoutubeDataSchema = new Schema<YoutubeData>({
    channelId: { type: String, required: true },
    tokens: {
        access_token: { type: String, required: true },
        refresh_token: { type: String, required: true },
        scope: { type: String, required: true },
        token_type: { type: String, required: true },
        expiry_date: { type: Number, required: true },
    },
}, { _id: false });

export interface LinkedinData {
    tokens: {
        access_token: string;
        expires_in: number; // seconds until expiration
    },
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export const LinkedinDataSchema = new Schema<LinkedinData>({
    tokens: {
        access_token: { type: String, required: true },
        expires_in: { type: Number, required: true }, // seconds until expiration
    },
    id: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
}, { _id: false });


export interface SocialPageDocument extends Document {
    username: string;
    platform: 'Facebook' | 'Instagram' | 'LinkedIn' | 'Pinterest' | 'GoogleBusiness' | 'TikTok' | 'Youtube' | 'WhatsApp';
    profilePictureUrl: string;
    youtubeData: YoutubeData,
    linkedinData: LinkedinData,
    isNewlyAdded: boolean
}

export const socialPageSchema = new Schema<SocialPageDocument>({
    username: { type: String, required: true },
    platform: {
        type: String, required: true, enum: ['Facebook', 'Instagram', 'LinkedIn', 'Pinterest', 'GoogleBusiness', 'TikTok',
            'Youtube', 'WhatsApp'
        ]
    },
    profilePictureUrl: { type: String },
    youtubeData: YoutubeDataSchema,
    linkedinData: LinkedinDataSchema,
    isNewlyAdded: { type: Boolean },
    youtubeLastFetch: { type: Date },
    linkedinLastFetch: { type: Date },
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

export const LinkedInData = model<SocialPageDocument>('LinkedinData', LinkedinDataSchema);
export const YoutubeData = model<SocialPageDocument>('YoutubeData', YoutubeDataSchema);

// Create the User model from the schema
export const SocialPage = model<SocialPageDocument>('SocialPage', socialPageSchema);