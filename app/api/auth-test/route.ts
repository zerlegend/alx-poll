import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Test endpoint to check authentication status
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.startsWith('sb-') || cookie.name.includes('supabase')
    );
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        emailConfirmed: session.user.email_confirmed_at
      } : null,
      cookies: {
        total: allCookies.length,
        supabase: supabaseCookies.map(c => c.name),
        all: allCookies.map(c => c.name)
      },
      session: session ? {
        accessToken: !!session.access_token,
        refreshToken: !!session.refresh_token,
        expiresAt: session.expires_at
      } : null
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({ error: 'Auth test failed' }, { status: 500 });
  }
}
