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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCommentFromDb = removeCommentFromDb;
exports.fetchNewYoutubeInteractions = fetchNewYoutubeInteractions;
const googleapis_1 = require("googleapis");
const Workspace_1 = require("./MongooseModels/Workspace");
const SocialPage_1 = require("./MongooseModels/SocialPage");
const server_1 = require("./server");
function removeCommentFromDb(commentWorkspaceId, workspaceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspace = yield Workspace_1.Workspace.findById(workspaceId)
            .select("interactions");
        if (!workspace) {
            throw new Error("Workspace not found");
        }
        workspace.interactions = workspace.interactions.filter((interaction) => interaction._id != commentWorkspaceId);
        yield workspace.save();
    });
}
function getParentComment(youtube, parentCommentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield youtube.comments.list({
            part: 'snippet',
            id: parentCommentId, // Fetch the parent comment
        });
        if (response.data.items.length > 0) {
            return response.data.items[0]; // Return the parent comment object
        }
        else {
            return null; // Parent comment not found
        }
    });
}
function getAllReplies(youtube, topLevelCommentId) {
    return __awaiter(this, void 0, void 0, function* () {
        let replies = [];
        let nextPageToken = null;
        do {
            const response = yield youtube.comments.list({
                part: 'snippet',
                parentId: topLevelCommentId, // Fetch all replies to this comment
                maxResults: 100, // YouTube API allows up to 100 per request
                pageToken: nextPageToken,
            });
            replies = replies.concat(response.data.items);
            nextPageToken = response.data.nextPageToken; // Handle pagination
        } while (nextPageToken);
        return replies; // Return all replies to the top-level comment
    });
}
function handleCommentInteraction(youtube, comment) {
    return __awaiter(this, void 0, void 0, function* () {
        if (comment.snippet.parentId) {
            // It's a reply, get the parent comment
            const parentComment = yield getParentComment(youtube, comment.snippet.parentId);
            console.log('Parent Comment:', parentComment);
            // Get all replies under the original top-level comment
            const allReplies = yield getAllReplies(youtube, parentComment.id);
            console.log('All Replies:', allReplies);
        }
        else {
            // It's a top-level comment, get all replies directly
            const allReplies = yield getAllReplies(youtube, comment.id);
            console.log('All Replies:', allReplies);
        }
    });
}
/**
 * Fetches new YouTube interactions (comments and replies) since the last fetch.
 * @param {String} userId - The MongoDB ID for the user.
 * @returns {Array} Array of interactions objects.
 */
function fetchNewYoutubeInteractions(socialPageId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Retrieve the user and their stored YouTube auth credentials.
            const socialPage = yield SocialPage_1.SocialPage.findById(socialPageId)
                .select("username platform profilePictureUrl youtubeData linkedinData isNewlyAdded youtubeLastFetch linkedinLastFetch"); // Select relevant fields
            console.log(socialPage);
            if (!socialPage) {
                throw new Error('Social Page not found');
            }
            server_1.oauth2Client.setCredentials(socialPage.youtubeData.tokens);
            // 3. Initialize the YouTube API client.
            const youtube = googleapis_1.google.youtube({
                version: 'v3',
                auth: server_1.oauth2Client
            });
            // 4. Retrieve the channel's uploads playlist ID.
            const channelResponse = yield youtube.channels.list({
                part: 'contentDetails',
                mine: true
            });
            if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
                throw new Error('No YouTube channel found for this user.');
            }
            const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
            // 5. Retrieve a list of video IDs from the uploads playlist.
            const playlistResponse = yield youtube.playlistItems.list({
                part: 'contentDetails',
                playlistId: uploadsPlaylistId,
                maxResults: 50
            });
            const videoIds = playlistResponse.data.items.map((item) => item.contentDetails.videoId);
            // 6. Define the time filter – fetch comments published after the last fetch time.
            // If youtubeLastFetch is not set, you might decide to fetch comments for a default period.
            const publishedAfter = socialPage.youtubeLastFetch ? new Date(socialPage.youtubeLastFetch).toISOString() : undefined;
            // 7. Prepare an array to collect interactions.
            const interactions = [];
            // 8. Iterate over each video and fetch comment threads.
            for (const videoId of videoIds) {
                let nextPageToken = null;
                do {
                    // Fetch comment threads for the given video.
                    const commentResponse = yield youtube.commentThreads.list({
                        part: 'snippet,replies',
                        videoId,
                        maxResults: 100,
                        pageToken: nextPageToken,
                        // Filter by publishedAfter if available
                        publishedAfter: publishedAfter
                    });
                    // Process each comment thread.
                    const threads = commentResponse.data.items || [];
                    threads.forEach((thread) => {
                        // The top-level comment.
                        const topComment = thread.snippet.topLevelComment.snippet;
                        interactions.push({
                            type: 'COMMENT',
                            videoId,
                            commentId: thread.snippet.topLevelComment.id,
                            author: {
                                displayName: topComment.authorDisplayName,
                                channelId: topComment.authorChannelId.value,
                                profileImageUrl: topComment.authorProfileImageUrl
                            },
                            text: topComment.textDisplay,
                            publishedAt: topComment.publishedAt,
                            updatedAt: topComment.updatedAt,
                            // Construct a link to the video
                            videoUrl: `https://www.youtube.com/watch?v=${videoId}`
                        });
                        // Process any replies to the top-level comment.
                        if (thread.replies && thread.replies.comments) {
                            thread.replies.comments.forEach((reply) => {
                                const replySnippet = reply.snippet;
                                interactions.push({
                                    type: 'REPLY',
                                    videoId,
                                    commentId: reply.id,
                                    parentId: thread.snippet.topLevelComment.id,
                                    author: {
                                        displayName: replySnippet.authorDisplayName,
                                        channelId: replySnippet.authorChannelId.value,
                                        profileImageUrl: replySnippet.authorProfileImageUrl
                                    },
                                    text: replySnippet.textDisplay,
                                    publishedAt: replySnippet.publishedAt,
                                    updatedAt: replySnippet.updatedAt,
                                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`
                                });
                            });
                        }
                    });
                    nextPageToken = commentResponse.data.nextPageToken;
                } while (nextPageToken);
            }
            console.log("interactions preproc", interactions);
            // After collecting all interactions, process them to build the hierarchy
            const processedInteractions = yield processInteractionsHierarchy(interactions, youtube);
            console.log("interactions postproc", processedInteractions);
            // Update the last fetch time and return the processed interactions
            socialPage.youtubeLastFetch = new Date();
            yield socialPage.save();
            return processedInteractions;
        }
        catch (error) {
            console.error('Error fetching YouTube interactions:', error);
            throw error;
        }
    });
}
function processInteractionsHierarchy(interactions, youtube) {
    return __awaiter(this, void 0, void 0, function* () {
        const processedComments = new Map(); // Store processed comments by ID
        const result = [];
        for (const interaction of interactions) {
            // Skip if we've already processed this comment
            if (processedComments.has(interaction.commentId)) {
                continue;
            }
            if (interaction.type === 'REPLY') {
                // Get parent comment and all its replies
                const parentComment = yield getParentComment(youtube, interaction.parentId);
                if (!parentComment || processedComments.has(parentComment.id)) {
                    continue;
                }
                const allReplies = yield getAllReplies(youtube, parentComment.id);
                // Create parent comment object with children
                const parentInteraction = {
                    type: 'COMMENT',
                    videoId: interaction.videoId,
                    commentId: parentComment.id,
                    author: {
                        displayName: parentComment.snippet.authorDisplayName,
                        channelId: parentComment.snippet.authorChannelId.value,
                        profileImageUrl: parentComment.snippet.authorProfileImageUrl
                    },
                    text: parentComment.snippet.textDisplay,
                    publishedAt: parentComment.snippet.publishedAt,
                    videoUrl: interaction.videoUrl,
                    children: allReplies.map((reply) => ({
                        type: 'REPLY',
                        videoId: interaction.videoId,
                        commentId: reply.id,
                        parentId: parentComment.id,
                        author: {
                            displayName: reply.snippet.authorDisplayName,
                            channelId: reply.snippet.authorChannelId.value,
                            profileImageUrl: reply.snippet.authorProfileImageUrl
                        },
                        text: reply.snippet.textDisplay,
                        publishedAt: reply.snippet.publishedAt,
                        videoUrl: interaction.videoUrl
                    }))
                };
                // Mark all replies as processed
                allReplies.forEach((reply) => {
                    processedComments.set(reply.id, true);
                });
                processedComments.set(parentComment.id, true);
                result.push(parentInteraction);
            }
            else if (interaction.type === 'COMMENT') {
                // Handle top-level comment
                if (processedComments.has(interaction.commentId)) {
                    continue;
                }
                const allReplies = yield getAllReplies(youtube, interaction.commentId);
                const commentWithReplies = Object.assign(Object.assign({}, interaction), { children: allReplies.map((reply) => ({
                        type: 'REPLY',
                        videoId: interaction.videoId,
                        commentId: reply.id,
                        parentId: interaction.commentId,
                        author: {
                            displayName: reply.snippet.authorDisplayName,
                            channelId: reply.snippet.authorChannelId.value,
                            profileImageUrl: reply.snippet.authorProfileImageUrl
                        },
                        text: reply.snippet.textDisplay,
                        publishedAt: reply.snippet.publishedAt,
                        videoUrl: interaction.videoUrl
                    })) });
                // Mark all replies as processed
                allReplies.forEach((reply) => {
                    processedComments.set(reply.id, true);
                });
                processedComments.set(interaction.commentId, true);
                result.push(commentWithReplies);
            }
        }
        return result;
    });
}
