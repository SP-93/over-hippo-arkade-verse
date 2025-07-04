-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  wallet_address TEXT,
  avatar_url TEXT,
  total_chips INTEGER DEFAULT 5,
  over_balance DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_scores table
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('tetris', 'snake', 'pacman')),
  score INTEGER NOT NULL,
  level_reached INTEGER DEFAULT 1,
  time_played INTEGER, -- in seconds
  over_earned DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chip_transactions table
CREATE TABLE public.chip_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'spent', 'earned')),
  chip_amount INTEGER NOT NULL,
  over_amount DECIMAL(18,8),
  game_type TEXT,
  transaction_hash TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('tetris', 'snake', 'pacman')),
  prize_pool DECIMAL(18,8) NOT NULL,
  entry_fee INTEGER NOT NULL, -- in chips
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament_participants table
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  final_score INTEGER,
  rank INTEGER,
  prize_won DECIMAL(18,8) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chip_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for game_scores
CREATE POLICY "Users can view their own scores" 
ON public.game_scores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores" 
ON public.game_scores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public leaderboard access" 
ON public.game_scores FOR SELECT 
USING (true);

-- Create RLS policies for chip_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.chip_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.chip_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tournaments
CREATE POLICY "Anyone can view active tournaments" 
ON public.tournaments FOR SELECT 
USING (true);

-- Create RLS policies for tournament_participants
CREATE POLICY "Users can view tournament participants" 
ON public.tournament_participants FOR SELECT 
USING (true);

CREATE POLICY "Users can join tournaments" 
ON public.tournament_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_game_scores_user_game ON public.game_scores(user_id, game_type);
CREATE INDEX idx_game_scores_leaderboard ON public.game_scores(game_type, score DESC);
CREATE INDEX idx_chip_transactions_user ON public.chip_transactions(user_id, created_at DESC);
CREATE INDEX idx_tournaments_status ON public.tournaments(status, start_time);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, total_chips)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();