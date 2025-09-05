'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Globe, Lock } from 'lucide-react';

interface PollPreviewProps {
  poll: {
    id: string;
    title: string;
    description: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
    }>;
    totalVotes: number;
    createdBy: string;
    isPublic: boolean;
    hasEnded: boolean;
  };
}

export function PollPreview({ poll }: PollPreviewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState(poll.options.map(opt => opt.votes));

  const handleVote = (optionId: string) => {
    if (hasVoted || poll.hasEnded) return;
    
    setSelectedOption(optionId);
    setHasVoted(true);
    
    // Simulate vote by updating local state
    const newVotes = localVotes.map((votes, index) => {
      if (poll.options[index].id === optionId) {
        return votes + 1;
      }
      return votes;
    });
    setLocalVotes(newVotes);
  };

  const totalVotes = localVotes.reduce((sum, votes) => sum + votes, 0);

  return (
    <Card className="w-full max-w-md mx-auto hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {poll.description}
            </CardDescription>
          </div>
          <div className="flex gap-1 ml-2">
            {poll.isPublic ? (
              <Globe className="h-4 w-4 text-green-600" title="Public" />
            ) : (
              <Lock className="h-4 w-4 text-orange-600" title="Private" />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>by {poll.createdBy}</span>
          <Badge variant={poll.hasEnded ? 'destructive' : 'default'}>
            {poll.hasEnded ? 'Ended' : 'Active'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {poll.hasEnded ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">This poll has ended</p>
            <div className="space-y-3">
              {poll.options.map((option, index) => {
                const percentage = totalVotes > 0 ? (localVotes[index] / totalVotes) * 100 : 0;
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{option.text}</span>
                      <span className="text-muted-foreground">
                        {localVotes[index]} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : hasVoted ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium mb-4">✓ Vote submitted!</p>
            <div className="space-y-3">
              {poll.options.map((option, index) => {
                const percentage = totalVotes > 0 ? (localVotes[index] / totalVotes) * 100 : 0;
                const isSelected = selectedOption === option.id;
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${isSelected ? 'text-green-600' : ''}`}>
                        {option.text} {isSelected && '✓'}
                      </span>
                      <span className="text-muted-foreground">
                        {localVotes[index]} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${isSelected ? 'bg-green-100' : ''}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <Button
                key={option.id}
                variant="outline"
                className="w-full justify-start h-auto p-3 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => handleVote(option.id)}
              >
                <div className="flex items-center w-full">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-3 flex-shrink-0" />
                  <span className="text-left">{option.text}</span>
                </div>
              </Button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalVotes} votes</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{poll.options.length} options</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
