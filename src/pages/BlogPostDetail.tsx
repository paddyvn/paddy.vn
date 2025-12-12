import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Calendar, 
  Clock, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link2, 
  Heart, 
  MessageCircle,
  Mail,
  ChevronRight,
  ThumbsUp,
  Reply
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

const BlogPostDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [likedArticle, setLikedArticle] = useState(false);
  const [likeCount, setLikeCount] = useState(12);
  const [activeHeading, setActiveHeading] = useState<string>("");

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

  // Fetch recent/trending posts for sidebar
  const { data: trendingPosts } = useQuery({
    queryKey: ["trending-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, handle, image_url, shopify_published_at, updated_at")
        .eq("published", true)
        .order("shopify_published_at", { ascending: false, nullsFirst: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  // Fetch related posts for "Read Next" section
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-blog-posts", post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, handle, image_url, shopify_published_at, updated_at, tags, summary_html")
        .eq("published", true)
        .neq("id", post?.id || "")
        .order("shopify_published_at", { ascending: false, nullsFirst: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!post?.id,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "MMM dd, yyyy", { locale: vi });
  };

  const estimateReadTime = (html: string | null) => {
    if (!html) return "3 phút";
    const text = html.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} phút`;
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Đăng ký thành công!");
      setEmail("");
    }
  };

  const handleLike = () => {
    setLikedArticle(!likedArticle);
    setLikeCount(prev => likedArticle ? prev - 1 : prev + 1);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast.success("Đã sao chép link!");
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  // Extract headings from HTML for Table of Contents
  const tableOfContents = useMemo<TOCItem[]>(() => {
    if (!post?.body_html) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.body_html, 'text/html');
    const headings = doc.querySelectorAll('h2');
    
    return Array.from(headings).map((heading, index) => {
      const id = `heading-${index}`;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      return { id, text, level };
    });
  }, [post?.body_html]);

  // Add IDs to headings in the rendered content and track active heading
  useEffect(() => {
    if (!post?.body_html) return;
    
    const articleElement = document.querySelector('.article-content');
    if (!articleElement) return;

    const headings = articleElement.querySelectorAll('h2');
    headings.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });

    // Intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [post?.body_html]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const canonicalUrl = `/blogs/${handle}`;

  if (postLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-64 mb-4 mx-auto" />
          <Skeleton className="h-12 w-3/4 mb-6 mx-auto" />
          <Skeleton className="h-[400px] w-full mb-8 rounded-2xl" />
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
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

  const tags = post.tags?.split(",").map(t => t.trim()).filter(Boolean) || [];
  const categoryTag = tags[0] || "Chăm Sóc Thú Cưng";

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

      {/* Breadcrumb */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb>
            <BreadcrumbList className="text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-muted-foreground hover:text-primary">Trang Chủ</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/blogs" className="text-muted-foreground hover:text-primary">Paddy's Magazine</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1 max-w-[300px] text-primary">
                  {post.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Article Header - Centered */}
      <div className="bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          {/* Category Badge */}
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 uppercase text-xs tracking-wider font-semibold">
            {categoryTag}
          </Badge>

          {/* Title */}
          <h1 className="text-[1.375rem] md:text-3xl lg:text-4xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            {post.title}
          </h1>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {post.author?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold text-foreground">{post.author || "Paddy Team"}</p>
                <p className="text-xs">Biên tập viên</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Đăng ngày</span>
              <span className="font-medium text-foreground">{formatDate(post.shopify_published_at || post.updated_at)}</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Thời gian đọc</span>
              <span className="font-medium text-foreground">{estimateReadTime(post.body_html)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image - Aligned with article title width */}
      {post.image_url && (
        <div className="container mx-auto px-4 -mt-2 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-[16/9] overflow-hidden rounded-2xl">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Table of Contents & Share */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <div className="bg-card border rounded-xl p-4 mb-8">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Mục lục
                  </h4>
                  <nav>
                    <ul className="space-y-2">
                      <li>
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className={`text-sm text-left w-full transition-colors hover:text-primary ${
                            activeHeading === '' ? 'text-primary font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          Giới thiệu
                        </button>
                      </li>
                      {tableOfContents.map((item, index) => (
                        <li key={item.id} className={item.level === 3 ? 'pl-4' : ''}>
                          <button
                            onClick={() => scrollToHeading(item.id)}
                            className={`text-sm text-left w-full transition-colors hover:text-primary line-clamp-2 ${
                              activeHeading === item.id ? 'text-primary font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            {item.level === 2 && `${index + 1}. `}{item.text}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={() => {
                            const commentsSection = document.querySelector('.comments-section');
                            if (commentsSection) {
                              const y = commentsSection.getBoundingClientRect().top + window.pageYOffset - 100;
                              window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                          }}
                          className="text-sm text-left w-full transition-colors hover:text-primary text-muted-foreground"
                        >
                          Bình luận
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}

              {/* Share Section */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Chia sẻ
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare("facebook")}
                    className="p-2.5 rounded-full border hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                  >
                    <Facebook className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShare("twitter")}
                    className="p-2.5 rounded-full border hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                  >
                    <Twitter className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="p-2.5 rounded-full border hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                  >
                    <Linkedin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleLike}
                    className={`p-2.5 rounded-full transition-colors ${likedArticle ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted text-muted-foreground hover:text-primary'}`}
                  >
                    <Heart className={`h-4 w-4 ${likedArticle ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{likeCount.toLocaleString()} lượt thích</p>
              </div>
            </div>
          </aside>

          {/* Article Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Article Body */}
            <div
              className="article-content prose prose-lg max-w-none 
                prose-headings:text-foreground prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-foreground/85 prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:text-foreground/85
                prose-ol:text-foreground/85
                prose-li:marker:text-primary
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-foreground/80"
              dangerouslySetInnerHTML={{ __html: post.body_html || "" }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-10 pt-6 border-t flex flex-wrap items-center gap-2">
                {tags.map((tag, index) => (
                  <Link
                    key={index}
                    to={`/blogs?tag=${encodeURIComponent(tag)}`}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground text-sm rounded-full transition-colors hover:text-primary"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Author Bio */}
            <div className="mt-10 p-6 bg-background rounded-2xl border">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {post.author?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Về tác giả</p>
                  <h3 className="text-lg font-bold mb-2">{post.author || "Paddy Team"}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Với hơn 10 năm kinh nghiệm trong lĩnh vực chăm sóc thú cưng, chúng tôi luôn mong muốn chia sẻ những kiến thức hữu ích nhất đến cộng đồng yêu thú cưng tại Việt Nam.
                  </p>
                  <Link to="/blogs" className="text-primary text-sm font-medium hover:underline mt-3 inline-block">
                    Xem tất cả bài viết →
                  </Link>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-10 comments-section">
              <h3 className="text-xl font-bold mb-6">Bình luận (3)</h3>
              
              {/* Comment Form */}
              <div className="bg-background rounded-2xl border p-6 mb-6">
                <h4 className="font-semibold mb-4">Để lại bình luận</h4>
                <Textarea
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-4 min-h-[100px] resize-none"
                />
                <Button className="bg-primary hover:bg-primary/90">
                  Gửi bình luận
                </Button>
              </div>

              {/* Sample Comments */}
              <div className="space-y-6">
                <div className="bg-background rounded-2xl border p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">M</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Minh Thắng</span>
                        <span className="text-xs text-muted-foreground">2 ngày trước</span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">
                        Bài viết rất hữu ích! Mình đã áp dụng cho bé cún nhà mình và thấy hiệu quả rõ rệt.
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <ThumbsUp className="h-4 w-4" /> Thích
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Reply className="h-4 w-4" /> Trả lời
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-6">
            {/* Newsletter Signup */}
            <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5" />
                <span className="font-semibold">Tham Gia Paddy!</span>
              </div>
              <p className="text-sm opacity-90 mb-4">
                Nhận tips chăm sóc thú cưng và ưu đãi độc quyền mỗi tuần.
              </p>
              <form onSubmit={handleSubscribe}>
                <Input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-3 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                />
                <Button 
                  type="submit"
                  variant="secondary" 
                  className="w-full font-semibold"
                >
                  Đăng ký
                </Button>
              </form>
            </div>

            {/* Trending Posts */}
            <div className="bg-background rounded-2xl border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-lg">🔥</span> Xu Hướng
              </h3>
              <div className="space-y-4">
                {trendingPosts
                  ?.filter((p) => p.id !== post.id)
                  .slice(0, 3)
                  .map((trendingPost) => (
                    <Link
                      key={trendingPost.id}
                      to={`/blogs/${trendingPost.handle}`}
                      className="flex gap-3 group"
                    >
                      {trendingPost.image_url && (
                        <img
                          src={trendingPost.image_url}
                          alt={trendingPost.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {trendingPost.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(trendingPost.shopify_published_at || trendingPost.updated_at)} • {estimateReadTime(null)}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Mobile Share Buttons */}
            <div className="lg:hidden bg-background rounded-2xl border p-4">
              <p className="text-sm font-medium mb-3">Chia sẻ bài viết</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex-1 p-2.5 rounded-lg bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
                >
                  <Facebook className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="flex-1 p-2.5 rounded-lg bg-[#1DA1F2] text-white hover:opacity-90 transition-opacity"
                >
                  <Twitter className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare("linkedin")}
                  className="flex-1 p-2.5 rounded-lg bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
                >
                  <Linkedin className="h-5 w-5 mx-auto" />
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="flex-1 p-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Link2 className="h-5 w-5 mx-auto" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Read Next Section */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="bg-background border-t py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Đọc Tiếp</h2>
              <Link to="/blogs" className="text-primary font-medium hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blogs/${relatedPost.handle}`}
                  className="group"
                >
                  <div className="bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow">
                    {relatedPost.image_url && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={relatedPost.image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {relatedPost.tags && (
                          <Badge variant="secondary" className="text-xs uppercase bg-primary/10 text-primary">
                            {relatedPost.tags.split(",")[0]?.trim()}
                          </Badge>
                        )}
                        <span>•</span>
                        <span>{formatDate(relatedPost.shopify_published_at || relatedPost.updated_at)}</span>
                      </div>
                      <h3 className="font-bold line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.summary_html && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedPost.summary_html.replace(/<[^>]*>/g, "").slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogPostDetail;
