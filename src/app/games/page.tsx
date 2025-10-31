'use client';

import { StoryCompletionGame } from '@/components/games/story-completion-game';
import { ChooseYourFeelingsGame } from '@/components/games/choose-your-feelings-game';
import { CalmPulseGame } from '@/components/games/calm-pulse-game';
import { FocusChallengeGame } from '@/components/games/focus-challenge-game';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GamesPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-headline">Interactive Activities</h1>
        <p className="text-lg text-muted-foreground">
          Engage in activities designed to help you reflect and relax.
        </p>
      </div>

      <Tabs defaultValue="story-completion">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mx-auto max-w-3xl">
          <TabsTrigger value="story-completion">Story Completion</TabsTrigger>
          <TabsTrigger value="choose-your-feelings">Choose Your Feelings</TabsTrigger>
          <TabsTrigger value="calm-pulse">Calm Pulse</TabsTrigger>
          <TabsTrigger value="focus-challenge">Focus Challenge</TabsTrigger>
        </TabsList>
        
        <div className="mt-8 flex justify-center">
            <div className="w-full max-w-2xl">
                <TabsContent value="story-completion">
                    <StoryCompletionGame />
                </TabsContent>
                <TabsContent value="choose-your-feelings">
                    <ChooseYourFeelingsGame />
                </TabsContent>
                <TabsContent value="calm-pulse">
                    <CalmPulseGame />
                </TabsContent>
                <TabsContent value="focus-challenge">
                    <FocusChallengeGame />
                </TabsContent>
            </div>
        </div>
      </Tabs>
    </div>
  );
}
