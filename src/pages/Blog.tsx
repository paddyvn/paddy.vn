import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const POSTS_PER_PAGE = 12;

const Blog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch categories from blog_categories table (Fix 2)
  const { data: blogCategories } = useQuery({
    queryKey: ["blog-categories-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name, name_vi, slug")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Lightweight tags query
  const { data: allTags } = useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("tags")
        .eq("published", true)
        .not("tags", "is", null);
      if (error) throw error;

      const tagSet = new Set<string>();
      data.forEach(post => {
        post.tags?.split(",").forEach((t: string) => {
          const trimmed = t.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      });
      return Array.from(tagSet).sort();
    },
    staleTime: 60000,
  });

  const isFiltering = selectedCategory || selectedTag;

  // Count query
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["blog-posts-count", selectedCategory, selectedTag],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("published", true);

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }
      if (selectedTag) {
        query = query.ilike("tags", `%${selectedTag}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // Data query — only card fields, NOT body_html (Fix 2)
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-public", selectedCategory, selectedTag, currentPage],
    queryFn: async () => {
      // When not filtering, fetch enough for hero layout + first page
      const heroSlots = isFiltering ? 0 : 9;
      const from = isFiltering
        ? (currentPage - 1) * POSTS_PER_PAGE
        : heroSlots + (currentPage - 1) * POSTS_PER_PAGE;
      const to = isFiltering
        ? from + POSTS_PER_PAGE - 1
        : (currentPage === 1 ? heroSlots + POSTS_PER_PAGE - 1 : from + POSTS_PER_PAGE - 1);
      
      // For first page without filter, fetch from 0
      const actualFrom = (!isFiltering && currentPage === 1) ? 0 : from;
      const actualTo = (!isFiltering && currentPage === 1) ? heroSlots + POSTS_PER_PAGE - 1 : to;

      let query = supabase
        .from("blog_posts")
        .select("id, title, handle, summary_html, author, blog_title, tags, image_url, shopify_published_at, updated_at, category_id, blog_categories(slug, name)")
        .eq("published", true)
        .order("shopify_published_at", { ascending: false, nullsFirst: false });

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }
      if (selectedTag) {
        query = query.ilike("tags", `%${selectedTag}%`);
      }

      query = query.range(actualFrom, actualTo);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Split posts into layout sections
  const featuredPost = (!isFiltering && currentPage === 1) ? posts?.[0] : null;
  const secondaryPosts = (!isFiltering && currentPage === 1) ? posts?.slice(1, 4) || [] : [];
  const popularPosts = (!isFiltering && currentPage === 1) ? posts?.slice(4, 9) || [] : [];
  const gridPosts = isFiltering
    ? posts || []
    : (currentPage === 1 ? posts?.slice(9) || [] : posts || []);

  // Pagination
  const gridTotal = isFiltering ? totalCount : Math.max(0, totalCount - 9);
  const totalPages = Math.ceil(gridTotal / POSTS_PER_PAGE);

  const getBlogPostUrl = (post: any) => {
    const catSlug = (post?.blog_categories as { slug: string } | null)?.slug || 'articles';
    return `/blogs/${catSlug}/${post.handle}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd MMM, yyyy", { locale: vi });
  };

  const stripHtml = (html: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").substring(0, 150) + "...";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: document.getElementById("all-posts")?.offsetTop || 0, behavior: "smooth" });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleTagChange = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
          Paddy's Magazine
        </h1>

        {/* Category Filter — from blog_categories table */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(null)}
            className="rounded-full"
          >
            Tất cả
          </Button>
          {blogCategories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(selectedCategory === cat.id ? null : cat.id)}
              className="rounded-full"
            >
              {cat.name_vi || cat.name}
            </Button>
          ))}
        </div>

        {/* Tags Filter */}
        {allTags && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.slice(0, 15).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => handleTagChange(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Active Filters */}
        {isFiltering && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Đang lọc:</span>
            {selectedCategory && (
              <Badge variant="outline" className="gap-1">
                {blogCategories?.find(c => c.id === selectedCategory)?.name_vi || blogCategories?.find(c => c.id === selectedCategory)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryChange(null)} />
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="outline" className="gap-1">
                #{selectedTag}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleTagChange(null)} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
              Xóa bộ lọc
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Skeleton className="lg:col-span-3 h-64" />
              <Skeleton className="lg:col-span-6 h-96" />
              <Skeleton className="lg:col-span-3 h-64" />
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            {!isFiltering && currentPage === 1 && featuredPost && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
                <div className="lg:col-span-9 flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex items-center">
                      <Link to={getBlogPostUrl(featuredPost)} className="group">
                        <h2 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-3 group-hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {stripHtml(featuredPost.summary_html)}
                        </p>
                      </Link>
                    </div>
                    <div className="lg:col-span-2">
                      <Link to={getBlogPostUrl(featuredPost)} className="block">
                        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                          {featuredPost.image_url ? (
                            <img src={featuredPost.image_url} alt={featuredPost.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">No image</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {secondaryPosts.map((post) => (
                      <Link key={post.id} to={getBlogPostUrl(post)} className="group">
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-muted">
                          {post.image_url ? (
                            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(post.summary_html)}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3 self-stretch">
                  <h3 className="text-lg font-bold text-foreground mb-4">Popular articles</h3>
                  <div className="divide-y divide-border">
                    {popularPosts.map((post, index) => (
                      <Link key={post.id} to={getBlogPostUrl(post)} className="flex gap-4 py-5 group first:pt-0">
                        <span className="text-3xl font-bold text-amber-500 shrink-0">{index + 1}</span>
                        <div>
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{post.title}</h4>
                          {post.blog_title && (
                            <p className="text-sm text-muted-foreground mt-1">{post.blog_title}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Grid Posts */}
            {gridPosts.length > 0 ? (
              <div id="all-posts">
                {!isFiltering && currentPage === 1 && (
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Tất cả bài viết</h2>
                )}
                
                {isFiltering && (
                  <p className="text-muted-foreground mb-6">Tìm thấy {totalCount} bài viết</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {gridPosts.map((post) => (
                    <Link key={post.id} to={getBlogPostUrl(post)} className="group">
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                        {post.image_url ? (
                          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(post.shopify_published_at)}</p>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" onClick={() => handlePageChange(page)}>
                            {page}
                          </Button>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                    
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Trang {currentPage} / {totalPages || 1}
                </p>
              </div>
            ) : isFiltering ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Không tìm thấy bài viết nào phù hợp</p>
                <Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>
              </div>
            ) : null}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
