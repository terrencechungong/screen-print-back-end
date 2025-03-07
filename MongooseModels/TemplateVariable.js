"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateVariable = void 0;
const mongoose_1 = require("mongoose");
const templateVariableSchema = new mongoose_1.Schema({
    key: { type: String, required: true },
    value: { type: String, required: true },
    isDefault: { type: Boolean, required: true }
}, {
    timestamps: true
});
exports.TemplateVariable = (0, mongoose_1.model)('TemplateVariable', templateVariableSchema);
