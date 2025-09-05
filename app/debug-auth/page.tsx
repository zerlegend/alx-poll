'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugAuthPage() {
  const { user, session, isLoading } = useAuth();
  const [apiAuthStatus, setApiAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApiAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth-test');
      const data = await response.json();
      setApiAuthStatus(data);
    } catch (error) {
      console.error('Error testing API auth:', error);
      setApiAuthStatus({ error: 'Failed to test API auth' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApiAuth();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>
            Debug authentication status across client and server
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Client-side Auth Status */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Client-side Authentication</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Loading State:</span>
                  <Badge variant={isLoading ? 'default' : 'secondary'}>
                    {isLoading ? 'Loading' : 'Loaded'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">User Authenticated:</span>
                  <Badge variant={user ? 'default' : 'destructive'}>
                    {user ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {user && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">User ID:</span>
                      <span className="text-sm font-mono">{user.id}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Email:</span>
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Email Confirmed:</span>
                      <Badge variant={user.email_confirmed_at ? 'default' : 'destructive'}>
                        {user.email_confirmed_at ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Session Active:</span>
                  <Badge variant={session ? 'default' : 'destructive'}>
                    {session ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {session && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Access Token:</span>
                      <Badge variant={session.access_token ? 'default' : 'destructive'}>
                        {session.access_token ? 'Present' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Refresh Token:</span>
                      <Badge variant={session.refresh_token ? 'default' : 'destructive'}>
                        {session.refresh_token ? 'Present' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Expires At:</span>
                      <span className="text-sm">
                        {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Server-side Auth Status */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Server-side Authentication</h3>
            <div className="p-4 border rounded-lg">
              {loading ? (
                <p>Testing API authentication...</p>
              ) : apiAuthStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">API Authenticated:</span>
                    <Badge variant={apiAuthStatus.authenticated ? 'default' : 'destructive'}>
                      {apiAuthStatus.authenticated ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Cookies:</span>
                    <span>{apiAuthStatus.cookies?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Supabase Cookies:</span>
                    <span>{apiAuthStatus.cookies?.supabase?.length || 0}</span>
                  </div>
                  {apiAuthStatus.user && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">API User ID:</span>
                        <span className="text-sm font-mono">{apiAuthStatus.user.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">API User Email:</span>
                        <span className="text-sm">{apiAuthStatus.user.email}</span>
                      </div>
                    </>
                  )}
                  {apiAuthStatus.error && (
                    <div className="p-2 bg-red-100 text-red-800 rounded text-sm">
                      Error: {apiAuthStatus.error}
                    </div>
                  )}
                </div>
              ) : (
                <p>No API auth data available</p>
              )}
              <Button 
                onClick={testApiAuth} 
                variant="outline" 
                className="mt-3"
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Test API Auth'}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/auth/login'}>
              Go to Login
            </Button>
            <Button onClick={() => window.location.href = '/polls'}>
              Go to Polls
            </Button>
            <Button onClick={() => window.location.href = '/polls/create'}>
              Go to Create Poll
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
