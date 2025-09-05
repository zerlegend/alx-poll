/**
 * Interactive Demo Component - Live Poll Experience
 * 
 * This component provides users with hands-on experience of the ALX Poll
 * platform through interactive demo polls. It serves as a key conversion
 * tool by allowing visitors to experience the core functionality before
 * committing to registration.
 * 
 * ## Purpose & Context
 * 
 * The InteractiveDemo addresses the critical need to demonstrate value
 * immediately to potential users:
 * 
 * 1. **Reduced Friction**: Users can vote on polls without creating an account,
 *    lowering the barrier to engagement
 * 
 * 2. **Feature Demonstration**: Shows real-time voting, progress bars, and
 *    result visualization in action
 * 
 * 3. **Trust Building**: Demonstrates the platform's reliability and
 *    user-friendly interface
 * 
 * 4. **Conversion Optimization**: Interactive experience increases likelihood
 *    of user registration and engagement
 * 
 * ## Key Assumptions
 * 
 * - **User Behavior**: Assumes users will interact with demos before
 *   committing to registration
 * - **Data Persistence**: Demo votes are not persisted (local state only)
 * - **Browser Capabilities**: Assumes modern browser support for animations
 * - **User Intent**: Assumes visitors are evaluating the platform's value
 * 
 * ## Edge Cases Handled
 * 
 * - **Multiple Polls**: Users can switch between different demo polls
 * - **Vote Reset**: "Vote Again" functionality resets the demo state
 * - **State Management**: Proper cleanup when switching between polls
 * - **Visual Feedback**: Clear indication of selected options and results
 * 
 * ## Integration Points
 * 
 * - **Home Page**: Embedded in the main landing page for maximum visibility
 * - **UI Components**: Uses consistent design system components
 * - **State Management**: Manages local voting state independently
 * - **User Journey**: Bridges the gap between discovery and registration
 * 
 * @component
 * @example
 * ```tsx
 * // Embed in home page to provide interactive experience
 * <InteractiveDemo />
 * ```
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Zap } from 'lucide-react';

const demoPolls = [
  {
    id: 'demo-1',
    title: 'What\'s your favorite programming language?',
    description: 'Help us understand the community preferences',
    options: [
      { id: 'opt-1', text: 'JavaScript/TypeScript', votes: 45 },
      { id: 'opt-2', text: 'Python', votes: 38 },
      { id: 'opt-3', text: 'Java', votes: 22 },
      { id: 'opt-4', text: 'Go', votes: 15 },
    ],
    totalVotes: 120,
    createdBy: 'ALX Community',
    isPublic: true,
    hasEnded: false,
  },
  {
    id: 'demo-2',
    title: 'Best time to schedule our next meeting?',
    description: 'Choose the most convenient time for everyone',
    options: [
      { id: 'opt-5', text: 'Monday 2 PM', votes: 8 },
      { id: 'opt-6', text: 'Wednesday 10 AM', votes: 12 },
      { id: 'opt-7', text: 'Friday 3 PM', votes: 6 },
    ],
    totalVotes: 26,
    createdBy: 'Team Lead',
    isPublic: false,
    hasEnded: false,
  }
];

export function InteractiveDemo() {
  const [selectedPoll, setSelectedPoll] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState(demoPolls[selectedPoll].options.map(opt => opt.votes));

  const currentPoll = demoPolls[selectedPoll];
  const totalVotes = localVotes.reduce((sum, votes) => sum + votes, 0);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    
    setSelectedOption(optionId);
    setHasVoted(true);
    
    // Simulate vote by updating local state
    const newVotes = localVotes.map((votes, index) => {
      if (currentPoll.options[index].id === optionId) {
        return votes + 1;
      }
      return votes;
    });
    setLocalVotes(newVotes);
  };

  const switchPoll = (index: number) => {
    setSelectedPoll(index);
    setHasVoted(false);
    setSelectedOption(null);
    setLocalVotes(demoPolls[index].options.map(opt => opt.votes));
  };

  const resetDemo = () => {
    setHasVoted(false);
    setSelectedOption(null);
    setLocalVotes(demoPolls[selectedPoll].options.map(opt => opt.votes));
  };

  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Try It Out!</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the power of ALX Poll with these interactive demos
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Poll Selector */}
          <div className="flex justify-center gap-4 mb-8">
            {demoPolls.map((poll, index) => (
              <Button
                key={poll.id}
                variant={selectedPoll === index ? 'default' : 'outline'}
                onClick={() => switchPoll(index)}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Demo {index + 1}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Poll Display */}
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{currentPoll.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {currentPoll.description}
                    </CardDescription>
                  </div>
                  <Badge variant={currentPoll.isPublic ? 'default' : 'secondary'}>
                    {currentPoll.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  by {currentPoll.createdBy}
                </div>
              </CardHeader>

              <CardContent>
                {hasVoted ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-green-600 font-medium mb-4">✓ Vote submitted!</p>
                    </div>
                    <div className="space-y-3">
                      {currentPoll.options.map((option, index) => {
                        const percentage = totalVotes > 0 ? (localVotes[index] / totalVotes) * 100 : 0;
                        const isSelected = selectedOption === option.id;
                        return (
                          <div key={option.id} className="space-y-2">
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
                              className={`h-3 ${isSelected ? 'bg-green-100' : ''}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={resetDemo}>
                        Vote Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentPoll.options.map((option, index) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={() => handleVote(option.id)}
                      >
                        <div className="flex items-center w-full">
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-4 flex-shrink-0" />
                          <span className="text-left font-medium">{option.text}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{totalVotes} total votes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Live results</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Highlight */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Real-time Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Watch as results update instantly when you vote. See the progress bars 
                    and percentages change in real-time!
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Community Driven
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Join thousands of users creating engaging polls. From public discussions 
                    to private team decisions, ALX Poll has you covered.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Data Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get detailed analytics and insights from your polls. Make data-driven 
                    decisions with comprehensive voting statistics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
