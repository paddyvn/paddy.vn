import { useState, useMemo } from "react";
import { usePages, useSyncPages, useUpdatePage, useDeletePage } from "@/hooks/usePages";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Eye, Edit, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function Pages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);

  const { data: pages, isLoading } = usePages();
  const syncPages = useSyncPages();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();

  const filteredPages = useMemo(() => {
    if (!pages) return [];

    return pages.filter((page) => {
      const matchesSearch =
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.handle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [pages, searchQuery]);

  const selectedPageData = pages?.find((p) => p.id === selectedPage);

  const handleSync = () => {
    syncPages.mutate();
  };

  const handleEdit = (page: any) => {
    setEditingPage({
      ...page,
    });
  };

  const handleSaveEdit = () => {
    if (!editingPage) return;

    updatePage.mutate(
      {
        id: editingPage.id,
        updates: {
          title: editingPage.title,
          body_html: editingPage.body_html,
          published: editingPage.published,
        },
      },
      {
        onSuccess: () => {
          setEditingPage(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletePageId) return;

    deletePage.mutate(deletePageId, {
      onSuccess: () => {
        setDeletePageId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pages</h2>
          <p className="text-muted-foreground">
            Manage pages synced from Shopify
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncPages.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncPages.isPending ? "animate-spin" : ""}`} />
          {syncPages.isPending ? "Syncing..." : "Sync Pages"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
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
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-32 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No pages found" : "No pages synced yet. Click 'Sync Pages' to import from Shopify."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {page.handle}
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.published ? "default" : "secondary"}>
                      {page.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(page.updated_at), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPage(page.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(page)}
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

      {/* View Dialog */}
      <Dialog open={!!selectedPage} onOpenChange={() => setSelectedPage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPageData?.title}</DialogTitle>
            <DialogDescription>
              Handle: {selectedPageData?.handle} •{" "}
              {selectedPageData && format(new Date(selectedPageData.updated_at), "MMM d, yyyy HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {selectedPageData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={selectedPageData.published ? "default" : "secondary"}>
                  {selectedPageData.published ? "Published" : "Draft"}
                </Badge>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Content</h3>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPageData.body_html || "" }}
                />
              </div>

              {selectedPageData.author && (
                <div>
                  <h3 className="font-semibold mb-2">Author</h3>
                  <p className="text-sm text-muted-foreground">{selectedPageData.author}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Make changes to the page content and settings
            </DialogDescription>
          </DialogHeader>

          {editingPage && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingPage.title}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="body">Content (HTML)</Label>
                <Textarea
                  id="body"
                  value={editingPage.body_html || ""}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, body_html: e.target.value })
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={editingPage.published}
                  onCheckedChange={(checked) =>
                    setEditingPage({ ...editingPage, published: checked })
                  }
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                setDeletePageId(editingPage.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingPage(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updatePage.isPending}>
                {updatePage.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePageId} onOpenChange={() => setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the page from your database. This action cannot be undone.
              The page will still exist in Shopify.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}