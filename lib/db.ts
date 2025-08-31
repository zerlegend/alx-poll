import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Initialize the Supabase client with types
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Poll-related functions
export async function fetchPolls({
  page = 1,
  limit = 10,
  sort = 'newest',
  userId,
}: {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'popular' | 'ending';
  userId?: string;
}) {
  try {
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

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
      `, { count: 'exact' });

    // Filter by public polls or user's polls if authenticated
    if (userId) {
      query = query.or(`is_public.eq.true,profiles.id.eq.${userId}`);
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
    query = query.range(from, to);

    // Execute the query
    const { data: polls, error, count } = await query;

    if (error) throw error;

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

    return {
      polls: formattedPolls,
      page,
      limit,
      total: count || 0,
      hasMore: count ? count > (page * limit) : false
    };
  } catch (error) {
    console.error('Error fetching polls:', error);
    throw error;
  }
}

export async function fetchPollById(pollId: string, userId?: string) {
  try {
    // Get the poll with its options
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        id, 
        title, 
        description, 
        created_at,
        end_date,
        is_public,
        profiles!inner(id, name),
        options(id, text)
      `)
      .eq('id', pollId)
      .single();

    if (error) throw error;

    // Check if the user has already voted
    let userVote = null;
    if (userId) {
      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .select('id, option_id')
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .single();

      if (!voteError) {
        userVote = vote;
      }
    }

    // Get poll results
    const { data: results, error: resultsError } = await supabase
      .rpc('get_poll_results', { poll_id: pollId });

    if (resultsError) throw resultsError;

    // Format the poll data
    const formattedPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      createdAt: poll.created_at,
      endDate: poll.end_date,
      isPublic: poll.is_public,
      createdBy: {
        id: poll.profiles.id,
        name: poll.profiles.name,
      },
      options: poll.options.map(option => {
        const resultData = results.find(r => r.option_id === option.id);
        return {
          id: option.id,
          text: option.text,
          votesCount: resultData ? resultData.votes_count : 0,
        };
      }),
      userVote: userVote ? userVote.option_id : null,
      totalVotes: results.reduce((sum, result) => sum + Number(result.votes_count), 0),
      isEnded: poll.end_date ? new Date(poll.end_date) < new Date() : false,
    };

    return formattedPoll;
  } catch (error) {
    console.error('Error fetching poll:', error);
    throw error;
  }
}

export async function createPoll({
  title,
  description,
  options,
  userId,
  endDate,
  isPublic = true,
}: {
  title: string;
  description?: string;
  options: string[];
  userId: string;
  endDate?: Date;
  isPublic?: boolean;
}) {
  try {
    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        user_id: userId,
        end_date: endDate?.toISOString() || null,
        is_public: isPublic,
      })
      .select('id')
      .single();

    if (pollError) throw pollError;

    // Create the options
    const optionsToInsert = options.map(text => ({
      poll_id: poll.id,
      text,
    }));

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsToInsert);

    if (optionsError) throw optionsError;

    return { pollId: poll.id };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
}

export async function submitVote({
  pollId,
  optionId,
  userId,
}: {
  pollId: string;
  optionId: string;
  userId: string;
}) {
  try {
    // Check if user has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    // If user has already voted, return an error
    if (!checkError && existingVote) {
      throw new Error('You have already voted in this poll');
    }

    // Submit the vote
    const { error } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
}