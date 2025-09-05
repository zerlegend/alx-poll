'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  options: z.array(
    z.object({
      text: z.string().min(1, { message: 'Option cannot be empty.' }),
    })
  ).min(2, {
    message: 'You need at least 2 options.',
  }),
  endDate: z.string().optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePollPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug authentication state
  console.log('Auth state:', { user: !!user, isLoading, userEmail: user?.email });
  
  // Additional debugging
  useEffect(() => {
    console.log('Create poll page - Auth state changed:', { 
      user: !!user, 
      isLoading, 
      userEmail: user?.email,
      userId: user?.id 
    });
  }, [user, isLoading]);

  // Test authentication status
  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth-test');
      const data = await response.json();
      console.log('Auth test result:', data);
      alert(`Auth Status: ${data.authenticated ? 'Authenticated' : 'Not authenticated'}\nUser: ${data.user?.email || 'None'}`);
    } catch (error) {
      console.error('Auth test failed:', error);
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      options: [{ text: '' }, { text: '' }],
      endDate: '',
      isPublic: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  async function onSubmit(values: FormValues) {
    // Check authentication status
    if (!user) {
      setError('Please log in to create polls');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting poll:', {
        title: values.title,
        description: values.description,
        options: values.options.map(option => option.text),
        endDate: values.endDate || null,
        isPublic: values.isPublic,
      });

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          options: values.options.map(option => option.text),
          endDate: values.endDate || null,
          isPublic: values.isPublic,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        
        if (response.status === 401) {
          throw new Error('Please log in to create polls');
        }
        throw new Error(errorData.error || 'Failed to create poll');
      }

      const result = await response.json();
      console.log('Success result:', result);
      setError(null); // Clear any previous errors
      router.push(`/polls/${result.pollId}`);
    } catch (error) {
      console.error('Error creating poll:', error);
      setError(error instanceof Error ? error.message : 'Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        ← Back to Polls
      </Button>
      
      {isLoading ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      ) : !user ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to create polls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Please log in or create an account to create polls.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => router.push('/auth/login')}>
                Login
              </Button>
              <Button variant="outline" onClick={() => router.push('/auth/register')}>
                Register
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Poll</CardTitle>
          <CardDescription>
            Fill out the form below to create a new poll
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div className="mb-6 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Logged in as: {user?.email}
            </p>
            <Button variant="outline" size="sm" onClick={testAuth}>
              Test Auth
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poll Title</FormLabel>
                    <FormControl>
                      <Input placeholder="What is your favorite...?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Provide more details about your poll" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        placeholder="When should this poll end?"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Make this poll public</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Public polls can be viewed and voted on by anyone
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Poll Options</FormLabel>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`options.${index}.text`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder={`Option ${index + 1}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {index > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => remove(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => append({ text: '' })}
                >
                  Add Option
                </Button>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}