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
exports.fetchLinkedInInteractions = fetchLinkedInInteractions;
const axios_1 = __importDefault(require("axios"));
/**
 * Helper function that fetches the parent comment and all its replies.
 * (Adjust the endpoint URLs and parameters based on LinkedIn's documentation.)
 */
function fetchParentAndReplies(parentId, accessToken) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Fetch the parent comment
            const parentRes = yield axios_1.default.get(`https://api.linkedin.com/v2/comments/${parentId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            const parentComment = parentRes.data;
            // Fetch replies to the parent comment
            const repliesRes = yield axios_1.default.get(`https://api.linkedin.com/v2/comments`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                params: { parent: parentId }
            });
            const replies = repliesRes.data.elements || [];
            // Format parent and replies to match YouTube format
            const formattedParent = {
                type: 'COMMENT',
                commentId: parentComment.id,
                author: {
                    displayName: parentComment.actor.name || 'Unknown',
                    channelId: parentComment.actor.id,
                    profileImageUrl: ((_a = parentComment.actor.profilePicture) === null || _a === void 0 ? void 0 : _a.displayImage) || ''
                },
                text: ((_b = parentComment.message) === null || _b === void 0 ? void 0 : _b.text) || '',
                publishedAt: new Date(parentComment.created.time).toISOString(),
                videoUrl: `https://www.linkedin.com/feed/update/${parentComment.object}`,
                children: replies.map((reply) => {
                    var _a, _b;
                    return ({
                        type: 'REPLY',
                        commentId: reply.id,
                        parentId: parentId,
                        author: {
                            displayName: reply.actor.name || 'Unknown',
                            channelId: reply.actor.id,
                            profileImageUrl: ((_a = reply.actor.profilePicture) === null || _a === void 0 ? void 0 : _a.displayImage) || ''
                        },
                        text: ((_b = reply.message) === null || _b === void 0 ? void 0 : _b.text) || '',
                        publishedAt: new Date(reply.created.time).toISOString(),
                        videoUrl: `https://www.linkedin.com/feed/update/${reply.object}`
                    });
                })
            };
            return [formattedParent];
        }
        catch (error) {
            console.error("Error fetching parent/replies:", error.response ? error.response.data : error.message);
            return [];
        }
    });
}
function fetchLinkedInInteractions(accessToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const commentsResponse = yield axios_1.default.get('https://api.linkedin.com/v2/comments', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            const comments = commentsResponse.data.elements;
            const processedComments = new Map();
            for (const comment of comments) {
                if (comment.parentComment) {
                    // This is a reply, fetch the parent and all its replies
                    if (!processedComments.has(comment.parentComment)) {
                        const parentAndReplies = yield fetchParentAndReplies(comment.parentComment, accessToken);
                        parentAndReplies.forEach(interaction => {
                            processedComments.set(interaction.commentId, interaction);
                        });
                    }
                }
                else {
                    // This is a top-level comment
                    if (!processedComments.has(comment.id)) {
                        const parentAndReplies = yield fetchParentAndReplies(comment.id, accessToken);
                        parentAndReplies.forEach(interaction => {
                            processedComments.set(interaction.commentId, interaction);
                        });
                    }
                }
            }
            // Sort children by publishedAt date (descending)
            const result = Array.from(processedComments.values());
            result.forEach(comment => {
                if (comment.children && comment.children.length > 0) {
                    comment.children.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
                }
            });
            return result;
        }
        catch (error) {
            console.error('Error fetching LinkedIn interactions:', error);
            throw error;
        }
    });
}
