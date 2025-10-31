'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1 for phone number, 2 for OTP
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const createUserProfile = async (
    userId: string,
    phone: string,
  ) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    await setDoc(userRef, {
      id: userId,
      email: null,
      displayName: phone,
      registrationDate: new Date().toISOString(),
    }, { merge: true });
  };
  
  const handleSendOtp = async () => {
    setIsLoading(true);
    setError(null);
    if (!auth) return;

    try {
        // To prevent weird re-rendering issues, we only initialize recaptcha once
        if (!recaptchaVerifier.current) {
            recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        }
      const appVerifier = recaptchaVerifier.current;
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+${phoneNumber}`,
        appVerifier
      );

      setConfirmationResult(confirmation);
      setStep(2);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please check the phone number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError(null);
    if (!confirmationResult) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await confirmationResult.confirm(otp);
       if (result.user && result.user.metadata.creationTime === result.user.metadata.lastSignInTime) {
          await createUserProfile(result.user.uid, `+${phoneNumber}`);
      }
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to verify OTP. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 1) {
        handleSendOtp();
    } else {
        handleVerifyOtp();
    }
  }


  return (
    <div className="container mx-auto flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome to ManasMitra</CardTitle>
          <CardDescription>
            {step === 1 ? 'Enter your phone number to sign in or create an account' : 'Enter the OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    {step === 1 ? (
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                                id="phone" 
                                name="phone" 
                                type="tel" 
                                placeholder="e.g., 11234567890" 
                                required 
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="otp">One-Time Password</Label>
                            <Input 
                                id="otp" 
                                name="otp" 
                                type="text" 
                                placeholder="Enter your 6-digit code" 
                                required 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                    )}
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {step === 1 ? 'Send OTP' : 'Verify OTP'}
                    </Button>
                </div>
            </form>
            {step === 2 && (
                <Button variant="link" onClick={() => { setStep(1); setError(null); }} className="w-full">
                    Change phone number
                </Button>
            )}
          <div id="recaptcha-container"></div>
          {error && (
            <p className="text-destructive text-sm text-center mt-4">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
