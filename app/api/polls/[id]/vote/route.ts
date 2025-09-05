import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Types
interface VoteRequest {
  optionId: string;
}

interface VoteResponse {
  success: boolean;
  message: string;
  hasVoted: boolean;
}

// Helper function to create Supabase client
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
            // Ignore cookie setting errors in server components
          }
        },
      },
    }
  );
}

// POST handler for submitting a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<VoteResponse | { error: string }>> {
  try {
    const { id: pollId } = await params;
    const supabase = await createSupabaseClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to vote' }, 
        { status: 401 }
      );
    }

    // Validate poll ID
    if (!pollId || typeof pollId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid poll ID' }, 
        { status: 400 }
      );
    }

    // Parse request body
    const body: VoteRequest = await request.json();
    const { optionId } = body;

    // Validate option ID
    if (!optionId || typeof optionId !== 'string') {
      return NextResponse.json(
        { error: 'Option ID is required' }, 
        { status: 400 }
      );
    }

    // Check if poll exists and is accessible
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id, 
        title, 
        end_date, 
        is_public,
        user_id,
        options(id)
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' }, 
        { status: 404 }
      );
    }

    // Check if poll is accessible to user
    if (!poll.is_public && poll.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Check if poll has ended
    if (poll.end_date && new Date(poll.end_date) < new Date()) {
      return NextResponse.json(
        { error: 'This poll has ended' }, 
        { status: 400 }
      );
    }

    // Validate that the option belongs to this poll
    const optionExists = poll.options.some((option: any) => option.id === optionId);
    if (!optionExists) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' }, 
        { status: 400 }
      );
    }

    // Check if user has already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('id, option_id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if user hasn't voted
      console.error('Error checking existing vote:', voteCheckError);
      return NextResponse.json(
        { error: 'Failed to check voting status' }, 
        { status: 500 }
      );
    }

    if (existingVote) {
      return NextResponse.json(
        { 
          success: false,
          message: 'You have already voted in this poll',
          hasVoted: true,
        }, 
        { status: 400 }
      );
    }

    // Submit the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      });

    if (voteError) {
      console.error('Error submitting vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to submit vote' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vote submitted successfully',
      hasVoted: true,
    });

  } catch (error) {
    console.error('Unexpected error in vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// GET handler for checking if user has voted
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ hasVoted: boolean; optionId?: string } | { error: string }>> {
  try {
    const { id: pollId } = await params;
    const supabase = await createSupabaseClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Validate poll ID
    if (!pollId || typeof pollId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid poll ID' }, 
        { status: 400 }
      );
    }

    // Check if user has voted
    const { data: vote, error } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if user hasn't voted
      console.error('Error checking vote status:', error);
      return NextResponse.json(
        { error: 'Failed to check voting status' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasVoted: !!vote,
      optionId: vote?.option_id,
    });

  } catch (error) {
    console.error('Unexpected error in vote status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
