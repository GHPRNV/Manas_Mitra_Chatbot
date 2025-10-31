'use server';

/**
 * @fileOverview A conversational AI agent for mental wellness support.
 *
 * - chat - A function that generates an empathetic response.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
  currentInput: z.string().describe("The user's latest text input."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's empathetic and supportive response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const prompt = ai.definePrompt({
    name: 'chatPrompt',
    input: { schema: ChatInputSchema },
    output: { schema: ChatOutputSchema },
    prompt: `You are ManasMitra, a caring and empathetic AI assistant designed to provide mental wellness support. Your goal is to listen to the user, validate their feelings, and gently guide them towards self-reflection and confidence.

- **Listen Deeply:** Pay close attention to the user's words and the underlying emotions.
- **Be Empathetic:** Start by acknowledging their feelings (e.g., "It sounds like you're going through a lot," "I hear how difficult that must be.").
- **Ask Gentle Questions:** Encourage them to explore their feelings without being intrusive (e.g., "What does that feel like for you?", "Can you tell me more about that?").
- **Offer Encouragement:** Instill hope and reinforce their strengths (e.g., "It takes courage to talk about this," "Remember that you've overcome challenges before.").
- **Keep it Conversational:** Your responses should be natural, supportive, and not overly clinical. Keep responses to 2-3 sentences to maintain a conversational flow.
- **Do not give medical advice.** Gently redirect if the user asks for a diagnosis or treatment plan.

Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

User's current input: "{{currentInput}}"

Your response:`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
