'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseApp } = useFirebase();
  const router = useRouter();
  
  const auth = getAuth(firebaseApp);

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Enter Anonymously</CardTitle>
          <CardDescription>
            Sign in anonymously to track your progress and use the forum. Your data remains private to your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button className="w-full" onClick={handleAnonymousSignIn} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In Anonymously
          </Button>
          {error && <p className="text-destructive text-sm text-center mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
