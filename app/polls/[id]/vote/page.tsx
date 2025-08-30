'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import ProtectedRoute from '@/components/protected-route';

// Define the form schema using zod
const voteFormSchema = z.object({
  optionId: z.string({
    required_error: "You must select an option to vote",
  }),
});

type VoteFormValues = z.infer<typeof voteFormSchema>;

type Poll = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  end_date: string | null;
  options: {
    id: string;
    text: string;
    votes_count?: number;
  }[];
};

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const supabase = createClientComponentClient();
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<VoteFormValues>({
    resolver: zodResolver(voteFormSchema),
    defaultValues: {
      optionId: "",
    },
  });

  // Fetch poll data
  useEffect(() => {
    async function fetchPoll() {
      if (!params.id) return;
      
      try {
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

        if (pollError) throw pollError;
        
        // Check if user has already voted
        if (user) {
          const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('id')
            .eq('poll_id', params.id)
            .eq('user_id', user.id)
            .single();
          
          if (!voteError) {
            setHasVoted(true);
            // Redirect to results page if already voted
            router.push(`/polls/${params.id}/results`);
          }
        }

        setPoll(pollData as Poll);
      } catch (error) {
        console.error('Error fetching poll:', error);
        toast({
          title: "Error",
          description: "Failed to load poll data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPoll();
  }, [params.id, supabase, user, router]);

  // Handle form submission
  async function onSubmit(values: VoteFormValues) {
    if (!user || !poll) return;
    
    setSubmitting(true);
    
    try {
      // Insert vote into database
      const { error } = await supabase
        .from('votes')
        .insert({
          poll_id: poll.id,
          option_id: values.optionId,
          user_id: user.id,
        });

      if (error) throw error;
      
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded successfully.",
      });
      
      // Redirect to results page
      router.push(`/polls/${poll.id}/results`);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if poll not found
  if (!poll) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Poll Not Found</CardTitle>
          <CardDescription>The poll you're looking for doesn't exist or has been removed.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/polls')}>Back to Polls</Button>
        </CardFooter>
      </Card>
    );
  }

  // Check if poll has ended
  const isPollEnded = poll.end_date && new Date(poll.end_date) < new Date();

  return (
    <ProtectedRoute>
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>{poll.title}</CardTitle>
          {poll.description && (
            <CardDescription>{poll.description}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          {isPollEnded ? (
            <div className="text-center py-6">
              <p className="text-lg font-medium mb-4">This poll has ended</p>
              <Button onClick={() => router.push(`/polls/${poll.id}/results`)}>View Results</Button>
            </div>
          ) : hasVoted ? (
            <div className="text-center py-6">
              <p className="text-lg font-medium mb-4">You have already voted in this poll</p>
              <Button onClick={() => router.push(`/polls/${poll.id}/results`)}>View Results</Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="optionId"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select an option</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          {poll.options.map((option) => (
                            <FormItem
                              key={option.id}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={option.id} />
                              </FormControl>
                              <FormLabel className="font-normal">
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
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Vote"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/polls')}>Back to Polls</Button>
          <Button variant="outline" onClick={() => router.push(`/polls/${poll.id}/results`)}>View Results</Button>
        </CardFooter>
      </Card>
    </ProtectedRoute>
  );
}