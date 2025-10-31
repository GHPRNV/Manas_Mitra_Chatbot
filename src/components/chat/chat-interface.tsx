'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { getChatResponse } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser } from '@/firebase';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isPending) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    startTransition(async () => {
      const chatHistory = [...messages, userMessage];
      const result = await getChatResponse({
        history: chatHistory,
        currentInput: input,
      });
      setMessages(prev => [...prev, { role: 'model', content: result.response }]);
    });
  };

  const getUserInitial = () => {
    if (!user) return 'U';
    if (user.isAnonymous) return 'A';
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <Card className="flex flex-col h-full w-full max-w-3xl mx-auto rounded-none border-0 md:rounded-lg md:border">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">Chat with ManasMitra</CardTitle>
        <CardDescription className="text-lg text-muted-foreground">
          Your personal AI wellness companion.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0 md:p-6 md:pt-0">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="space-y-6 p-4 md:p-0">
            {messages.length === 0 && (
                <div className="flex flex-col h-full items-center justify-center text-center text-muted-foreground pt-16">
                    <Bot className="w-16 h-16 mb-4"/>
                    <p className="font-semibold">Your conversation starts here.</p>
                    <p>What's on your mind today?</p>
                </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={cn('flex items-start gap-3', msg.role === 'user' ? 'justify-end' : '')}>
                {msg.role === 'model' && (
                  <Avatar className="flex-shrink-0 w-8 h-8">
                    <AvatarFallback><Bot size={20}/></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn('rounded-lg px-4 py-2 max-w-sm break-words', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {msg.content}
                </div>
                 {msg.role === 'user' && (
                  <Avatar className="flex-shrink-0 w-8 h-8">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{getUserInitial()}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isPending && (
                <div className="flex items-start gap-3">
                    <Avatar className="flex-shrink-0 w-8 h-8">
                        <AvatarFallback><Bot size={20}/></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                       <Loader2 className="w-5 h-5 animate-spin"/>
                    </div>
                </div>
             )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input
              id="message"
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isPending}
            />
            <Button type="submit" size="icon" disabled={isPending || !input}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
