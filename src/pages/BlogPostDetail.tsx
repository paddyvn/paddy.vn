import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Calendar, MessageCircle, User } from "lucide-react";
import { Helmet } from "react-helmet-async";

const BlogPostDetail = () => {
  const { handle } = useParams<{ handle: string }>();

  // Fetch current post
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["blog-post", handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("handle", handle)
        .eq("published", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });

  // Fetch recent posts for sidebar
  const { data: recentPosts } = useQuery({
    queryKey: ["recent-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, handle, image_url, shopify_published_at, updated_at")
        .eq("published", true)
        .order("shopify_published_at", { ascending: false, nullsFirst: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  const canonicalUrl = `/blogs/${handle}`;

  if (postLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-1/4">
              <Skeleton className="h-8 w-32 mb-4" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <Skeleton className="w-20 h-16 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </aside>
            <article className="lg:w-3/4">
              <Skeleton className="h-6 w-64 mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-64 w-full mb-6 rounded-lg" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </article>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Bài viết không tồn tại</h1>
          <p className="text-muted-foreground mb-6">
            Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Link to="/blogs" className="text-primary hover:underline">
            ← Quay lại Paddy's Magazine
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{post.title} | Paddy's Magazine</title>
        {post.summary_html && (
          <meta
            name="description"
            content={post.summary_html.replace(/<[^>]*>/g, "").slice(0, 160)}
          />
        )}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <Header />

      {/* Breadcrumb - Below header/announcement bar */}
      <div className="container mx-auto px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Trang Chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/blogs">Paddy's Magazine</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[300px]">
                {post.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Recent Articles */}
          <aside className="lg:w-1/4 order-2 lg:order-1">
            <div className="sticky top-4">
              <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-primary">
                SỰ KIỆN MỚI
              </h3>
              <div className="space-y-4">
                {recentPosts
                  ?.filter((p) => p.id !== post.id)
                  .slice(0, 4)
                  .map((recentPost) => (
                    <Link
                      key={recentPost.id}
                      to={`/blogs/${recentPost.handle}`}
                      className="flex gap-3 group"
                    >
                      {recentPost.image_url && (
                        <img
                          src={recentPost.image_url}
                          alt={recentPost.title}
                          className="w-20 h-16 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {recentPost.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(
                            recentPost.shopify_published_at ||
                              recentPost.updated_at
                          )}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <article className="lg:w-3/4 order-1 lg:order-2">

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              {post.author && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.shopify_published_at || post.updated_at)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />0 Bình Luận
              </span>
            </div>

            {/* Featured Image */}
            {post.image_url && (
              <div className="mb-8">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full rounded-lg object-cover max-h-[500px]"
                />
              </div>
            )}

            {/* Article Body */}
            <div
              className="prose prose-lg max-w-none 
                prose-headings:text-foreground 
                prose-p:text-foreground/90
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-lg
                prose-strong:text-foreground
                prose-ul:text-foreground/90
                prose-ol:text-foreground/90
                prose-li:marker:text-primary"
              dangerouslySetInnerHTML={{ __html: post.body_html || "" }}
            />

            {/* Tags */}
            {post.tags && (
              <div className="mt-8 pt-6 border-t">
                <span className="text-sm font-medium text-muted-foreground">
                  Tags:{" "}
                </span>
                <div className="inline-flex flex-wrap gap-2 mt-2">
                  {post.tags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostDetail;
