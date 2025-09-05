'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ProtectedRoute from '@/components/protected-route';
import { supabase } from '@/lib/supabase';

// Form validation schema
const voteFormSchema = z.object({
  optionId: z.string().min(1, "Please select an option to vote"),
});

type VoteFormValues = z.infer<typeof voteFormSchema>;

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  end_date: string | null;
  options: PollOption[];
}

interface VotePageState {
  poll: Poll | null;
  loading: boolean;
  submitting: boolean;
  hasVoted: boolean;
  error: string | null;
}

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [state, setState] = useState<VotePageState>({
    poll: null,
    loading: true,
    submitting: false,
    hasVoted: false,
    error: null,
  });

  const form = useForm<VoteFormValues>({
    resolver: zodResolver(voteFormSchema),
    defaultValues: { optionId: "" },
  });

  // Fetch poll data and check voting status
  useEffect(() => {
    const fetchPollData = async () => {
      if (!params.id || !user) return;

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Fetch poll with options
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select(`
            id, 
            title, 
            description, 
            created_at,
            end_date,
            options(id, text)
          `)
          .eq('id', params.id)
          .single();

        if (pollError) {
          throw new Error('Poll not found or access denied');
        }

        // Check if user has already voted
        const { data: existingVote } = await supabase
          .from('votes')
          .select('id')
          .eq('poll_id', params.id)
          .eq('user_id', user.id)
          .single();

        setState(prev => ({
          ...prev,
          poll: pollData as Poll,
          hasVoted: !!existingVote,
          loading: false,
        }));

        // Redirect if already voted
        if (existingVote) {
          router.push(`/polls/${params.id}/results`);
        }

      } catch (error) {
        console.error('Error fetching poll:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load poll',
          loading: false,
        }));
      }
    };

    fetchPollData();
  }, [params.id, user, router]);

  // Handle vote submission
  const handleVoteSubmission = async (values: VoteFormValues) => {
    if (!user || !state.poll) return;

    setState(prev => ({ ...prev, submitting: true }));

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          poll_id: state.poll.id,
          option_id: values.optionId,
          user_id: user.id,
        });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Vote submitted successfully!",
        description: "Your vote has been recorded.",
      });

      // Redirect to results
      router.push(`/polls/${state.poll.id}/results`);

    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Vote submission failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, submitting: false }));
    }
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Poll Not Found</CardTitle>
            <CardDescription>
              {state.error || "The poll you're looking for doesn't exist or has been removed."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/polls')}>
              Back to Polls
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isPollEnded = state.poll.end_date && new Date(state.poll.end_date) < new Date();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{state.poll.title}</CardTitle>
            {state.poll.description && (
              <CardDescription className="text-base">
                {state.poll.description}
              </CardDescription>
            )}
            {isPollEnded && (
              <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                This poll ended on {new Date(state.poll.end_date!).toLocaleDateString()}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {isPollEnded ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium mb-4 text-muted-foreground">
                  This poll has ended
                </p>
                <Button onClick={() => router.push(`/polls/${state.poll?.id}/results`)}>
                  View Results
                </Button>
              </div>
            ) : state.hasVoted ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium mb-4 text-green-600">
                  ✓ You have already voted in this poll
                </p>
                <Button onClick={() => router.push(`/polls/${state.poll?.id}/results`)}>
                  View Results
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleVoteSubmission)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="optionId"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-lg font-medium">
                          Select your choice:
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-3"
                          >
                            {state.poll?.options.map((option, index) => (
                              <FormItem
                                key={option.id}
                                className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <FormControl>
                                  <RadioGroupItem value={option.id} />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  <span className="font-medium text-muted-foreground mr-2">
                                    {String.fromCharCode(65 + index)}.
                                  </span>
                                  {option.text}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={state.submitting}
                      className="flex-1"
                    >
                      {state.submitting ? "Submitting..." : "Submit Vote"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/polls')}
            >
              ← Back to Polls
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/polls/${state.poll?.id}/results`)}
            >
              View Results →
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  );
}