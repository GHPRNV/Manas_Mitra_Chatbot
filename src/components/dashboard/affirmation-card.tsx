'use client';

import { getAffirmation } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useTransition } from "react";
import { RefreshCw, Zap } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function AffirmationCard() {
    const [affirmation, setAffirmation] = useState('');
    const [isPending, startTransition] = useTransition();

    const fetchAffirmation = () => {
        startTransition(async () => {
            const result = await getAffirmation({});
            setAffirmation(result);
        });
    };

    useEffect(() => {
        fetchAffirmation();
    }, []);

    return (
        <Card className="bg-accent/20 border-accent/30">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-accent-foreground" />
                    <h3 className="text-lg font-bold text-accent-foreground font-headline">Daily Affirmation</h3>
                </div>

                {isPending && !affirmation ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : (
                    <p className="text-2xl font-medium min-h-[5rem]">"{affirmation}"</p>
                )}
                
                <Button variant="ghost" size="sm" onClick={fetchAffirmation} disabled={isPending} className="mt-4">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                    New Affirmation
                </Button>
            </CardContent>
        </Card>
    );
}
