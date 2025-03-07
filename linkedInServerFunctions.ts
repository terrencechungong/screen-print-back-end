import axios from "axios";

interface LinkedInInteraction {
    type: string;
    commentId: string;
    parentId?: string;
    author: {
        displayName: string;
        channelId: string;
        profileImageUrl: string;
    };
    text: string;
    publishedAt: string;
    videoUrl: string;
    children?: LinkedInInteraction[];
}

/**
 * Helper function that fetches the parent comment and all its replies.
 * (Adjust the endpoint URLs and parameters based on LinkedIn's documentation.)
 */
async function fetchParentAndReplies(parentId: string, accessToken: string): Promise<LinkedInInteraction[]> {
    try {
        // Fetch the parent comment
        const parentRes = await axios.get(`https://api.linkedin.com/v2/comments/${parentId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        const parentComment = parentRes.data;
        
        // Fetch replies to the parent comment
        const repliesRes = await axios.get(`https://api.linkedin.com/v2/comments`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            },
            params: { parent: parentId }
        });
        const replies = repliesRes.data.elements || [];
        
        // Format parent and replies to match YouTube format
        const formattedParent: LinkedInInteraction = {
            type: 'COMMENT',
            commentId: parentComment.id,
            author: {
                displayName: parentComment.actor.name || 'Unknown',
                channelId: parentComment.actor.id,
                profileImageUrl: parentComment.actor.profilePicture?.displayImage || ''
            },
            text: parentComment.message?.text || '',
            publishedAt: new Date(parentComment.created.time).toISOString(),
            videoUrl: `https://www.linkedin.com/feed/update/${parentComment.object}`,
            children: replies.map((reply: any) => ({
                type: 'REPLY',
                commentId: reply.id,
                parentId: parentId,
                author: {
                    displayName: reply.actor.name || 'Unknown',
                    channelId: reply.actor.id,
                    profileImageUrl: reply.actor.profilePicture?.displayImage || ''
                },
                text: reply.message?.text || '',
                publishedAt: new Date(reply.created.time).toISOString(),
                videoUrl: `https://www.linkedin.com/feed/update/${reply.object}`
            }))
        };

        return [formattedParent];
    } catch (error: any) {
        console.error("Error fetching parent/replies:", error.response ? error.response.data : error.message);
        return [];
    }
}

export async function fetchLinkedInInteractions(accessToken: string): Promise<LinkedInInteraction[]> {
    try {
        const commentsResponse = await axios.get('https://api.linkedin.com/v2/comments', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        const comments = commentsResponse.data.elements;
        const processedComments = new Map<string, LinkedInInteraction>();

        for (const comment of comments) {
            if (comment.parentComment) {
                // This is a reply, fetch the parent and all its replies
                if (!processedComments.has(comment.parentComment)) {
                    const parentAndReplies = await fetchParentAndReplies(comment.parentComment, accessToken);
                    parentAndReplies.forEach(interaction => {
                        processedComments.set(interaction.commentId, interaction);
                    });
                }
            } else {
                // This is a top-level comment
                if (!processedComments.has(comment.id)) {
                    const parentAndReplies = await fetchParentAndReplies(comment.id, accessToken);
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
                comment.children.sort((a, b) => 
                    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                );
            }
        });

        return result;
    } catch (error: any) {
        console.error('Error fetching LinkedIn interactions:', error);
        throw error;
    }
}
