'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Volume2, User, Bot } from 'lucide-react';
import { textToSpeech, voiceAgent } from '@/lib/actions';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function VoiceAgentPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recognition = useRef<any>(null); // Using 'any' for SpeechRecognition for broader compatibility
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleNewMessage(transcript, 'user');
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }

    // Create a hidden audio element for playback
    audioPlayer.current = new Audio();
  }, []);

  const handleNewMessage = async (text: string, role: 'user' | 'model') => {
    setIsLoading(true);
    const newConversation = [...conversation, { role, content: text }];
    setConversation(newConversation);

    if (role === 'user') {
      try {
        // Get AI text response
        const aiResult = await voiceAgent({
          history: conversation,
          currentInput: text,
        });

        // Add AI response to conversation
        setConversation(prev => [...prev, { role: 'model', content: aiResult.response }]);

        // Get AI audio response
        const audioResult = await textToSpeech({ text: aiResult.response });
        
        // Play the audio
        if (audioPlayer.current) {
          audioPlayer.current.src = audioResult.audioDataUri;
          audioPlayer.current.play();
        }

      } catch (error) {
        console.error('Error with AI agent:', error);
        setConversation(prev => [...prev, { role: 'model', content: "I'm having a little trouble speaking right now. Please try again in a moment." }]);
      }
    }
    setIsLoading(false);
  };


  const toggleRecording = async () => {
    if (!recognition.current) {
      alert("Sorry, your browser doesn't support voice commands.");
      return;
    }

    if (isRecording) {
      recognition.current.stop();
      setIsRecording(false);
    } else {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access is required to use the voice agent. Please enable it in your browser settings.");
      }
    }
  };


  return (
    <div className="p-4 md:p-8 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">Voice Agent</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            A safe space to talk through your feelings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 h-96 overflow-y-auto p-4 rounded-lg border bg-muted/50">
            {conversation.length === 0 && (
                <div className="flex flex-col h-full items-center justify-center text-center text-muted-foreground">
                    <Volume2 className="w-16 h-16 mb-4"/>
                    <p className="font-semibold">Your conversation will appear here.</p>
                    <p>Press the microphone to begin.</p>
                </div>
            )}
            {conversation.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot size={20}/>
                  </div>
                )}
                <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                  {msg.content}
                </div>
                 {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                    <User size={20}/>
                  </div>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot size={20}/>
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-background flex items-center">
                       <Loader2 className="w-5 h-5 animate-spin"/>
                    </div>
                </div>
             )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
            <Button onClick={toggleRecording} size="lg" className="rounded-full w-20 h-20" disabled={isLoading}>
                {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
            </Button>
            <p className="text-sm text-muted-foreground">
                {isRecording ? "Listening..." : "Tap the mic to talk"}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
