import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

export const BlogSection = () => {
  const { data: posts } = useQuery({
    queryKey: ['recent-blog-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('shopify_published_at', { ascending: false })
        .limit(4);
      return data || [];
    }
  });

  if (!posts || posts.length === 0) return null;

  const [featuredPost, ...sidePosts] = posts;

  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            Blog & Tin Tức
          </h2>
          <p className="text-muted-foreground">
            Cập nhật những thông tin hữu ích về chăm sóc thú cưng từ Paddy
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          <button className="px-4 py-2 text-sm border rounded-full hover:bg-muted transition-colors">
            Cho Chó
          </button>
          <button className="px-4 py-2 text-sm border rounded-full hover:bg-muted transition-colors">
            Cho Mèo
          </button>
          <button className="px-4 py-2 text-sm border rounded-full hover:bg-muted transition-colors">
            Xem Tất Cả
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Featured Post - Left */}
          {featuredPost && (
            <Link to={`/blog/${featuredPost.handle}`} className="group flex flex-col">
              <div className="flex-1 rounded-xl overflow-hidden mb-4">
                <img
                  src={featuredPost.image_url || '/placeholder.svg'}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div>
                <p className="text-primary text-sm font-medium mb-2">
                  {featuredPost.blog_title || 'Paddy Blog'}
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {featuredPost.title}
                </h3>
                {featuredPost.summary_html && (
                  <p className="text-muted-foreground line-clamp-2" 
                     dangerouslySetInnerHTML={{ __html: featuredPost.summary_html }} 
                  />
                )}
              </div>
            </Link>
          )}

          {/* Side Posts - Right */}
          <div className="flex flex-col justify-between gap-4">
            {sidePosts.map((post) => (
              <Link 
                key={post.id} 
                to={`/blog/${post.handle}`}
                className="group flex gap-4"
              >
                <div className="w-40 h-32 md:w-52 md:h-36 flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={post.image_url || '/placeholder.svg'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-primary text-xs font-medium mb-1">
                    {post.blog_title || 'Paddy Blog'}
                  </p>
                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {post.title}
                  </h4>
                  {post.summary_html && (
                    <p className="text-sm text-muted-foreground line-clamp-2"
                       dangerouslySetInnerHTML={{ __html: post.summary_html }} 
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* See More Link */}
        <div className="text-center mt-10">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Xem thêm bài viết
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
