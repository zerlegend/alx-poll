'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for polls
const mockPolls = [
  {
    id: '1',
    title: 'What is your favorite programming language?',
    description: 'Vote for your preferred programming language',
    createdBy: 'John Doe',
    createdAt: '2023-06-15',
    votesCount: 42,
  },
  {
    id: '2',
    title: 'Best frontend framework?',
    description: 'Which frontend framework do you prefer working with?',
    createdBy: 'Jane Smith',
    createdAt: '2023-06-10',
    votesCount: 38,
  },
  {
    id: '3',
    title: 'Remote work or office?',
    description: 'Do you prefer working remotely or in an office environment?',
    createdBy: 'Alex Johnson',
    createdAt: '2023-06-05',
    votesCount: 56,
  },
];

export default function PollsPage() {
  const [polls, setPolls] = useState(mockPolls);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Polls</h1>
        <Link href="/polls/create">
          <Button>Create New Poll</Button>
        </Link>
      </div>

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
    </div>
  );
}