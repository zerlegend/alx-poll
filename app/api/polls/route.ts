import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Types
interface PollQueryParams {
  sort: 'newest' | 'popular' | 'ending';
  limit: number;
  page: number;
}

interface PollResponse {
  polls: any[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
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

// Helper function to parse query parameters
function parseQueryParams(request: NextRequest): PollQueryParams {
  const searchParams = request.nextUrl.searchParams;
  
  return {
    sort: (searchParams.get('sort') as PollQueryParams['sort']) || 'newest',
    limit: Math.min(parseInt(searchParams.get('limit') || '10'), 50), // Max 50 items
    page: Math.max(parseInt(searchParams.get('page') || '1'), 1), // Min page 1
  };
}

// Helper function to build poll query
function buildPollQuery(supabase: any, user: any, params: PollQueryParams) {
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

  // Apply visibility filter
  if (user) {
    query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
  } else {
    query = query.eq('is_public', true);
  }

  // Apply sorting
  switch (params.sort) {
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
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;
  query = query.range(from, to);

  return query;
}

// Helper function to format poll data
function formatPollData(polls: any[]) {
  return polls.map(poll => ({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    createdAt: poll.created_at,
    endDate: poll.end_date,
    isPublic: poll.is_public,
    createdBy: poll.profiles[0]?.name || 'Unknown',
    optionsCount: poll.options.length,
    votesCount: poll.votes.length,
  }));
}

// GET handler for fetching polls
export async function GET(request: NextRequest): Promise<NextResponse<PollResponse | { error: string }>> {
  try {
    const supabase = await createSupabaseClient();
    const params = parseQueryParams(request);
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Build and execute query
    const query = buildPollQuery(supabase, user, params);
    const { data: polls, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' }, 
        { status: 500 }
      );
    }

    // Format response data
    const formattedPolls = formatPollData(polls || []);
    const total = count || 0;
    const hasMore = total > (params.page * params.limit);

    return NextResponse.json({
      polls: formattedPolls,
      page: params.page,
      limit: params.limit,
      total,
      hasMore,
    });

  } catch (error) {
    console.error('Unexpected error in polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST handler for creating a new poll
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; pollId?: string } | { error: string }>> {
  try {
    const supabase = await createSupabaseClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { title, description, options, endDate, isPublic } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Poll title is required' }, 
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' }, 
        { status: 400 }
      );
    }

    if (options.some((option: any) => !option || typeof option !== 'string' || option.trim().length === 0)) {
      return NextResponse.json(
        { error: 'All options must be non-empty strings' }, 
        { status: 400 }
      );
    }

    // Validate end date if provided
    if (endDate && new Date(endDate) <= new Date()) {
      return NextResponse.json(
        { error: 'End date must be in the future' }, 
        { status: 400 }
      );
    }

    // Start transaction
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        user_id: user.id,
        end_date: endDate || null,
        is_public: isPublic !== undefined ? isPublic : true,
      })
      .select('id')
      .single();

    if (pollError) {
      console.error('Error creating poll:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll' }, 
        { status: 500 }
      );
    }

    // Insert poll options
    const optionsToInsert = options.map((option: string) => ({
      poll_id: poll.id,
      text: option.trim(),
    }));

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsToInsert);

    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      
      // Cleanup: delete the poll if options creation failed
      await supabase.from('polls').delete().eq('id', poll.id);
      
      return NextResponse.json(
        { error: 'Failed to create poll options' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        pollId: poll.id 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in create poll API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}