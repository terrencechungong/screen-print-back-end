import { google } from "googleapis";
import { Workspace } from "./MongooseModels/Workspace";
import { SocialPage } from "./MongooseModels/SocialPage";
import { oauth2Client } from "./server";


export async function removeCommentFromDb(commentWorkspaceId: string, workspaceId: string) {
    const workspace = await Workspace.findById(workspaceId)
    .select("interactions");
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    workspace.interactions = workspace.interactions.filter((interaction: any) => interaction._id != commentWorkspaceId);
    await workspace.save();
}

async function getParentComment(youtube: any, parentCommentId: string) {
  
    const response = await youtube.comments.list({
      part: 'snippet',
      id: parentCommentId, // Fetch the parent comment
    });
  
    if (response.data.items.length > 0) {
      return response.data.items[0]; // Return the parent comment object
    } else {
      return null; // Parent comment not found
    }
  }

  
async function getAllReplies(youtube: any, topLevelCommentId: string) {
  
    let replies: any[] = [];
    let nextPageToken = null;
  
    do {
      const response: any = await youtube.comments.list({
        part: 'snippet',
        parentId: topLevelCommentId, // Fetch all replies to this comment
        maxResults: 100, // YouTube API allows up to 100 per request
        pageToken: nextPageToken,
      });
  
      replies = replies.concat(response.data.items);
      nextPageToken = response.data.nextPageToken; // Handle pagination
    } while (nextPageToken);
  
    return replies; // Return all replies to the top-level comment
  }

  
async function handleCommentInteraction(youtube: any, comment: any) {
    if (comment.snippet.parentId) {
      // It's a reply, get the parent comment
      const parentComment = await getParentComment(youtube, comment.snippet.parentId);
      console.log('Parent Comment:', parentComment);
      
      // Get all replies under the original top-level comment
      const allReplies = await getAllReplies(youtube, parentComment.id);
      console.log('All Replies:', allReplies);
    } else {
      // It's a top-level comment, get all replies directly
      const allReplies = await getAllReplies(youtube, comment.id);
      console.log('All Replies:', allReplies);
    }
  }
  


/**
 * Fetches new YouTube interactions (comments and replies) since the last fetch.
 * @param {String} userId - The MongoDB ID for the user.
 * @returns {Array} Array of interactions objects.
 */
export async function fetchNewYoutubeInteractions(socialPageId: string) {
    try {
        // 1. Retrieve the user and their stored YouTube auth credentials.
        const socialPage = await SocialPage.findById(socialPageId)
            .select("username platform profilePictureUrl youtubeData linkedinData isNewlyAdded youtubeLastFetch linkedinLastFetch") // Select relevant fields
        console.log(socialPage)
        if (!socialPage) {
            throw new Error('Social Page not found');
        }

        oauth2Client.setCredentials(socialPage.youtubeData.tokens)

        // 3. Initialize the YouTube API client.
        const youtube: any = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        // 4. Retrieve the channel's uploads playlist ID.
        const channelResponse = await youtube.channels.list({
            part: 'contentDetails',
            mine: true
        });
        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            throw new Error('No YouTube channel found for this user.');
        }
        const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

        // 5. Retrieve a list of video IDs from the uploads playlist.
        const playlistResponse = await youtube.playlistItems.list({
            part: 'contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: 50
        });
        const videoIds = playlistResponse.data.items.map((item: any) => item.contentDetails.videoId);

        // 6. Define the time filter – fetch comments published after the last fetch time.
        // If youtubeLastFetch is not set, you might decide to fetch comments for a default period.
        const publishedAfter = socialPage.youtubeLastFetch ? new Date(socialPage.youtubeLastFetch).toISOString() : undefined;
        
        // 7. Prepare an array to collect interactions.
        const interactions: any[] = [];

        // 8. Iterate over each video and fetch comment threads.
        for (const videoId of videoIds) {
            let nextPageToken = null;
            do {
                // Fetch comment threads for the given video.
                const commentResponse: any = await youtube.commentThreads.list({
                    part: 'snippet,replies',
                    videoId,
                    maxResults: 100,
                    pageToken: nextPageToken,
                    // Filter by publishedAfter if available
                    publishedAfter: publishedAfter
                });

                // Process each comment thread.
                const threads = commentResponse.data.items || [];
                threads.forEach((thread: any) => {
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
                        thread.replies.comments.forEach((reply: any) => {
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
        console.log("interactions preproc", interactions)
        // After collecting all interactions, process them to build the hierarchy
        const processedInteractions = await processInteractionsHierarchy(interactions, youtube);
        console.log("interactions postproc", processedInteractions)
        // Update the last fetch time and return the processed interactions
        socialPage.youtubeLastFetch = new Date();
        await socialPage.save();
        
        return processedInteractions;
    } catch (error) {
        console.error('Error fetching YouTube interactions:', error);
        throw error;
    }
}

async function processInteractionsHierarchy(interactions: any[], youtube: any) {
    const processedComments = new Map(); // Store processed comments by ID
    const result: any[] = [];

    for (const interaction of interactions) {
        // Skip if we've already processed this comment
        if (processedComments.has(interaction.commentId)) {
            continue;
        }

        if (interaction.type === 'REPLY') {
            // Get parent comment and all its replies
            const parentComment = await getParentComment(youtube, interaction.parentId);
            if (!parentComment || processedComments.has(parentComment.id)) {
                continue;
            }

            const allReplies = await getAllReplies(youtube, parentComment.id);
            
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
                children: allReplies.map((reply: any) => ({
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
            allReplies.forEach((reply: any) => {
                processedComments.set(reply.id, true);
            });
            processedComments.set(parentComment.id, true);
            
            result.push(parentInteraction);
        } else if (interaction.type === 'COMMENT') {
            // Handle top-level comment

            if (processedComments.has(interaction.commentId)) {
                continue;
            }

            const allReplies = await getAllReplies(youtube, interaction.commentId);
            
            const commentWithReplies = {
                ...interaction,
                children: allReplies.map((reply: any) => ({
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
                }))
            };

            // Mark all replies as processed
            allReplies.forEach((reply: any) => {
                processedComments.set(reply.id, true);
            });
            processedComments.set(interaction.commentId, true);
            
            result.push(commentWithReplies);
        }
    }

    return result;
}

