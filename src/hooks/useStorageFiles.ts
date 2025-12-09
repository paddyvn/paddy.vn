import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StorageFile {
  id: string;
  name: string;
  source: "product" | "collection" | "uploaded";
  created_at: string;
  publicUrl: string;
}

export function useStorageFiles(bucketName = "product-images") {
  const { toast } = useToast();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const allFilesData: StorageFile[] = [];
      
      // Fetch product images from database
      const { data: productImages, error: productError } = await supabase
        .from("product_images")
        .select("id, image_url, alt_text, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      
      if (productError) throw productError;
      
      for (const img of productImages || []) {
        if (img.image_url) {
          allFilesData.push({
            id: img.id,
            name: img.alt_text || extractFileName(img.image_url),
            source: "product",
            created_at: img.created_at,
            publicUrl: img.image_url,
          });
        }
      }
      
      // Fetch collection images from database
      const { data: collections, error: collectionError } = await supabase
        .from("categories")
        .select("id, name, image_url, created_at")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false });
      
      if (collectionError) throw collectionError;
      
      for (const col of collections || []) {
        if (col.image_url) {
          allFilesData.push({
            id: col.id,
            name: col.name || extractFileName(col.image_url),
            source: "collection",
            created_at: col.created_at,
            publicUrl: col.image_url,
          });
        }
      }
      
      // Also fetch any files uploaded directly to storage root
      const { data: rootItems } = await supabase.storage
        .from(bucketName)
        .list("", { limit: 100 });
      
      for (const item of rootItems || []) {
        if (item.id !== null) {
          allFilesData.push({
            id: item.id,
            name: item.name,
            source: "uploaded",
            created_at: item.created_at,
            publicUrl: supabase.storage.from(bucketName).getPublicUrl(item.name).data.publicUrl,
          });
        }
      }
      
      // Sort by created_at descending
      allFilesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFiles(allFilesData);
    } catch (error) {
      console.error("Failed to load files:", error);
      toast({
        title: "Failed to load files",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractFileName = (url: string): string => {
    try {
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1]) || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const uploadFile = async (file: File, path?: string) => {
    try {
      const fileName = path || `${Date.now()}-${file.name}`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      });

      await fetchFiles();
      return true;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "File deleted",
        description: `${fileName} deleted successfully`,
      });

      await fetchFiles();
      return true;
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
      return false;
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "File URL copied to clipboard",
    });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    files: filteredFiles,
    allFiles: files,
    loading,
    searchQuery,
    setSearchQuery,
    uploadFile,
    deleteFile,
    copyUrl,
    refetch: fetchFiles,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export { formatFileSize };
