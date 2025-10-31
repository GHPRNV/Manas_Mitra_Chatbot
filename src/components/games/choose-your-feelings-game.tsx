'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import { Loader2, Sparkles, BookHeart } from 'lucide-react';
import { getChoiceAnalysis } from '@/lib/actions';
import { type Choice } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

type Scenario = {
  id: number;
  scenario: string;
  options: {
    text: string;
    nextId: number;
  }[];
};

const story: Scenario[] = [
  {
    id: 1,
    scenario: 'A friend cancels plans with you at the last minute.',
    options: [
      { text: 'Feel hurt and a little disappointed.', nextId: 2 },
      { text: 'Say "I understand, no worries!"', nextId: 3 },
      { text: 'Get angry and text them back an annoyed message.', nextId: 4 },
    ],
  },
  {
    id: 2,
    scenario: 'You chose to feel hurt. Your friend replies, "I\'m so sorry, I feel terrible!" How do you respond?',
    options: [
      { text: '"It\'s okay, don\'t worry about it."', nextId: 5 },
      { text: '"I was really looking forward to it, I feel let down."', nextId: 5 },
    ],
  },
  {
    id: 3,
    scenario: 'You chose to be understanding. Later, you see them on social media having fun with other people. What do you think?',
    options: [
      { text: 'Feel a pang of jealousy and exclusion.', nextId: 5 },
      { text: 'Decide to talk to them about it later.', nextId: 5 },
    ],
  },
  {
    id: 4,
    scenario: 'You chose to get angry. They don\'t reply to your message for hours. What do you do?',
    options: [
      { text: 'Send another angry message.', nextId: 5 },
      { text: 'Take some deep breaths and try to calm down.', nextId: 5 },
    ],
  },
];


const END_NODE = 5;

type AnalysisResponse = {
  tendency: string;
  analysis: string;
} | null;

export function ChooseYourFeelingsGame() {
  const [currentScenarioId, setCurrentScenarioId] = useState(1);
  const [userChoices, setUserChoices] = useState<Choice[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse>(null);
  const [isPending, startTransition] = useTransition();

  const currentScenario = story.find((s) => s.id === currentScenarioId);

  const handleChoice = (option: { text: string; nextId: number }) => {
    const choice: Choice = {
      scenario: currentScenario!.scenario,
      choice: option.text,
    };
    const newChoices = [...userChoices, choice];
    setUserChoices(newChoices);

    if (option.nextId === END_NODE) {
      setCurrentScenarioId(END_NODE);
      startTransition(async () => {
        const result = await getChoiceAnalysis({ choices: newChoices });
        setAnalysis(result);
      });
    } else {
      setCurrentScenarioId(option.nextId);
    }
  };
  
  const resetGame = () => {
      setCurrentScenarioId(1);
      setUserChoices([]);
      setAnalysis(null);
  }

  if (!currentScenario) {
    return <Card><CardContent>Loading story...</CardContent></Card>;
  }

  if (currentScenario.id === END_NODE) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Your Story's Reflection</CardTitle>
          <CardDescription>Based on your choices, here is a small insight.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className='space-y-4'>
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="p-4 bg-accent/20 rounded-lg border border-accent/30 space-y-4">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-accent-foreground" />
                    <h4 className="font-bold text-accent-foreground">
                    Emotional Tendency: {analysis?.tendency}
                    </h4>
                </div>
                <p>{analysis?.analysis}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <Button onClick={resetGame}>Play Again</Button>
        </CardFooter>
      </Card>
    );
  }


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <BookHeart className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline">Choose Your Feelings</CardTitle>
        </div>
        <CardDescription>
            Explore your reactions in this short, interactive story.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <motion.div
            key={currentScenario.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <p className="text-lg font-semibold leading-relaxed min-h-[4rem]">{currentScenario.scenario}</p>
            <div className="grid grid-cols-1 gap-3">
                {currentScenario.options.map((option, index) => (
                <Button
                    key={index}
                    variant="outline"
                    className="h-auto text-wrap justify-start p-4"
                    onClick={() => handleChoice(option)}
                >
                    {option.text}
                </Button>
                ))}
            </div>
        </motion.div>
      </CardContent>
       <CardFooter>
            <p className="text-xs text-muted-foreground">Step {userChoices.length + 1} of {story.length -1}</p>
        </CardFooter>
    </Card>
  );
}
