'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { BrainCircuit, Repeat, Timer, Award } from 'lucide-react';
import { 
  Heart, Star, Circle, Square, Triangle, Diamond, Sun, Moon,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GAME_DURATION = 60; // 60 seconds
const ICONS = [Heart, Star, Circle, Square, Triangle, Diamond, Sun, Moon];

type CardData = {
  id: number;
  icon: LucideIcon;
  isFlipped: boolean;
  isMatched: boolean;
};

type GameState = 'idle' | 'playing' | 'results';

const shuffleArray = (array: any[]) => {
  return array.slice().sort(() => Math.random() - 0.5);
};

const generateCards = () => {
    const cardPairs = ICONS.flatMap((Icon, index) => [
        { id: index * 2, icon: Icon, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, icon: Icon, isFlipped: false, isMatched: false },
    ]);
    return shuffleArray(cardPairs);
}

export function FocusChallengeGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0) {
        setGameState('results');
    }
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstIndex, secondIndex] = flippedCards;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.icon === secondCard.icon) {
        // Match
        setScore(s => s + 1);
        setCards(prev => prev.map(card => 
            card.icon === firstCard.icon ? { ...card, isMatched: true } : card
        ));
        setFlippedCards([]);
        if (score + 1 === ICONS.length) {
            setGameState('results');
        }
      } else {
        // Mismatch
        setErrors(e => e + 1);
        setTimeout(() => {
          setCards(prev => prev.map((card, index) => 
            index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards, score]);


  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || flippedCards.length === 2 || cards[index].isFlipped) {
      return;
    }
    setCards(prev => prev.map((card, i) => i === index ? { ...card, isFlipped: true } : card));
    setFlippedCards(prev => [...prev, index]);
  };

  const startGame = () => {
    setCards(generateCards());
    setGameState('playing');
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setErrors(0);
    setFlippedCards([]);
  };
  
  const resetGame = () => {
      setGameState('idle');
  }

  const renderContent = () => {
    switch (gameState) {
      case 'idle':
        return (
          <>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline">Focus Challenge</CardTitle>
              </div>
              <CardDescription>
                Test your memory and concentration by matching pairs of cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>You'll have {GAME_DURATION} seconds to find all the matching pairs.</p>
              <p className="text-sm text-muted-foreground">Are you ready?</p>
            </CardContent>
            <CardFooter>
              <Button onClick={startGame} className="w-full">
                Start Challenge
              </Button>
            </CardFooter>
          </>
        );
      case 'playing':
        return (
          <>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-headline">Find the Pairs</CardTitle>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted text-muted-foreground font-semibold">
                    <Timer className="w-5 h-5" />
                    <span>{timeLeft}s</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                {cards.map((card, index) => (
                    <div key={index} className="aspect-square" onClick={() => handleCardClick(index)}>
                        <div 
                            className={cn(
                                "w-full h-full rounded-md transition-transform duration-500 cursor-pointer",
                                card.isFlipped ? '[transform:rotateY(180deg)]' : '',
                                '[transform-style:preserve-3d]'
                            )}
                        >
                            <div className="absolute w-full h-full bg-secondary rounded-md flex items-center justify-center [backface-visibility:hidden]">
                                {/* Back of card */}
                            </div>
                            <div className={cn(
                                "absolute w-full h-full bg-card border-2 rounded-md flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden]",
                                card.isMatched ? 'border-green-500' : 'border-primary'
                            )}>
                                <card.icon className={cn("w-1/2 h-1/2", card.isMatched ? 'text-green-500' : 'text-primary')} />
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </CardContent>
          </>
        );
        case 'results':
            return(
                <>
                <CardHeader>
                    <CardTitle className="font-headline text-center">Challenge Complete!</CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center gap-3 text-primary text-4xl font-bold">
                        <Award className="w-8 h-8" />
                        <p>{score} / {ICONS.length}</p>
                    </div>
                    <p className="text-muted-foreground font-semibold">Pairs Found</p>
                    <div className="text-center">
                        <p>Time remaining: <span className="font-bold">{timeLeft}s</span></p>
                        <p>Mismatches: <span className="font-bold">{errors}</span></p>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={resetGame} className="w-full">
                        <Repeat className="mr-2" />
                        Play Again
                    </Button>
                </CardFooter>
                </>
            );
    }
  };

  return <Card className="flex flex-col justify-between min-h-[450px]">{renderContent()}</Card>;
}
