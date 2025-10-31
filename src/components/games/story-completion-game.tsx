'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { getStoryAnalysis } from '@/lib/actions';

const storyPrompts = [
  "The small boat drifted on a sea of stars. In the distance, a single lighthouse blinked. As the boat got closer, the light wasn't from a lamp, but from...",
  "Deep within the quiet library, I found a book with blank pages. As I touched the first page, words began to appear, telling a story only I could read. It started with...",
  'The old robot sat alone in the junkyard, watching the world go by. One day, a small bird landed on its shoulder and chirped a strange tune. The robot began to...',
];

type AnalysisResponse = {
  analysis: string;
  identifiedFeeling: string;
} | null;

export function StoryCompletionGame() {
  const [step, setStep] = useState(1);
  const [storyPrompt] = useState(storyPrompts[Math.floor(Math.random() * storyPrompts.length)]);
  const [userCompletion, setUserCompletion] = useState('');
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!userCompletion) return;
    setStep(3); // Move to the analysis step
    startTransition(async () => {
      const response = await getStoryAnalysis({ storyPrompt, userCompletion });
      setAnalysisResponse(response);
    });
  };

  const resetGame = () => {
    setStep(1);
    setUserCompletion('');
    setAnalysisResponse(null);
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Start Screen
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Lightbulb className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline">Story Completion</CardTitle>
              </div>
              <CardDescription>
                Finish the story starter. There are no right or wrong answers, just your own unique path. Let your creativity flow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg border italic">
                <p>"{storyPrompt}"</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setStep(2)}>Begin Writing</Button>
            </CardFooter>
          </Card>
        );
      case 2: // Writing Screen
        return (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Continue The Story</CardTitle>
              <CardDescription className="italic">"{storyPrompt}..."</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What happens next?"
                value={userCompletion}
                onChange={(e) => setUserCompletion(e.target.value)}
                rows={10}
                className="text-base"
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} disabled={isPending || !userCompletion}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Finish Story & Get Reflection'
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      case 3: // Analysis Screen
        return (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Your Story's Reflection</CardTitle>
              <CardDescription>Here are some gentle thoughts on the themes in your story.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPending ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                analysisResponse && (
                  <div className="p-4 bg-accent/20 rounded-lg border border-accent/30 space-y-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-accent-foreground" />
                      <h4 className="font-bold text-accent-foreground">
                        A Reflection For You
                      </h4>
                    </div>
                    <p className="text-base">{analysisResponse.analysis}</p>
                    <p className="text-sm text-muted-foreground">
                      Identified theme: <span className="font-semibold">{analysisResponse.identifiedFeeling}</span>
                    </p>
                  </div>
                )
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={resetGame}>Play Again</Button>
            </CardFooter>
          </Card>
        );
    }
  };

  return <>{renderStep()}</>;
}
