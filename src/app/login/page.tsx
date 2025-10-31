'use client';

import { useState } from 'react';
import { useRouter }from 'next/navigation';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseApp } = useFirebase();
  const router = useRouter();
  
  const auth = getAuth(firebaseApp);

  const setupRecaptcha = () => {
    if (!auth) return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setupRecaptcha();

    const appVerifier = window.recaptchaVerifier!;
    
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+${phoneNumber}`,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      // Reset reCAPTCHA so user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
            window.grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
        if (window.confirmationResult) {
            await window.confirmationResult.confirm(otp);
            // User signed in successfully.
            router.push('/');
        }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        {step === 'phone' ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Login</CardTitle>
              <CardDescription>
                Enter your phone number to receive a verification code.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="19876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSendOtp} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Verify Code</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to your phone.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full" onClick={handleVerifyOtp} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Login
              </Button>
              <Button variant="link" size="sm" onClick={() => { setStep('phone'); setError(null); }}>
                Back to phone number entry
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
      <div id="recaptcha-container"></div>
    </div>
  );
}
