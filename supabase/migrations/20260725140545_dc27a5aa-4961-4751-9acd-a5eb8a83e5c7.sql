
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ar text,
  title_en text,
  title_ur text,
  excerpt_ar text,
  excerpt_en text,
  excerpt_ur text,
  content_ar text,
  content_en text,
  content_ur text,
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_status_pub_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_slug_idx ON public.blog_posts (slug);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

CREATE POLICY "Authors read own posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins read all posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors insert own posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors update own posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors delete own posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.increment_blog_views(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts
  SET views = views + 1
  WHERE slug = _slug
    AND status = 'published'
    AND (published_at IS NULL OR published_at <= now());
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_views(text) TO anon, authenticated;
