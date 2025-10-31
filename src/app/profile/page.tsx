'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateProfile,
  sendPasswordResetEmail,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState(1); // 1 for phone number, 2 for OTP
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '+91');
    }
  }, [user]);

  useEffect(() => {
    if (auth && !recaptchaVerifier.current && recaptchaContainerRef.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            size: 'invisible',
            callback: () => { /* reCAPTCHA solved */ },
        });
        recaptchaVerifier.current.render().catch((err) => {
            console.error("RecaptchaVerifier render error:", err);
            setError("Could not initialize reCAPTCHA. Please refresh the page.");
        });
    }
  }, [auth]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;
    
    setIsSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });

      // Update Firestore document
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, { displayName }, { merge: true });

      toast({
        title: 'Success!',
        description: 'Your profile has been updated.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: err.message || 'Could not update your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!user?.email) {
        toast({
            variant: 'destructive',
            title: 'No Email Found',
            description: 'A password reset link cannot be sent without a registered email address.',
        });
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
            title: 'Password Reset Email Sent',
            description: `An email has been sent to ${user.email} with instructions to reset your password.`,
        });
    } catch(err: any) {
        console.error(err);
        toast({
            variant: 'destructive',
            title: 'Failed to Send Email',
            description: err.message || 'Could not send password reset email.',
        });
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recaptchaVerifier.current) return;
    
    setIsLoadingOtp(true);
    setError(null);
    try {
        const appVerifier = recaptchaVerifier.current;
        const confirmation = await linkWithPhoneNumber(user, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setPhoneStep(2);
        toast({
            title: 'OTP Sent!',
            description: `A one-time password has been sent to ${phoneNumber}.`,
        });
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to send OTP.');
    } finally {
        setIsLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setIsLoadingOtp(true);
    setError(null);
    try {
        await confirmationResult.confirm(otp);
        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, { phoneNumber: user.phoneNumber }, { merge: true });
        toast({
            title: 'Success!',
            description: 'Your phone number has been linked to your account.',
        });
        setPhoneStep(1);
        setOtp('');
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to verify OTP.');
    } finally {
        setIsLoadingOtp(false);
    }
  };


  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold font-headline mb-8">My Profile</h1>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={handleProfileUpdate}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your display name and email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user.email || 'No email provided'}
                  disabled
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Phone Number</CardTitle>
              <CardDescription>{user.phoneNumber ? 'Your phone number is linked.' : 'Link your phone number.'}</CardDescription>
            </CardHeader>
            <CardContent>
              {phoneStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (India)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+919876543210"
                      disabled={isLoadingOtp}
                    />
                  </div>
                  <Button type="submit" disabled={isLoadingOtp} className="w-full">
                    {isLoadingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {user.phoneNumber ? 'Change Number' : 'Send OTP'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">One-Time Password</Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      disabled={isLoadingOtp}
                    />
                  </div>
                  <Button type="submit" disabled={isLoadingOtp} className="w-full">
                    {isLoadingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify OTP
                  </Button>
                   <Button variant="link" onClick={() => setPhoneStep(1)} className="w-full">
                        Back
                    </Button>
                </form>
              )}
               <div id="recaptcha-container" ref={recaptchaContainerRef} className="my-4"></div>
               {error && <p className="text-destructive text-sm text-center mt-2">{error}</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handlePasswordReset} variant="outline" disabled={!user.email}>
                Send Password Reset Email
              </Button>
              {!user.email && <p className="text-xs text-muted-foreground mt-2">Password reset is only available for accounts with an email address.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
