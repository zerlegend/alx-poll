# ALX Poll Database Setup Instructions

## Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `grvekkdcelnblgatfkqs`

## Step 2: Open SQL Editor
1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click "New query" to create a new SQL query

## Step 3: Copy and Paste the Schema
Copy the entire contents of `supabase/schema.sql` and paste it into the SQL editor.

## Step 4: Execute the Schema
1. Click the "Run" button (or press Ctrl+Enter)
2. Wait for all statements to execute successfully

## Step 5: Verify Tables Created
After running the schema, you should see these tables in your database:
- `profiles`
- `polls` 
- `options`
- `votes`

## Step 6: Test the Application
Once the schema is applied, your ALX Poll application should work correctly.

## Alternative: Manual Table Creation
If you prefer to create tables manually, here are the essential tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(poll_id, user_id)
);
```
