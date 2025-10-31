'use client';

import { useUser } from "@/firebase";

export function WelcomeHeader() {
  const { user } = useUser();

  const getGreeting = () => {
    if (user) {
        if(user.phoneNumber) {
            return `Welcome back, ${user.phoneNumber}`;
        }
        return 'Welcome back';
    }
    return 'Welcome, guest';
  }

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold font-headline">{getGreeting()}</h1>
      <p className="text-lg text-muted-foreground">It's a new day to focus on your well-being.</p>
    </div>
  );
}
