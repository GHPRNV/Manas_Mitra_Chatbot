'use server';

/**
 * @fileOverview A voice agent that provides empathetic conversation.
 *
 * - voiceAgent - A function that generates a spoken response.
 * - textToSpeech - A function that converts text to audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

// Define schemas for the conversational flow
const ConversationInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
  currentInput: z.string().describe("The user's latest voice input, transcribed to text."),
});

const ConversationOutputSchema = z.object({
  response: z.string().describe("The AI's empathetic and supportive response."),
});

// Define schemas for the TTS flow
const TTSInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});

const TTSOutputSchema = z.object({
  audioDataUri: z.string().describe('The base64 encoded WAV audio data URI.'),
});

export type ConversationInput = z.infer<typeof ConversationInputSchema>;
export type ConversationOutput = z.infer<typeof ConversationOutputSchema>;
export type TTSInput = z.infer<typeof TTSInputSchema>;
export type TTSOutput = z.infer<typeof TTSOutputSchema>;

export async function voiceAgent(input: ConversationInput): Promise<ConversationOutput> {
  return voiceAgentFlow(input);
}

export async function textToSpeech(input: TTSInput): Promise<TTSOutput> {
  return textToSpeechFlow(input);
}


// Helper function to convert PCM audio data from Gemini to WAV format
async function toWav(pcmData: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels: 1,
            sampleRate: 24000,
            bitDepth: 16,
        });

        const buffers: Buffer[] = [];
        writer.on('data', (chunk) => buffers.push(chunk));
        writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}


const voiceAgentFlow = ai.defineFlow(
    {
      name: 'voiceAgentFlow',
      inputSchema: ConversationInputSchema,
      outputSchema: ConversationOutputSchema,
    },
    async (input) => {
        const prompt = `You are ManasMitra, a caring and empathetic voice assistant designed to provide mental wellness support. Your goal is to listen to the user, validate their feelings, and gently guide them towards self-reflection and confidence.

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

Your response:`;

        const { output } = await ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-pro',
            input: input,
            output: {
                schema: ConversationOutputSchema,
            },
        });

        return output!;
    }
);

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async ({ text }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });
    if (!media) {
      throw new Error('No audio was generated from the TTS model.');
    }
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    
    return {
        audioDataUri: `data:audio/wav;base64,${wavBase64}`
    };
  }
);
