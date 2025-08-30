'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

// Mock data type for poll results
type PollOption = {
  id: string;
  text: string;
  votes: number;
};

type PollResult = {
  id: string;
  title: string;
  description: string;
  totalVotes: number;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  endDate?: string;
};

export default function PollResultsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pollResult, setPollResult] = useState<PollResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPollResults() {
      setIsLoading(true);
      setError(null);
      
      try {
        // This would be replaced with an actual API call to Supabase
        // const { data, error } = await supabase
        //   .from('polls')
        //   .select(`
        //     id, title, description, created_at, 
        //     users(name),
        //     options(id, text, votes)
        //   `)
        //   .eq('id', id)
        //   .single();
        
        // Mock API response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockResult: PollResult = {
          id: id as string,
          title: 'What is your favorite programming language?',
          description: 'Vote for your preferred programming language',
          totalVotes: 120,
          options: [
            { id: '1', text: 'JavaScript', votes: 45 },
            { id: '2', text: 'Python', votes: 38 },
            { id: '3', text: 'TypeScript', votes: 25 },
            { id: '4', text: 'Java', votes: 12 },
          ],
          createdBy: 'John Doe',
          createdAt: '2023-06-15',
          endDate: '2023-07-15',
        };
        
        setPollResult(mockResult);
      } catch (err) {
        setError('Failed to load poll results');
        console.error('Error fetching poll results:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPollResults();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !pollResult) {
    return (
      <div className="container max-w-3xl mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
              <p>{error || 'Failed to load poll results'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{pollResult.title}</CardTitle>
          <CardDescription>{pollResult.description}</CardDescription>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Created by {pollResult.createdBy}</span>
            <span>Total votes: {pollResult.totalVotes}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {pollResult.options.map((option) => {
            const percentage = pollResult.totalVotes > 0 
              ? Math.round((option.votes / pollResult.totalVotes) * 100) 
              : 0;
              
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{option.text}</span>
                  <span className="text-muted-foreground">
                    {option.votes} votes ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-3" />
              </div>
            );
          })}
          
          {pollResult.endDate && (
            <div className="text-sm text-muted-foreground mt-4">
              {new Date(pollResult.endDate) > new Date() 
                ? `Poll ends on ${new Date(pollResult.endDate).toLocaleDateString()}` 
                : 'Poll has ended'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}