-- Increment blog view count function
CREATE OR REPLACE FUNCTION increment_blog_view(p_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_blog_view TO authenticated;
GRANT EXECUTE ON FUNCTION increment_blog_view TO anon;