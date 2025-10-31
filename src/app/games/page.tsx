import { StoryCompletionGame } from '@/components/games/story-completion-game';
import { ChooseYourFeelingsGame } from '@/components/games/choose-your-feelings-game';

export default function GamesPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Interactive Activities</h1>
        <p className="text-lg text-muted-foreground">
          Engage in activities designed to help you reflect and understand your feelings.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <StoryCompletionGame />
        <ChooseYourFeelingsGame />
      </div>
    </div>
  );
}
