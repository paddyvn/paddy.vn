import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StorageFile {
  id: string;
  name: string;
  source: "product" | "collection" | "blog" | "uploaded";
  created_at: string;
  publicUrl: string;
  storagePath: string;
  dbTable: "product_images" | "categories" | "blog_posts" | null;
  dbId: string | null;
}

export type SourceFilter = "all" | "product" | "collection" | "blog" | "uploaded";

const ITEMS_PER_PAGE = 60;
const BUCKET_NAME = "product-images";

function extractStoragePath(publicUrl: string): string {
  const marker = `/${BUCKET_NAME}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return "";
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

function extractFileName(url: string): string {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "Unknown";
  } catch {
    return "Unknown";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function useStorageFiles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sourceFilter]);

  // ── Source counts (lightweight, cached 30s) ──
  const { data: sourceCounts = { all: 0, product: 0, collection: 0, blog: 0, uploaded: 0 } } = useQuery({
    queryKey: ["files-source-counts"],
    queryFn: async () => {
      const [
        { count: productCount },
        { count: collectionCount },
        { count: blogCount },
      ] = await Promise.all([
        supabase.from("product_images").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }).not("image_url", "is", null),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }).not("image_url", "is", null),
      ]);

      // Count uploaded files in storage
      let uploadedCount = 0;
      try {
        const { data: uploadedItems } = await supabase.storage.from(BUCKET_NAME).list("uploads", { limit: 1000 });
        uploadedCount = (uploadedItems || []).filter(i => i.id !== null).length;
      } catch { /* ignore */ }

      const p = productCount || 0;
      const c = collectionCount || 0;
      const b = blogCount || 0;
      return {
        all: p + c + b + uploadedCount,
        product: p,
        collection: c,
        blog: b,
        uploaded: uploadedCount,
      };
    },
    staleTime: 30000,
  });

  // ── Count for current filter (for pagination) ──
  const { data: filteredCount = 0 } = useQuery({
    queryKey: ["files-count", debouncedSearch, sourceFilter],
    queryFn: async () => {
      if (sourceFilter === "uploaded") {
        // Storage doesn't have a count API, use the sourceCounts
        return sourceCounts.uploaded;
      }

      const counts: number[] = [];

      if (sourceFilter === "all" || sourceFilter === "product") {
        let q = supabase.from("product_images").select("*", { count: "exact", head: true });
        if (debouncedSearch) q = q.ilike("alt_text", `%${debouncedSearch}%`);
        const { count } = await q;
        if (sourceFilter === "product") return count || 0;
        counts.push(count || 0);
      }

      if (sourceFilter === "all" || sourceFilter === "collection") {
        let q = supabase.from("categories").select("*", { count: "exact", head: true }).not("image_url", "is", null);
        if (debouncedSearch) q = q.ilike("name", `%${debouncedSearch}%`);
        const { count } = await q;
        if (sourceFilter === "collection") return count || 0;
        counts.push(count || 0);
      }

      if (sourceFilter === "all" || sourceFilter === "blog") {
        let q = supabase.from("blog_posts").select("*", { count: "exact", head: true }).not("image_url", "is", null);
        if (debouncedSearch) q = q.ilike("title", `%${debouncedSearch}%`);
        const { count } = await q;
        if (sourceFilter === "blog") return count || 0;
        counts.push(count || 0);
      }

      return counts.reduce((a, b) => a + b, 0);
    },
  });

  // ── Data query (paginated) ──
  const { data: files = [], isLoading: loading } = useQuery({
    queryKey: ["files-data", debouncedSearch, sourceFilter, currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const results: StorageFile[] = [];

      if (sourceFilter === "product") {
        return fetchProductImages(debouncedSearch, offset, ITEMS_PER_PAGE);
      }

      if (sourceFilter === "collection") {
        return fetchCollectionImages(debouncedSearch, offset, ITEMS_PER_PAGE);
      }

      if (sourceFilter === "blog") {
        return fetchBlogImages(debouncedSearch, offset, ITEMS_PER_PAGE);
      }

      if (sourceFilter === "uploaded") {
        return fetchUploadedFiles(offset, ITEMS_PER_PAGE);
      }

      // "all" tab — fetch proportional amounts from each source, merge by date
      const perSource = Math.ceil(ITEMS_PER_PAGE / 3);
      const [products, collections, blogs] = await Promise.all([
        fetchProductImages(debouncedSearch, 0, perSource),
        fetchCollectionImages(debouncedSearch, 0, perSource),
        fetchBlogImages(debouncedSearch, 0, perSource),
      ]);

      results.push(...products, ...collections, ...blogs);
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return results.slice(0, ITEMS_PER_PAGE);
    },
  });

  const totalPages = Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE));

  // ── Upload ──
  const uploadFile = async (file: File) => {
    try {
      const fileName = `uploads/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;

      toast({ title: "File uploaded", description: `${file.name} uploaded successfully` });
      invalidateAll();
      return true;
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Failed to upload file", variant: "destructive" });
      return false;
    }
  };

  // ── Delete (full storage path + DB cleanup) ──
  const deleteFile = async (file: StorageFile) => {
    try {
      // 1. Delete from storage
      if (file.storagePath) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([file.storagePath]);
        if (storageError) {
          console.error("Storage delete error:", storageError);
        }
      }

      // 2. Clean DB reference
      if (file.dbTable && file.dbId) {
        if (file.dbTable === "product_images") {
          await supabase.from("product_images").delete().eq("id", file.dbId);
        } else if (file.dbTable === "categories") {
          await supabase.from("categories").update({ image_url: null }).eq("id", file.dbId);
        } else if (file.dbTable === "blog_posts") {
          await supabase.from("blog_posts").update({ image_url: null }).eq("id", file.dbId);
        }
      }

      toast({ title: "File deleted", description: `${file.name} deleted successfully` });
      invalidateAll();
      return true;
    } catch (error) {
      toast({ title: "Delete failed", description: error instanceof Error ? error.message : "Failed to delete file", variant: "destructive" });
      return false;
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied", description: "File URL copied to clipboard" });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["files-data"] });
    queryClient.invalidateQueries({ queryKey: ["files-count"] });
    queryClient.invalidateQueries({ queryKey: ["files-source-counts"] });
  };

  return {
    files,
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
    itemsPerPage: ITEMS_PER_PAGE,
    uploadFile,
    deleteFile,
    copyUrl,
  };
}

// ── Fetch helpers ──

async function fetchProductImages(search: string, offset: number, limit: number): Promise<StorageFile[]> {
  let q = supabase
    .from("product_images")
    .select("id, image_url, alt_text, created_at")
    .order("created_at", { ascending: false });
  if (search) q = q.ilike("alt_text", `%${search}%`);
  q = q.range(offset, offset + limit - 1);

  const { data } = await q;
  return (data || [])
    .filter(img => img.image_url)
    .map(img => ({
      id: img.id,
      name: img.alt_text || extractFileName(img.image_url),
      source: "product" as const,
      created_at: img.created_at,
      publicUrl: img.image_url,
      storagePath: extractStoragePath(img.image_url),
      dbTable: "product_images" as const,
      dbId: img.id,
    }));
}

async function fetchCollectionImages(search: string, offset: number, limit: number): Promise<StorageFile[]> {
  let q = supabase
    .from("categories")
    .select("id, name, image_url, created_at")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false });
  if (search) q = q.ilike("name", `%${search}%`);
  q = q.range(offset, offset + limit - 1);

  const { data } = await q;
  return (data || [])
    .filter(col => col.image_url)
    .map(col => ({
      id: col.id,
      name: col.name || extractFileName(col.image_url!),
      source: "collection" as const,
      created_at: col.created_at,
      publicUrl: col.image_url!,
      storagePath: extractStoragePath(col.image_url!),
      dbTable: "categories" as const,
      dbId: col.id,
    }));
}

async function fetchBlogImages(search: string, offset: number, limit: number): Promise<StorageFile[]> {
  let q = supabase
    .from("blog_posts")
    .select("id, title, image_url, created_at")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false });
  if (search) q = q.ilike("title", `%${search}%`);
  q = q.range(offset, offset + limit - 1);

  const { data } = await q;
  return (data || [])
    .filter(post => post.image_url)
    .map(post => ({
      id: post.id,
      name: post.title || extractFileName(post.image_url!),
      source: "blog" as const,
      created_at: post.created_at,
      publicUrl: post.image_url!,
      storagePath: extractStoragePath(post.image_url!),
      dbTable: "blog_posts" as const,
      dbId: post.id,
    }));
}

async function fetchUploadedFiles(offset: number, limit: number): Promise<StorageFile[]> {
  const { data: items } = await supabase.storage
    .from(BUCKET_NAME)
    .list("uploads", { limit, offset, sortBy: { column: "created_at", order: "desc" } });

  return (items || [])
    .filter(item => item.id !== null)
    .map(item => ({
      id: item.id!,
      name: item.name,
      source: "uploaded" as const,
      created_at: item.created_at,
      publicUrl: supabase.storage.from(BUCKET_NAME).getPublicUrl(`uploads/${item.name}`).data.publicUrl,
      storagePath: `uploads/${item.name}`,
      dbTable: null,
      dbId: null,
    }));
}
