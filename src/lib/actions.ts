'use server';

import {
  generateAffirmation,
  type GenerateAffirmationInput,
} from '@/ai/flows/daily-affirmations';
import {
  empatheticResponseToDailyCheckin,
  type EmpatheticResponseToDailyCheckinInput,
} from '@/ai/flows/empathetic-response-to-daily-checkin';
import {
  contextualResourceRecommendation
} from '@/ai/flows/contextual-resource-recommendation';
import { 
  analyzeStory,
  type AnalyzeStoryInput 
} from '@/ai/flows/story-analysis-flow';
import {
  analyzeChoices,
  type AnalyzeChoicesInput,
  type AnalyzeChoicesOutput,
} from '@/ai/flows/choice-analysis-flow';


export async function getAffirmation(input: GenerateAffirmationInput) {
  try {
    const { affirmation } = await generateAffirmation(input);
    return affirmation;
  } catch (error) {
    console.error("Failed to generate affirmation:", error);
    // Return a default, uplifting affirmation as a fallback
    return "You have the strength to overcome any challenge. Believe in yourself.";
  }
}

export async function getCheckInResponse(
  input: EmpatheticResponseToDailyCheckinInput & { checkInData: string }
) {
  const { checkInData, ...empatheticInput } = input;

  try {
    const [empatheticResponse, resourceRecommendation] = await Promise.all([
      empatheticResponseToDailyCheckin(empatheticInput),
      contextualResourceRecommendation({ checkInData }),
    ]);
    return {
      response: empatheticResponse.response,
      recommendation: resourceRecommendation.resourceRecommendation,
    };
  } catch (error) {
    console.error("Failed to get check-in response:", error);
    // Also apply a fallback for the check-in response to make it more robust.
    return {
      response: "Thank you for sharing. It takes courage to acknowledge your feelings. Remember to be kind to yourself.",
      recommendation: "Consider trying a simple breathing exercise to help center yourself. You can find some in our Resources section."
    };
  }
}

export async function getStoryAnalysis(input: AnalyzeStoryInput) {
  try {
    const analysis = await analyzeStory(input);
    return analysis;
  } catch (error) {
    console.error("Failed to get story analysis:", error);
    return {
      analysis: "Thank you for sharing your story. It's a wonderful act of creativity to bring a new world to life with your words.",
      identifiedFeeling: "Creative"
    };
  }
}

export async function getChoiceAnalysis(input: AnalyzeChoicesInput): Promise<AnalyzeChoicesOutput> {
    try {
        const analysis = await analyzeChoices(input);
        return analysis;
    } catch (error) {
        console.error("Failed to get choice analysis:", error);
        return {
            tendency: "Reflective",
            analysis: "You took a moment to think through your choices. This shows a thoughtful and reflective approach to situations."
        };
    }
}
