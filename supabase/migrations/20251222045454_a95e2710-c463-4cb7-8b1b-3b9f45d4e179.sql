-- Create blog_comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments on published posts
CREATE POLICY "Anyone can view comments on published posts"
ON public.blog_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE blog_posts.id = blog_comments.post_id
    AND blog_posts.published = true
  )
);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.blog_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.blog_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.blog_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all comments
CREATE POLICY "Admins can manage comments"
ON public.blog_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create blog_comment_likes table for tracking likes
CREATE TABLE public.blog_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Anyone can view likes"
ON public.blog_comment_likes
FOR SELECT
USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create likes"
ON public.blog_comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
ON public.blog_comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_user_id ON public.blog_comments(user_id);
CREATE INDEX idx_blog_comments_parent_id ON public.blog_comments(parent_id);
CREATE INDEX idx_blog_comment_likes_comment_id ON public.blog_comment_likes(comment_id);
CREATE INDEX idx_blog_comment_likes_user_id ON public.blog_comment_likes(user_id);