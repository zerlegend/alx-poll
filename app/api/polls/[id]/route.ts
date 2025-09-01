import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET handler for fetching a single poll by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    // Check if user is authenticated (for private polls)
    const { data: { session } } = await supabase.auth.getSession();
    
    // Build the query
    let query = supabase
      .from('polls')
      .select(`
        id, 
        title, 
        description, 
        created_at,
        end_date,
        is_public,
        profiles!inner(id, name),
        options(id, text),
        votes(id, option_id)
      `)
      .eq('id', id)
      .single();
    
    // Execute the query
    const { data: poll, error } = await query;
    
    if (error) {
      console.error('Error fetching poll:', error);
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }
    
    // Check if user has access to this poll
    if (!poll.is_public && (!session || session.user.id !== poll.profiles[0].id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Transform the data for the frontend
    const formattedPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      createdAt: poll.created_at,
      endDate: poll.end_date,
      isPublic: poll.is_public,
      createdBy: poll.profiles[0].name,
      options: poll.options.map((option: any) => ({
        id: option.id,
        text: option.text,
        votes: poll.votes.filter((vote: any) => vote.option_id === option.id).length
      })),
      totalVotes: poll.votes.length,
    };
    
    return NextResponse.json(formattedPoll);
  } catch (error) {
    console.error('Error in poll API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
