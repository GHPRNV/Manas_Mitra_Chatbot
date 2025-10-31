'use server';

/**
 * @fileOverview Analyzes a user's choices in a branching story to identify emotional tendencies.
 *
 * - analyzeChoices - A function that analyzes the user's choices.
 * - AnalyzeChoicesInput - The input type for the analyzeChoices function.
 * - AnalyzeChoicesOutput - The return type for the analyzeChoices function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChoiceSchema = z.object({
  scenario: z.string().describe('The scenario presented to the user.'),
  choice: z.string().describe('The choice the user made.'),
});

const AnalyzeChoicesInputSchema = z.object({
  choices: z.array(ChoiceSchema).describe('An ordered list of choices the user made.'),
});
export type AnalyzeChoicesInput = z.infer<typeof AnalyzeChoicesInputSchema>;

const AnalyzeChoicesOutputSchema = z.object({
  tendency: z
    .string()
    .describe('A single-word summary of the user\'s emotional tendency (e.g., Empathetic, Assertive, Cautious).'),
  analysis: z
    .string()
    .describe(
      "A short (2-3 sentences), gentle, and encouraging analysis of the user's choices. Address the user in the second person."
    ),
});
export type AnalyzeChoicesOutput = z.infer<typeof AnalyzeChoicesOutputSchema>;

export async function analyzeChoices(input: AnalyzeChoicesInput): Promise<AnalyzeChoicesOutput> {
  return choiceAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'choiceAnalysisPrompt',
  input: { schema: AnalyzeChoicesInputSchema },
  output: { schema: AnalyzeChoicesOutputSchema },
  prompt: `You are an empathetic AI assistant who helps users understand their emotional reactions through interactive stories.

A user has made the following choices in a series of scenarios:
{{#each choices}}
- Scenario: "{{scenario}}"
  - User's choice: "{{choice}}"
{{/each}}

Analyze the pattern of these choices to identify an emotional tendency.
- Based on their choices, identify a primary emotional tendency (e.g., Empathetic, Assertive, Self-aware, Cautious, People-pleasing, Avoidant).
- Write a short, encouraging, and non-judgmental analysis (2-3 sentences) that helps the user feel understood.
- Address the user directly ("You seem to...", "Your choices suggest...").
- Do not be clinical or diagnostic. Keep the tone light and insightful.

Example Output:
Tendency: "Empathetic"
Analysis: "Your choices suggest you often consider the feelings of others before your own. This shows a great deal of empathy and kindness, which are wonderful strengths in building strong connections."
`,
});

const choiceAnalysisFlow = ai.defineFlow(
  {
    name: 'choiceAnalysisFlow',
    inputSchema: AnalyzeChoicesInputSchema,
    outputSchema: AnalyzeChoicesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
