'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth-context';
import { Calendar, Users, Clock, TrendingUp, CheckCircle } from 'lucide-react';

// Types
interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollResults {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  endDate: string | null;
  isPublic: boolean;
  createdBy: string;
  options: PollOption[];
  totalVotes: number;
  hasEnded: boolean;
  userVote?: string;
}

interface ResultsPageState {
  poll: PollResults | null;
  loading: boolean;
  error: string | null;
}

export default function PollResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [state, setState] = useState<ResultsPageState>({
    poll: null,
    loading: true,
    error: null,
  });

  // Fetch poll results
  useEffect(() => {
    const fetchPollResults = async () => {
      if (!params.id) return;

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const response = await fetch(`/api/polls/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Poll not found');
          } else if (response.status === 403) {
            throw new Error('Access denied');
          } else {
            throw new Error('Failed to load poll results');
          }
        }

        const pollData = await response.json();
        setState(prev => ({
          ...prev,
          poll: pollData,
          loading: false,
        }));

      } catch (error) {
        console.error('Error fetching poll results:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load poll results',
          loading: false,
        }));
      }
    };

    fetchPollResults();
  }, [params.id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate percentage for each option
  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  // Get the winning option
  const getWinningOption = (options: PollOption[]) => {
    if (options.length === 0) return null;
    return options.reduce((prev, current) => 
      (prev.votes > current.votes) ? prev : current
    );
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (state.error || !state.poll) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Error Loading Results</CardTitle>
            <CardDescription>
              {state.error || "The poll results could not be loaded."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/polls')}>
                Back to Polls
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { poll } = state;
  const winningOption = getWinningOption(poll.options);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="text-base mb-4">
                  {poll.description}
                </CardDescription>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>by {poll.createdBy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(poll.createdAt)}</span>
                </div>
                {poll.endDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {poll.hasEnded ? 'Ended' : 'Ends'} {formatDate(poll.endDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Badge variant={poll.isPublic ? 'default' : 'secondary'}>
                {poll.isPublic ? 'Public' : 'Private'}
              </Badge>
              <Badge variant={poll.hasEnded ? 'destructive' : 'default'}>
                {poll.hasEnded ? 'Ended' : 'Active'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Results Summary */}
          <div className="mb-8 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Results Summary</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{poll.totalVotes} total votes</span>
              </div>
            </div>
            
            {winningOption && (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">
                  "{winningOption.text}" is winning with {winningOption.votes} votes
                </span>
              </div>
            )}
          </div>

          {/* Poll Options Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Vote Breakdown</h3>
            
            {poll.options.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No options available for this poll.
              </p>
            ) : (
              poll.options
                .sort((a, b) => b.votes - a.votes) // Sort by votes descending
                .map((option, index) => {
                  const percentage = calculatePercentage(option.votes, poll.totalVotes);
                  const isUserVote = poll.userVote === option.id;
                  const isWinner = winningOption?.id === option.id;
                  
                  return (
                    <div
                      key={option.id}
                      className={`p-4 border rounded-lg transition-all ${
                        isWinner 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {isWinner && (
                            <Badge variant="default" className="bg-green-600">
                              Winner
                            </Badge>
                          )}
                          {isUserVote && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Your vote</span>
                            </div>
                          )}
                          <span className="font-medium text-lg">
                            {String.fromCharCode(65 + index)}. {option.text}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {option.votes} votes
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                      
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                  );
                })
            )}
          </div>

          {/* No votes message */}
          {poll.totalVotes === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No votes yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to vote on this poll!
              </p>
              {!poll.hasEnded && (
                <Button onClick={() => router.push(`/polls/${poll.id}/vote`)}>
                  Vote Now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button 
          variant="outline" 
          onClick={() => router.push('/polls')}
        >
          ← Back to Polls
        </Button>
        
        {!poll.hasEnded && !poll.userVote && (
          <Button onClick={() => router.push(`/polls/${poll.id}/vote`)}>
            Vote Now
          </Button>
        )}
        
        {!poll.hasEnded && poll.userVote && (
          <Button 
            variant="outline" 
            onClick={() => router.push(`/polls/${poll.id}/vote`)}
          >
            Change Vote
          </Button>
        )}
      </div>
    </div>
  );
}
