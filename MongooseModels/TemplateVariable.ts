import { Schema, model } from "mongoose";
import { Document } from "mongodb";

export interface TemplateVariableDocument extends Document {
    key: string;
    value: string;
    isDefault: boolean;
}

const templateVariableSchema = new Schema<TemplateVariableDocument>({
    key: { type: String, required: true },
    value: { type: String, required: true },
    isDefault: { type: Boolean, required: true }
}, {
    timestamps: true
});

export const TemplateVariable = model<TemplateVariableDocument>('TemplateVariable', templateVariableSchema); 