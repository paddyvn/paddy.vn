import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { usePages, useSyncPages, useDeletePage } from "@/hooks/usePages";
import { useLandingPages } from "@/hooks/useLandingPages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Eye, Edit, RefreshCw, Plus } from "lucide-react";
import { format } from "date-fns";

const LandingPagesManager = lazy(() => import("@/components/admin/LandingPagesManager"));

export default function Pages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const { data: pages, isLoading } = usePages();
  const { data: landingPages } = useLandingPages();
  const syncPages = useSyncPages();

  const filteredPages = useMemo(() => {
    if (!pages) return [];
    return pages.filter((page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.handle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pages, searchQuery]);

  const selectedPageData = pages?.find((p) => p.id === selectedPage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pages</h2>
        <p className="text-muted-foreground">Manage store pages and landing pages</p>
      </div>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Store Pages</TabsTrigger>
          <TabsTrigger value="landing">
            Landing Pages
            {landingPages && landingPages.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{landingPages.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/content/pages/new/edit")}>
                <Plus className="h-4 w-4 mr-2" />
                Create page
              </Button>
              <Button
                variant="outline"
                onClick={() => syncPages.mutate()}
                disabled={syncPages.isPending}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncPages.isPending ? "animate-spin" : ""}`} />
                {syncPages.isPending ? "Syncing..." : "Sync Pages"}
              </Button>
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
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchQuery ? "No pages found" : "No pages yet. Create one or sync from Shopify."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell className="text-muted-foreground">{page.handle}</TableCell>
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
                            onClick={() => navigate(`/admin/content/pages/${page.id}/edit`)}
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
        </TabsContent>

        <TabsContent value="landing" className="mt-4">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <LandingPagesManager />
          </Suspense>
        </TabsContent>
      </Tabs>

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
    </div>
  );
}
