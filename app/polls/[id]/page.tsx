'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  options: PollOption[];
  totalVotes: number;
}

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the poll data based on the ID
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/polls/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch poll');
        }
        const pollData = await response.json();
        setPoll(pollData);
      } catch (error) {
        console.error('Error fetching poll:', error);
        setError('Failed to load poll');
      }
    };

    fetchPoll();
  }, [params]);

  const handleVote = () => {
    if (!selectedOption || !poll) return;
    
    setIsLoading(true);
    
    // Simulate API call to submit vote
    setTimeout(() => {
      // Update the poll data with the new vote
      setPoll(prev => {
        if (!prev) return prev;
        const updatedOptions = prev.options.map(option => {
          if (option.id === selectedOption) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });
        
        return {
          ...prev,
          options: updatedOptions,
          totalVotes: prev.totalVotes + 1,
        };
      });
      
      setHasVoted(true);
      setIsLoading(false);
    }, 1000);
  };

  const calculatePercentage = (votes: number) => {
    return poll && poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          ← Back to Polls
        </Button>
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          ← Back to Polls
        </Button>
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-center">Loading poll...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        ← Back to Polls
      </Button>
      
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>
            Created by {poll.createdBy} on {poll.createdAt}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">{poll.description}</p>
          
          <div className="space-y-4">
            {poll.options.map((option) => (
              <div 
                key={option.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedOption === option.id && !hasVoted ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => !hasVoted && setSelectedOption(option.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm">
                      {option.votes} votes ({calculatePercentage(option.votes)}%)
                    </span>
                  )}
                </div>
                
                {hasVoted && (
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${calculatePercentage(option.votes)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          {!hasVoted ? (
            <Button 
              onClick={handleVote} 
              disabled={!selectedOption || isLoading} 
              className="w-full"
            >
              {isLoading ? 'Submitting...' : 'Submit Vote'}
            </Button>
          ) : (
            <div className="w-full text-center">
              <p className="text-muted-foreground">Thank you for voting!</p>
              <p className="font-medium">Total votes: {poll.totalVotes}</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}