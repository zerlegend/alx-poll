-- Create tables for ALX Poll application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table to store user information
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
  -- Ensure users can only vote once per poll
  UNIQUE(poll_id, user_id)
);

-- Create RLS policies

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Polls table policies
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public polls" 
  ON polls FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can view their own polls" 
  ON polls FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create polls" 
  ON polls FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls" 
  ON polls FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls" 
  ON polls FOR DELETE 
  USING (auth.uid() = user_id);

-- Options table policies
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view options for public polls" 
  ON options FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = options.poll_id AND polls.is_public = true
    )
  );

CREATE POLICY "Users can view options for their own polls" 
  ON options FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = options.poll_id AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create options for their own polls" 
  ON options FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = options.poll_id AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update options for their own polls" 
  ON options FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = options.poll_id AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete options for their own polls" 
  ON options FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = options.poll_id AND polls.user_id = auth.uid()
    )
  );

-- Votes table policies
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes for public polls" 
  ON votes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id AND polls.is_public = true
    )
  );

CREATE POLICY "Users can view votes for their own polls" 
  ON votes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own votes" 
  ON votes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can vote on polls" 
  ON votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
  ON votes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create functions for vote counting
CREATE OR REPLACE FUNCTION get_poll_results(poll_id UUID)
RETURNS TABLE (
  option_id UUID,
  option_text TEXT,
  votes_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id AS option_id,
    o.text AS option_text,
    COUNT(v.id) AS votes_count
  FROM options o
  LEFT JOIN votes v ON o.id = v.option_id
  WHERE o.poll_id = get_poll_results.poll_id
  GROUP BY o.id, o.text
  ORDER BY votes_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create trigger to create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();