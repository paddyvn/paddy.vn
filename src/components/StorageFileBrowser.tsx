import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Upload,
  Trash2,
  Copy,
  Image as ImageIcon,
  File,
  Loader2,
  Package,
  FolderOpen,
  FileText,
  UploadCloud,
} from "lucide-react";
import { useStorageFiles, SourceFilter } from "@/hooks/useStorageFiles";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SOURCE_TABS: { value: SourceFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: null },
  { value: "product", label: "Products", icon: <Package className="h-4 w-4" /> },
  { value: "collection", label: "Collections", icon: <FolderOpen className="h-4 w-4" /> },
  { value: "blog", label: "Blog", icon: <FileText className="h-4 w-4" /> },
  { value: "uploaded", label: "Uploaded", icon: <UploadCloud className="h-4 w-4" /> },
];

export function StorageFileBrowser() {
  const {
    files,
    allFiles,
    filteredCount,
    sourceCounts,
    sourceFilter,
    setSourceFilter,
    loading,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    uploadFile,
    deleteFile,
    copyUrl,
  } = useStorageFiles();

  const [selectedFile, setSelectedFile] = useState<typeof files[0] | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setUploading(true);
    for (const file of Array.from(selectedFiles)) {
      await uploadFile(file);
    }
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    await deleteFile(fileToDelete);
    setFileToDelete(null);
    if (selectedFile?.name === fileToDelete) {
      setSelectedFile(null);
    }
  };

  const isImage = (url?: string) => {
    if (!url) return true; // Assume image if no metadata
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    return imageExts.some(ext => url.toLowerCase().includes(ext));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Files
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Source Filter Tabs */}
      <Tabs value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
        <TabsList className="w-full justify-start">
          {SOURCE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.icon}
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">
                {sourceCounts[tab.value].toLocaleString()}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredCount)} of {filteredCount.toLocaleString()} files
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "No files found matching your search" : "No files uploaded yet"}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className="group relative aspect-square rounded-lg border overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors"
            >
              {isImage(file.publicUrl) ? (
                <img
                  src={file.publicUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <File className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs text-white truncate font-medium">
                    {file.name}
                  </p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {file.source}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* File Details Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
            <DialogDescription>
              View file information and perform actions
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                {isImage(selectedFile.publicUrl) ? (
                  <img
                    src={selectedFile.publicUrl}
                    alt={selectedFile.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <File className="h-24 w-24 text-muted-foreground" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {selectedFile.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Source:</span>
                  <Badge variant="outline">{selectedFile.source}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedFile.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Public URL:</label>
                <div className="flex gap-2">
                  <Input value={selectedFile.publicUrl} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyUrl(selectedFile.publicUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => {
                    setFileToDelete(selectedFile.name);
                    setSelectedFile(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete File
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => window.open(selectedFile.publicUrl, "_blank")}
                >
                  <ImageIcon className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
