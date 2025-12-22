-- Create function to increment comment likes
CREATE OR REPLACE FUNCTION public.increment_comment_likes(comment_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_comments
  SET likes_count = likes_count + 1
  WHERE id = comment_id_param;
END;
$$;

-- Create function to decrement comment likes
CREATE OR REPLACE FUNCTION public.decrement_comment_likes(comment_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_comments
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = comment_id_param;
END;
$$;