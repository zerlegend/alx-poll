import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Types
interface PollDetails {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  endDate: string | null;
  isPublic: boolean;
  createdBy: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  totalVotes: number;
  hasEnded: boolean;
  userVote?: string; // Option ID that user voted for
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

// Helper function to format poll data
function formatPollDetails(poll: any, userVote?: string): PollDetails {
  const hasEnded = poll.end_date && new Date(poll.end_date) < new Date();
  
  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    createdAt: poll.created_at,
    endDate: poll.end_date,
    isPublic: poll.is_public,
    createdBy: poll.profiles[0]?.name || 'Unknown',
    options: poll.options.map((option: any) => ({
      id: option.id,
      text: option.text,
      votes: poll.votes.filter((vote: any) => vote.option_id === option.id).length,
    })),
    totalVotes: poll.votes.length,
    hasEnded,
    userVote,
  };
}

// GET handler for fetching a specific poll
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PollDetails | { error: string }>> {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();
    
    // Validate poll ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid poll ID' }, 
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch poll with all related data
    const { data: poll, error: pollError } = await supabase
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

    if (pollError) {
      console.error('Error fetching poll:', pollError);
      return NextResponse.json(
        { error: 'Poll not found' }, 
        { status: 404 }
      );
    }

    // Check access permissions
    if (!poll.is_public && (!user || user.id !== poll.profiles[0].id)) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Get user's vote if authenticated
    let userVote: string | undefined;
    if (user) {
      const { data: vote } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', id)
        .eq('user_id', user.id)
        .single();
      
      userVote = vote?.option_id;
    }

    // Format and return poll data
    const formattedPoll = formatPollDetails(poll, userVote);
    return NextResponse.json(formattedPoll);

  } catch (error) {
    console.error('Unexpected error in poll API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT handler for updating a poll (poll owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const { id } = await params;
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
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid poll ID' }, 
        { status: 400 }
      );
    }

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPoll) {
      return NextResponse.json(
        { error: 'Poll not found' }, 
        { status: 404 }
      );
    }

    if (existingPoll.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, endDate, isPublic } = body;

    // Build update object
    const updateData: any = {};
    
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title cannot be empty' }, 
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (endDate !== undefined) {
      if (endDate && new Date(endDate) <= new Date()) {
        return NextResponse.json(
          { error: 'End date must be in the future' }, 
          { status: 400 }
        );
      }
      updateData.end_date = endDate || null;
    }

    if (isPublic !== undefined) {
      updateData.is_public = Boolean(isPublic);
    }

    // Update poll
    const { error: updateError } = await supabase
      .from('polls')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating poll:', updateError);
      return NextResponse.json(
        { error: 'Failed to update poll' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in poll update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a poll (poll owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const { id } = await params;
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
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid poll ID' }, 
        { status: 400 }
      );
    }

    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPoll) {
      return NextResponse.json(
        { error: 'Poll not found' }, 
        { status: 404 }
      );
    }

    if (existingPoll.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Delete poll (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting poll:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete poll' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in poll delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}