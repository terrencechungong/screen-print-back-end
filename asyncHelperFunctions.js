"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostMediaDbItems = createPostMediaDbItems;
exports.processTranscript = processTranscript;
const axios_1 = __importDefault(require("axios"));
const PostMedia_1 = require("./MongooseModels/PostMedia");
const Workspace_1 = require("./MongooseModels/Workspace");
// at some point i can consolidate this with the post media object but for now theyre seperated and inefficient
function createPostMediaDbItems(media_1, workspaceId_1) {
    return __awaiter(this, arguments, void 0, function* (media, workspaceId, postVariations = []) {
        if (postVariations.length > 0) {
            for (let i = 0; i < postVariations.length; i++) {
                const postVariation = postVariations[i];
                yield createPostMediaDbItems(postVariation.postMedia, workspaceId);
            }
        }
        for (let i = 0; i < media.length; i++) {
            const postMedia = media[i];
            if (postMedia.defined === false && (postMedia.defined !== undefined && postMedia.defined !== null)) {
                continue;
            }
            const existingMedia = yield PostMedia_1.PostMedia.findOne({ regUrl: postMedia.regUrl });
            if (existingMedia) {
                yield existingMedia.updateOne(postMedia);
            }
            else {
                console.log("MEDIA ", i, media[i]);
                const newMediaItem = new PostMedia_1.PostMedia(postMedia);
                yield newMediaItem.save();
                const workspace = yield Workspace_1.Workspace.findById(workspaceId);
                if (workspace) {
                    workspace.postMediaLibraryItems.push(newMediaItem._id);
                    yield workspace.save();
                }
            }
        }
    });
}
function processTranscript(transcript) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Example: Using OpenAI for keyword extraction & sentiment
            const response = yield axios_1.default.post('https://api.openai.com/v1/completions', {
                model: "text-davinci-003",
                prompt: `Extract key topics and determine sentiment (positive, negative, neutral) from the following call transcript:\n\n"${transcript}"`,
                max_tokens: 100,
            }, {
                headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
            });
            const result = response.data.choices[0].text.trim().split('\n');
            return {
                keywords: result[0].split(', '),
                sentiment: result[1],
            };
        }
        catch (error) {
            console.error('Error processing transcript:', error);
            return { keywords: [], sentiment: 'neutral' };
        }
    });
}
