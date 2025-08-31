# ALX Poll Supabase Database Schema

This directory contains the SQL schema for the ALX Poll application's Supabase database.

## Schema Overview

The database consists of the following tables:

### 1. profiles

Stores user profile information linked to Supabase Auth users.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 2. polls

Stores poll information created by users.

```sql
CREATE TABLE polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 3. options

Stores the options available for each poll.

```sql
CREATE TABLE options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 4. votes

Stores user votes for poll options with a unique constraint to ensure one vote per user per poll.

```sql
CREATE TABLE votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(poll_id, user_id)
);
```

## Row Level Security (RLS) Policies

The schema includes RLS policies to secure data access:

- **Profiles**: Users can view any profile but only update their own
- **Polls**: Public polls are visible to everyone, while private polls are only visible to their creators
- **Options**: Options are visible based on poll visibility
- **Votes**: Vote data is visible based on poll visibility

## Helper Functions

### get_poll_results

Returns vote counts for each option in a poll.

```sql
CREATE OR REPLACE FUNCTION get_poll_results(poll_id UUID)
RETURNS TABLE (
  option_id UUID,
  option_text TEXT,
  votes_count BIGINT
);
```

### Automatic Profile Creation

A trigger automatically creates a profile when a new user signs up.

## Setup Instructions

### Option 1: Using Supabase UI

1. Log in to your Supabase project
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `schema.sql`
5. Run the query

### Option 2: Using Supabase CLI

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Apply the migration:
   ```bash
   supabase db push
   ```

## Testing the Schema

After setting up the schema, you can test it by:

1. Creating a user through Supabase Auth
2. Verifying that a profile is automatically created
3. Creating a poll with options
4. Submitting votes
5. Querying poll results using the `get_poll_results` function

## Schema Diagram

```
auth.users 1──┐
              │
              │
profiles 1────┘
    │
    │ 1
    ▼
    n
polls 1───────┐
    │         │
    │ 1       │ 1
    ▼         │
    n         │
options 1─────┤
    │         │
    │ 1       │
    ▼         │
    n         │
votes n───────┘
```