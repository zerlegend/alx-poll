'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const { signIn, user, resendConfirmationEmail } = useAuth();
  
  useEffect(() => {
    // Redirect if user is already logged in
    if (user) {
      router.push('/polls');
    }
    
    // Check if redirected from registration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      if (urlParams.get('confirmation') === 'required') {
        setSuccessMessage('Registration successful! Please check your email to confirm your account before logging in.');
      } else {
        setSuccessMessage('Registration successful! Please log in with your new account.');
      }
    }
  }, [user, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(values.email, values.password);
      
      if (error) {
        // Handle specific error for email not confirmed
        if (error.message.includes('Email not confirmed')) {
          setError('Your email address has not been confirmed. Please check your inbox and click the confirmation link before logging in.');
          setUnconfirmedEmail(values.email);
        } else {
          setError(error.message);
          setUnconfirmedEmail(null);
        }
        setIsLoading(false);
        return;
      }
      
      // Successful login will trigger the useEffect to redirect
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
              {unconfirmedEmail && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      setResendLoading(true);
                      try {
                        const { error } = await resendConfirmationEmail(unconfirmedEmail);
                        if (error) {
                          setError(`Failed to resend confirmation email: ${error.message}`);
                        } else {
                          setSuccessMessage('Confirmation email has been resent. Please check your inbox.');
                          setError(null);
                        }
                      } catch (err) {
                        setError('An unexpected error occurred while resending the confirmation email.');
                      } finally {
                        setResendLoading(false);
                      }
                    }}
                    disabled={resendLoading}
                  >
                    {resendLoading ? 'Sending...' : 'Resend confirmation email'}
                  </Button>
                </div>
              )}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md mb-4">
              {successMessage}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}