CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'system',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Homemade',
  category TEXT NOT NULL DEFAULT 'Community',
  thumbnail_url TEXT NOT NULL,
  video_url TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  premade_ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  moderation_status TEXT NOT NULL DEFAULT 'approved',
  moderation_notes TEXT,
  duplicate_recipe_id TEXT,
  duplicate_recipe_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Approved community recipes are viewable by everyone" ON public.community_recipes;
DROP POLICY IF EXISTS "Users can create their own community recipes" ON public.community_recipes;
DROP POLICY IF EXISTS "Users can update their own community recipes" ON public.community_recipes;
DROP POLICY IF EXISTS "Users can delete their own community recipes" ON public.community_recipes;
CREATE POLICY "Approved community recipes are viewable by everyone" ON public.community_recipes FOR SELECT USING (moderation_status = 'approved');
CREATE POLICY "Users can create their own community recipes" ON public.community_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own community recipes" ON public.community_recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own community recipes" ON public.community_recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS community_recipes_created_at_idx ON public.community_recipes (created_at DESC);
CREATE INDEX IF NOT EXISTS community_recipes_title_idx ON public.community_recipes (title);
DROP TRIGGER IF EXISTS handle_community_recipes_updated_at ON public.community_recipes;
CREATE TRIGGER handle_community_recipes_updated_at BEFORE UPDATE ON public.community_recipes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('community-media', 'community-media', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Community media is publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their community media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own community media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own community media" ON storage.objects;
CREATE POLICY "Community media is publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'community-media');
CREATE POLICY "Users can upload their community media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own community media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own community media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);