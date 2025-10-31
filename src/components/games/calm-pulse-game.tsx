'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Wind, Hand, Award, Repeat } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const CYCLE_DURATION = 8000; // 8 seconds total: 3s inhale, 1s hold, 4s exhale
const INHALE_DURATION = 3000;
const HOLD_DURATION = 1000;
const EXHALE_DURATION = 4000;
const TOTAL_CYCLES = 5;

type GameState = 'idle' | 'playing' | 'results';
type Phase = 'inhale' | 'hold' | 'exhale';

export function CalmPulseGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [score, setScore] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsHolding(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsHolding(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let cycleTimer: NodeJS.Timeout;

    if (cycle < TOTAL_CYCLES) {
      // Start of a new cycle
      setPhase('inhale');
      cycleTimer = setTimeout(() => {
        setPhase('hold');
        setTimeout(() => {
          setPhase('exhale');
          setTimeout(() => {
            setCycle((c) => c + 1);
          }, EXHALE_DURATION);
        }, HOLD_DURATION);
      }, INHALE_DURATION);
    } else {
      setGameState('results');
    }

    return () => clearTimeout(cycleTimer);
  }, [gameState, cycle]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const scoreInterval = setInterval(() => {
      // Award points if user is holding during the correct phase (inhale)
      if (isHolding && phase === 'inhale') {
        setScore((s) => s + 2);
      }
      // Penalize for holding during the wrong phase (exhale)
      if (isHolding && phase === 'exhale') {
        setScore((s) => Math.max(0, s - 1));
      }
    }, 100);

    return () => clearInterval(scoreInterval);
  }, [gameState, isHolding, phase]);
  
  const startGame = () => {
      setGameState('playing');
      setCycle(0);
      setScore(0);
  }

  const resetGame = () => {
      setGameState('idle');
      setCycle(0);
      setScore(0);
  }

  const renderContent = () => {
    switch (gameState) {
      case 'idle':
        return (
          <>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline">Calm Pulse</CardTitle>
              </div>
              <CardDescription>
                A simple breathing game to help you relax and find your rhythm.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>Follow the circle as it expands and contracts.</p>
              <p className="font-semibold">Press and hold the <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Spacebar</kbd> as you breathe in, and release as you breathe out.</p>
              <p className="text-sm text-muted-foreground">Try to match the rhythm for all 5 cycles.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={startGame} className="w-full">
                Begin
              </Button>
            </CardFooter>
          </>
        );
      case 'playing':
        const phaseText = {
            inhale: "Breathe In...",
            hold: "Hold",
            exhale: "Breathe Out...",
        }[phase];
        
        return (
          <CardContent className="flex flex-col items-center justify-center space-y-8 pt-6">
             <div className='relative w-48 h-48'>
                <AnimatePresence>
                <motion.div
                  key={phase}
                  initial={{ scale: phase === 'inhale' ? 0.5 : 1, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5}}
                  className='absolute inset-0'
                >
                    <motion.div
                        className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center"
                        animate={ phase === 'inhale' ? { scale: 1 } : { scale: 0.5 }}
                        transition={{ duration: phase === 'inhale' ? INHALE_DURATION/1000 : EXHALE_DURATION/1000, ease: "easeInOut"}}
                    />
                </AnimatePresence>
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                     <p className='text-xl font-bold text-primary-foreground select-none'>{phaseText}</p>
                </div>
            </div>
            <div className="w-full space-y-2">
                <p className="text-center text-sm text-muted-foreground">Cycle {cycle + 1} of {TOTAL_CYCLES}</p>
                <Progress value={(cycle / TOTAL_CYCLES) * 100} />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                <Hand className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">
                    {isHolding ? 'Holding...' : 'Released'}
                </span>
            </div>
          </CardContent>
        );
        case 'results':
            const finalScore = Math.min(100, Math.round((score / (TOTAL_CYCLES * 60)) * 100)); // Rough percentage
            return(
                <>
                <CardHeader>
                    <CardTitle className="font-headline text-center">Exercise Complete</CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <Award className="w-8 h-8" />
                        <p className="text-4xl font-bold">{finalScore}%</p>
                    </div>
                    <p className="text-muted-foreground font-semibold">Sync Score</p>
                    <p className="text-center max-w-sm">
                        {finalScore > 75 ? "Great job! You were very in sync with your breath." : "Good effort. With practice, you'll find your rhythm."}
                    </p>
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

  return <Card className="flex flex-col justify-between min-h-[350px]">{renderContent()}</Card>;
}
