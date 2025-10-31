'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Volume2, User, Bot } from 'lucide-react';
import { voiceAgent, textToSpeech } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function VoiceAgentPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognition = useRef<any>(null); // Using 'any' for SpeechRecognition for broader compatibility
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Create a hidden audio element for playback on component mount
  useEffect(() => {
    audioPlayer.current = new Audio();
  }, []);

  const handleNewMessage = async (text: string, role: 'user' | 'model') => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setInterimTranscript('');
    const newConversation = [...conversation, { role, content: text }];
    setConversation(newConversation);

    if (role === 'user') {
      try {
        // Get AI text response
        const aiResult = await voiceAgent({
          history: newConversation,
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
        toast({
            variant: 'destructive',
            title: 'AI Agent Error',
            description: "I'm having a little trouble thinking right now. Please try again in a moment.",
        });
        setConversation(prev => [...prev.slice(0, -1)]); // Remove the user message if AI fails
      }
    }
    setIsLoading(false);
  };
  
  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Unsupported Browser',
        description: "Sorry, your browser doesn't support the voice agent.",
      });
      return false;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);

      if (finalTranscript) {
        handleNewMessage(finalTranscript, 'user');
      }
    };

    recognitionInstance.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        toast({
          variant: 'destructive',
          title: 'Speech Recognition Error',
          description: `There was a problem with the speech service (${event.error}). Please check your connection and try again.`,
        });
      }
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    recognition.current = recognitionInstance;
    return true;
  };


  const toggleRecording = async () => {
    if (isRecording) {
      recognition.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!setupSpeechRecognition()) {
        return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Microphone access is required. Please enable it in your browser settings.',
      });
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
            {conversation.length === 0 && !isRecording && (
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
             {isRecording && (
                 <div className="flex items-start gap-3 justify-end">
                    <div className="rounded-lg px-4 py-2 max-w-sm bg-primary/80 text-primary-foreground italic">
                        {interimTranscript || "Listening..."}
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                        <User size={20}/>
                    </div>
                 </div>
             )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
            <Button onClick={toggleRecording} size="lg" className="rounded-full w-20 h-20" disabled={isLoading}>
                {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
            </Button>
            <p className="text-sm text-muted-foreground h-4">
                {isRecording ? "Listening..." : (isLoading ? "Thinking..." : "Tap the mic to talk")}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
