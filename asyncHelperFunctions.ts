import axios from 'axios';
import { PostMediaInput } from './GraphQL/Resolvers/post-resolvers'
import { PostVariationInput } from "./GraphQL/Resolvers/post-resolvers";
import { PostMedia, PostMediaDocument, PostMediaType } from "./MongooseModels/PostMedia";
import { Workspace } from "./MongooseModels/Workspace";
// at some point i can consolidate this with the post media object but for now theyre seperated and inefficient
export async function createPostMediaDbItems(media: PostMediaInput[], workspaceId: string, postVariations: PostVariationInput[] = []) {

    if (postVariations.length > 0) {
        for (let i = 0; i < postVariations.length; i++) {
            const postVariation = postVariations[i];
            await createPostMediaDbItems(postVariation.postMedia, workspaceId);
        }
    }

    for (let i = 0; i < media.length; i++) {
        const postMedia = media[i];
        if (postMedia.defined === false && (postMedia.defined !== undefined && postMedia.defined !== null)) {
            continue;
        }
        const existingMedia: PostMediaDocument | null = await PostMedia.findOne({ regUrl: postMedia.regUrl });
        if (existingMedia) {
            await existingMedia.updateOne(postMedia);
        } else {
            console.log("MEDIA ", i, media[i])
            const newMediaItem = new PostMedia(postMedia);
            await newMediaItem.save();
            const workspace = await Workspace.findById(workspaceId);
            if (workspace) {
                workspace.postMediaLibraryItems.push(newMediaItem._id);
                await workspace.save();
            }
        }
    }

}



export async function processTranscript(transcript: any) {
    try {
      // Example: Using OpenAI for keyword extraction & sentiment
      const response = await axios.post('https://api.openai.com/v1/completions', {
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
  
    } catch (error) {
      console.error('Error processing transcript:', error);
      return { keywords: [], sentiment: 'neutral' };
    }
  }