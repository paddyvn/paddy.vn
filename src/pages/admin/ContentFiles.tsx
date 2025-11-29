import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useMigrateImages } from "@/hooks/useMigrateImages";

export default function ContentFiles() {
  const migrateImages = useMigrateImages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Files</h2>
          <p className="text-muted-foreground">
            Manage images, videos, and other media assets
          </p>
        </div>
        <div className="flex gap-2">
          {migrateImages.isPending ? (
            <Button
              onClick={() => migrateImages.pause()}
              variant="outline"
              className="gap-2"
            >
              Pause Migration
            </Button>
          ) : (
            <Button
              onClick={() => migrateImages.mutate()}
              variant="default"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {migrateImages.isSuccess ? "Resume Migration" : "Migrate Images from Shopify"}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Image Migration</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Click the button above to transfer all product and collection images from Shopify CDN to your Supabase Storage. 
              This will give you full control and independence from Shopify.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">What happens during migration:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All collection images will be downloaded and uploaded to Supabase Storage</li>
              <li>All product images will be downloaded and uploaded to Supabase Storage</li>
              <li>Database records will be updated with new Supabase Storage URLs</li>
              <li>Original Shopify URLs will be replaced</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          File browser and management interface coming soon
        </p>
      </div>
    </div>
  );
}
