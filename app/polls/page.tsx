'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

interface Poll {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  votesCount: number;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch('/api/polls');
        if (!response.ok) {
          throw new Error('Failed to fetch polls');
        }
        const data = await response.json();
        setPolls(data.polls);
      } catch (error) {
        console.error('Error fetching polls:', error);
        setError('Failed to load polls');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Polls</h1>
        <Link href="/polls/create">
          <Button>Create New Poll</Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {user ? 'No polls found. Create the first one!' : 'No polls found. Log in to create polls!'}
            </p>
            {user && (
              <div className="text-center mt-4">
                <Link href="/polls/create">
                  <Button>Create Your First Poll</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <Link key={poll.id} href={`/polls/${poll.id}`} className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{poll.title}</CardTitle>
                  <CardDescription>Created by {poll.createdBy} on {poll.createdAt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{poll.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">{poll.votesCount} votes</p>
                  <Button variant="outline" size="sm">View Poll</Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}