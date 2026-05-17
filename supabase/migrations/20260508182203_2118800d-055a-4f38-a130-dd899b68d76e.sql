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

CREATE POLICY "Approved community recipes are viewable by everyone"
ON public.community_recipes
FOR SELECT
USING (moderation_status = 'approved');

CREATE POLICY "Users can create their own community recipes"
ON public.community_recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community recipes"
ON public.community_recipes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community recipes"
ON public.community_recipes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS community_recipes_created_at_idx
ON public.community_recipes (created_at DESC);

CREATE INDEX IF NOT EXISTS community_recipes_title_idx
ON public.community_recipes (title);

CREATE TRIGGER handle_community_recipes_updated_at
BEFORE UPDATE ON public.community_recipes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community media is publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "Users can upload their community media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own community media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'community-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own community media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);