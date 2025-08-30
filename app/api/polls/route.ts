import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET handler for fetching polls
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sort = searchParams.get('sort') || 'newest';
  const limit = parseInt(searchParams.get('limit') || '10');
  const page = parseInt(searchParams.get('page') || '1');
  
  // Create a Supabase client for the current request
  const supabase = createRouteHandlerClient({ cookies });
  
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
        votes(id)
      `);
    
    // Filter by public polls or user's polls if authenticated
    if (session?.user) {
      query = query.or(`is_public.eq.true,profiles.id.eq.${session.user.id}`);
    } else {
      query = query.eq('is_public', true);
    }
    
    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('votes', { foreignTable: 'votes', ascending: false });
        break;
      case 'ending':
        query = query.order('end_date', { ascending: true, nullsLast: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    // Execute the query
    const { data: polls, error, count } = await query;
    
    if (error) {
      console.error('Error fetching polls:', error);
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }
    
    // Transform the data for the frontend
    const formattedPolls = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      createdAt: poll.created_at,
      endDate: poll.end_date,
      isPublic: poll.is_public,
      createdBy: poll.profiles.name,
      optionsCount: poll.options.length,
      votesCount: poll.votes.length,
    }));
    
    return NextResponse.json({ 
      polls: formattedPolls,
      page,
      limit,
      total: count,
      hasMore: count > (page * limit)
    });
  } catch (error) {
    console.error('Error in polls API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating a new poll
export async function POST(request: NextRequest) {
  // Create a Supabase client for the current request
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { title, description, options, endDate, isPublic } = await request.json();
    
    // Validate the request
    if (!title || !options || options.length < 2) {
      return NextResponse.json({ 
        error: 'Invalid request. Title and at least 2 options are required.' 
      }, { status: 400 });
    }
    
    // Start a transaction
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        user_id: session.user.id,
        end_date: endDate || null,
        is_public: isPublic !== undefined ? isPublic : true,
      })
      .select('id')
      .single();
    
    if (pollError) {
      console.error('Error creating poll:', pollError);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }
    
    // Insert options
    const optionsToInsert = options.map((option: string) => ({
      poll_id: poll.id,
      text: option,
    }));
    
    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsToInsert);
    
    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      pollId: poll.id 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in create poll API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}