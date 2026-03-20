import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSyncBlogPosts, BlogPost } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Edit, RefreshCw, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";

type SortField = "title" | "blog_title" | "author" | "published" | "shopify_published_at" | "updated_at";
type SortDirection = "asc" | "desc";

const POSTS_PER_PAGE = 20;

function applyBlogFilters(query: any, searchQuery: string, blogFilter: string) {
  if (blogFilter !== "all") {
    query = query.eq("shopify_blog_id", blogFilter);
  }
  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,handle.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`
    );
  }
  return query;
}

export default function ContentBlog() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [blogFilter, setBlogFilter] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("shopify_published_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const syncPosts = useSyncBlogPosts();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, blogFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  // Fetch unique blogs for filter dropdown
  const { data: blogs = [] } = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("shopify_blog_id, blog_title")
        .not("shopify_blog_id", "is", null)
        .not("blog_title", "is", null);

      if (error) throw error;

      const uniqueBlogs = new Map<string, string>();
      data.forEach((post: any) => {
        if (post.shopify_blog_id && post.blog_title) {
          uniqueBlogs.set(post.shopify_blog_id, post.blog_title);
        }
      });
      return Array.from(uniqueBlogs.entries()).map(([id, title]) => ({ id, title }));
    },
  });

  // Count query
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["admin-blog-posts-count", debouncedSearch, blogFilter],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true });

      query = applyBlogFilters(query, debouncedSearch, blogFilter);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // Map sort fields to DB columns
  const getDbSortColumn = (field: SortField): string => {
    switch (field) {
      case "updated_at": return "shopify_updated_at";
      default: return field;
    }
  };

  // Data query
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts", debouncedSearch, blogFilter, sortField, sortDirection, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const dbColumn = getDbSortColumn(sortField);
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order(dbColumn, { ascending: sortDirection === "asc", nullsFirst: false });

      query = applyBlogFilters(query, debouncedSearch, blogFilter);
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = Math.min(startIndex + POSTS_PER_PAGE, totalCount);

  // For the view dialog, fetch the selected post individually
  const { data: selectedPostData } = useQuery({
    queryKey: ["admin-blog-post-detail", selectedPost],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", selectedPost!)
        .maybeSingle();

      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!selectedPost,
  });

  const handleSync = () => {
    syncPosts.mutate();
  };

  const handleEdit = (postId: string) => {
    navigate(`/admin/content/blog/${postId}/edit`);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog posts</h2>
          <p className="text-muted-foreground">
            Manage blog posts for Paddy's Magazine
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/admin/content/blog/new/edit")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create post
          </Button>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncPosts.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncPosts.isPending ? "animate-spin" : ""}`} />
            {syncPosts.isPending ? "Syncing..." : "Sync from Shopify"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, handle, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={blogFilter} onValueChange={setBlogFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by blog" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blogs</SelectItem>
            {blogs.map((blog) => (
              <SelectItem key={blog.id} value={blog.id}>
                {blog.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("title")}
                >
                  Title
                  <SortIcon field="title" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("blog_title")}
                >
                  Blog
                  <SortIcon field="blog_title" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("author")}
                >
                  Author
                  <SortIcon field="author" />
                </Button>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("published")}
                >
                  Status
                  <SortIcon field="published" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("updated_at")}
                >
                  Updated
                  <SortIcon field="updated_at" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("shopify_published_at")}
                >
                  Published
                  <SortIcon field="shopify_published_at" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-32 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : (posts || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery || blogFilter !== "all"
                      ? "No blog posts found"
                      : "No blog posts synced yet. Click 'Sync Blog Posts' to import from Shopify."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              (posts || []).map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.blog_title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.author || "—"}
                  </TableCell>
                  <TableCell>
                    {post.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.split(",").slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                        {post.tags.split(",").length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.split(",").length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.shopify_updated_at
                      ? format(new Date(post.shopify_updated_at), "MMM d, yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.shopify_published_at
                      ? format(new Date(post.shopify_published_at), "MMM d, yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPost(post.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(post.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedPosts.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * POSTS_PER_PAGE) + 1} to {Math.min(currentPage * POSTS_PER_PAGE, filteredAndSortedPosts.length)} of {filteredAndSortedPosts.length} posts
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPostData?.title}</DialogTitle>
            <DialogDescription>
              {selectedPostData?.blog_title} • {selectedPostData?.handle} •{" "}
              {selectedPostData && format(new Date(selectedPostData.updated_at), "MMM d, yyyy HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {selectedPostData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={selectedPostData.published ? "default" : "secondary"}>
                  {selectedPostData.published ? "Published" : "Draft"}
                </Badge>
                {selectedPostData.tags && selectedPostData.tags.split(",").map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>

              {selectedPostData.image_url && (
                <div>
                  <img
                    src={selectedPostData.image_url}
                    alt={selectedPostData.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {selectedPostData.summary_html && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPostData.summary_html }}
                  />
                </div>
              )}

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Content</h3>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPostData.body_html || "" }}
                />
              </div>

              {selectedPostData.author && (
                <div>
                  <h3 className="font-semibold mb-2">Author</h3>
                  <p className="text-sm text-muted-foreground">{selectedPostData.author}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}