'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Calendar, Users, Clock, Eye, EyeOff } from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  endDate?: string;
  isPublic: boolean;
  votesCount: number;
  optionsCount: number;
}

interface PollsPageState {
  polls: Poll[];
  loading: boolean;
  error: string | null;
  sortBy: 'newest' | 'popular' | 'ending';
}

export default function PollsPage() {
  const { user } = useAuth();
  const [state, setState] = useState<PollsPageState>({
    polls: [],
    loading: true,
    error: null,
    sortBy: 'newest',
  });

  // Fetch polls from API
  const fetchPolls = async (sortBy: string = 'newest') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/polls?sort=${sortBy}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch polls: ${response.statusText}`);
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        polls: data.polls || [],
        loading: false,
      }));

    } catch (error) {
      console.error('Error fetching polls:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load polls',
        loading: false,
      }));
    }
  };

  useEffect(() => {
    fetchPolls(state.sortBy);
  }, [state.sortBy]);

  // Handle sort change
  const handleSortChange = (newSort: 'newest' | 'popular' | 'ending') => {
    setState(prev => ({ ...prev, sortBy: newSort }));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if poll is ending soon
  const isEndingSoon = (endDate?: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  };

  // Check if poll has ended
  const hasEnded = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Polls</h1>
          <p className="text-muted-foreground mt-1">
            Discover and participate in community polls
          </p>
        </div>
        
        {user && (
          <Link href="/polls/create">
            <Button size="lg" className="w-full sm:w-auto">
              Create New Poll
            </Button>
          </Link>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-6">
        {(['newest', 'popular', 'ending'] as const).map((sort) => (
          <Button
            key={sort}
            variant={state.sortBy === sort ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange(sort)}
            className="capitalize"
          >
            {sort}
          </Button>
        ))}
      </div>

      {/* Error State */}
      {state.error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive font-medium mb-2">Error Loading Polls</p>
              <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
              <Button onClick={() => fetchPolls(state.sortBy)} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {state.loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!state.loading && state.polls.length === 0 && !state.error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No polls found</h3>
              <p className="text-muted-foreground mb-4">
                {user 
                  ? "Be the first to create a poll and start the conversation!" 
                  : "Log in to create polls and participate in the community!"
                }
              </p>
              {user && (
                <Link href="/polls/create">
                  <Button>Create Your First Poll</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Polls Grid */}
      {!state.loading && state.polls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.polls.map((poll) => (
            <Link key={poll.id} href={`/polls/${poll.id}`} className="block group">
              <Card className="h-full hover:shadow-lg transition-all duration-200 border-0 shadow-md group-hover:shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg leading-tight">
                      {poll.title}
                    </CardTitle>
                    <div className="flex gap-1 flex-shrink-0">
                      {poll.isPublic ? (
                        <Eye className="h-4 w-4 text-green-600" title="Public" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-orange-600" title="Private" />
                      )}
                    </div>
                  </div>
                  
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span>by {poll.createdBy}</span>
                    <span>•</span>
                    <span>{formatDate(poll.createdAt)}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-3">
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {poll.description}
                  </p>
                  
                  {poll.endDate && (
                    <div className="mt-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm ${
                        hasEnded(poll.endDate) 
                          ? 'text-red-600' 
                          : isEndingSoon(poll.endDate) 
                            ? 'text-orange-600' 
                            : 'text-muted-foreground'
                      }`}>
                        {hasEnded(poll.endDate) 
                          ? 'Ended' 
                          : isEndingSoon(poll.endDate) 
                            ? 'Ending soon' 
                            : `Ends ${formatDate(poll.endDate)}`
                        }
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{poll.votesCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{poll.optionsCount}</span>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    {hasEnded(poll.endDate) ? 'Ended' : 'Active'}
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}