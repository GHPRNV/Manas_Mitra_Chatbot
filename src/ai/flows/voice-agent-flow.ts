'use server';

/**
 * @fileOverview
 * ManasMitra — an empathetic conversational voice agent for mental wellness.
 *
 * - voiceAgent: Handles empathetic conversation flow
 * - textToSpeech: Converts text output to spoken audio (WAV)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav'; // ✅ Ensure this package is installed: npm install wav

// ==========================
// 📘 Schema Definitions
// ==========================
const ConversationInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
      })
    )
    .describe('The conversation history.'),
  currentInput: z.string().describe("The user's latest voice input, transcribed to text."),
});

const ConversationOutputSchema = z.object({
  response: z.string().describe("The AI's empathetic and supportive response."),
});

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

// ==========================
// 🎙️ Voice Agent — Empathetic Conversation Flow
// ==========================
export async function voiceAgent(input: ConversationInput): Promise<ConversationOutput> {
  return voiceAgentFlow(input);
}

const voiceAgentPrompt = ai.definePrompt({
  name: 'voiceAgentPrompt',
  input: { schema: ConversationInputSchema },
  output: { schema: ConversationOutputSchema },
  prompt: `
You are **ManasMitra**, a caring and empathetic voice assistant designed to support mental wellness.

Guidelines:
- **Listen Deeply:** Pay close attention to the user’s emotions and words.
- **Be Empathetic:** Start by acknowledging their feelings (e.g., "It sounds like that’s been really hard for you.").
- **Ask Gentle Questions:** Encourage them to reflect (e.g., "Can you tell me more about that?").
- **Offer Encouragement:** Reinforce their strengths (e.g., "It takes courage to talk about this.").
- **Stay Conversational:** Keep responses short (2–3 sentences).
- **Do NOT give medical advice.** If asked for treatment/diagnosis, gently redirect to a professional.

Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

User's current input: "{{currentInput}}"

Your empathetic response:
`,
});

const voiceAgentFlow = ai.defineFlow(
  {
    name: 'voiceAgentFlow',
    inputSchema: ConversationInputSchema,
    outputSchema: ConversationOutputSchema,
  },
  async (input) => {
    const { output } = await voiceAgentPrompt(input);
    if (!output) throw new Error('voiceAgentPrompt returned no output');
    return output;
  }
);

// ==========================
// 🔊 Text-to-Speech (TTS) Flow
// ==========================
export async function textToSpeech(input: TTSInput): Promise<TTSOutput> {
  return textToSpeechFlow(input);
}

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
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // You can change this
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('No audio was generated from the TTS model.');
    }

    // ✅ Safer handling of possible data formats
    let audioBuffer: Buffer;
    const mediaAny = media as any;

    // Prefer explicit base64 data if present on the media object
    if (mediaAny && typeof mediaAny.data === 'string' && mediaAny.data.length > 0) {
      audioBuffer = Buffer.from(mediaAny.data, 'base64');
    } else if (typeof media?.url === 'string' && media.url.startsWith('data:')) {
      // data: URI -> extract base64 part
      audioBuffer = Buffer.from(media.url.split(',')[1], 'base64');
    } else if (typeof media?.url === 'string' && /^https?:\/\//.test(media.url)) {
      // If the model returned an HTTP(S) URL, attempt to fetch it (Node 18+ or environment with fetch)
      const res = await fetch(media.url);
      if (!res.ok) throw new Error('Failed to fetch TTS audio from URL.');
      const arrayBuf = await res.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuf);
    } else {
      throw new Error('Unexpected TTS output format from model.');
    }

    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);

// ==========================
// 🧩 Helper: PCM → WAV Encoder
// ==========================
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
