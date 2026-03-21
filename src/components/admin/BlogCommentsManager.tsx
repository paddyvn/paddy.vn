import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, ExternalLink, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function BlogCommentsManager() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const { data: comments, isLoading } = useQuery({
    queryKey: ["admin-blog-comments", currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * PAGE_SIZE;
      const { data, error } = await supabase
        .from("blog_comments")
        .select(`
          id, content, created_at, likes_count,
          blog_posts!blog_comments_post_id_fkey(id, title, handle),
          profiles!blog_comments_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("blog_comments").delete().eq("id", deleteTarget);
    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-comments-count"] });
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No comments yet.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Post</TableHead>
            <TableHead className="text-center">
              <ThumbsUp className="h-3.5 w-3.5 inline" />
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((c: any) => {
            const profile = c.profiles;
            const post = c.blog_posts;
            return (
              <TableRow key={c.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(c.created_at), "MMM d, HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {profile?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[120px]">
                      {profile?.full_name || profile?.email || "Unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm line-clamp-2 max-w-[300px]">{c.content}</p>
                </TableCell>
                <TableCell>
                  {post ? (
                    <Link
                      to={`/admin/content/blog/${post.id}/edit`}
                      className="text-sm text-primary hover:underline line-clamp-1 max-w-[200px]"
                    >
                      {post.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {c.likes_count || 0}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
