'use client';

import { useCheckIns } from "@/lib/hooks/use-check-ins";
import { useMemo } from "react";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { type MoodValue } from "@/lib/types";

const moodToValue: MoodValue = {
    'Happy': 5,
    'Okay': 3,
    'Anxious': 2,
    'Sad': 1,
    'Angry': 1,
};

const chartConfig = {
  moodScore: {
    label: "Mood Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export function MoodChart() {
    const { checkIns } = useCheckIns();

    const chartData = useMemo(() => {
        return checkIns.map(checkIn => ({
            date: format(new Date(checkIn.date), 'MMM d'),
            moodScore: moodToValue[checkIn.mood] || 0,
            moodName: checkIn.mood,
        })).slice(-30); // Show last 30 check-ins
    }, [checkIns]);

    if (checkIns.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <p className="text-lg font-semibold">Not enough data to show a trend.</p>
                <p className="text-muted-foreground">Complete at least two daily check-ins to see your progress.</p>
            </div>
        )
    }

    return (
        <div className="w-full h-96">
            <ChartContainer config={chartConfig}>
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            fontSize={12}
                        />
                        <YAxis 
                            domain={[0, 5]} 
                            ticks={[1, 3, 5]}
                            tickFormatter={(value) => {
                                if (value === 5) return 'Happy';
                                if (value === 3) return 'Okay';
                                if (value === 1) return 'Sad';
                                return '';
                            }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            fontSize={12}
                            width={80}
                        />
                        <ChartTooltip
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '3 3' }}
                            content={
                                <ChartTooltipContent 
                                    formatter={(value, name, props) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold">{props.payload.moodName} (Score: {value})</span>
                                            <span className="text-xs text-muted-foreground">{props.payload.date}</span>
                                        </div>
                                    )}
                                    indicator="dot"
                                />
                            }
                        />
                        <Line 
                            type="monotone" 
                            dataKey="moodScore" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3} 
                            dot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }} 
                            activeDot={{ r: 8, style: { stroke: "hsl(var(--primary))" } }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
