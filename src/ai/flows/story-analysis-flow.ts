'use server';

/**
 * @fileOverview Analyzes a user's story completion for emotional themes.
 *
 * - analyzeStory - A function that analyzes the user's story.
 * - AnalyzeStoryInput - The input type for the analyzeStory function.
 * - AnalyzeStoryOutput - The return type for the analyzeStory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeStoryInputSchema = z.object({
  storyPrompt: z.string().describe('The initial prompt given to the user.'),
  userCompletion: z.string().describe("The user's completion of the story."),
});
export type AnalyzeStoryInput = z.infer<typeof AnalyzeStoryInputSchema>;

const AnalyzeStoryOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A gentle, empathetic, and non-clinical analysis of the potential feelings and themes in the user\'s story. Frame it as a reflection, not a diagnosis.'
    ),
  identifiedFeeling: z
    .string()
    .describe('The primary feeling or theme identified (e.g., Hope, Conflict, Loneliness).'),
});
export type AnalyzeStoryOutput = z.infer<typeof AnalyzeStoryOutputSchema>;

export async function analyzeStory(input: AnalyzeStoryInput): Promise<AnalyzeStoryOutput> {
  return storyAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'storyAnalysisPrompt',
  input: { schema: AnalyzeStoryInputSchema },
  output: { schema: AnalyzeStoryOutputSchema },
  prompt: `You are an empathetic AI assistant with expertise in narrative psychology, helping users explore their feelings through creative writing.

A user was given the following story prompt:
"{{{storyPrompt}}}"

The user completed the story as follows:
"{{{userCompletion}}}"

Analyze the user's story. Your analysis should be gentle, supportive, and focus on potential emotional themes.
- Do NOT provide a clinical diagnosis or use psychological jargon.
- Identify the primary feeling or theme (e.g., hope, loss, connection, adventure).
- Write a short, empathetic reflection (2-4 sentences) about the themes you noticed. Address the user in the second person ("In your story, it seems like...").

Example analysis:
"In your story, it feels like the main character is searching for a connection, even when things feel dark. The way you described the sunrise at the end suggests a sense of hope and new beginnings. It's a powerful reminder that even after a long night, there can be light."
`,
});

const storyAnalysisFlow = ai.defineFlow(
  {
    name: 'storyAnalysisFlow',
    inputSchema: AnalyzeStoryInputSchema,
    outputSchema: AnalyzeStoryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
