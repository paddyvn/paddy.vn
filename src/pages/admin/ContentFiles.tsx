import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useMigrateImages } from "@/hooks/useMigrateImages";
import { StorageFileBrowser } from "@/components/StorageFileBrowser";
import { useState } from "react";

export default function ContentFiles() {
  const migrateImages = useMigrateImages();
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isFileBrowserOpen, setIsFileBrowserOpen] = useState(true);

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

      <Collapsible open={isMigrationOpen} onOpenChange={setIsMigrationOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold">Image Migration</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Transfer all product and collection images from Shopify CDN to your Supabase Storage
              </p>
            </div>
            {isMigrationOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4">
              {(migrateImages.isPending || migrateImages.progress.total > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {migrateImages.progress.migrated} / {migrateImages.progress.total} images ({migrateImages.progress.percentage}%)
                </span>
              </div>
              <Progress value={migrateImages.progress.percentage} className="h-2" />
              
              {migrateImages.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-pulse">⏳</div>
                  <span>Migration in progress... Auto-continuing until complete.</span>
                </div>
              )}
              
              {migrateImages.progress.percentage === 100 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div>✓</div>
                  <span>All images migrated successfully!</span>
                </div>
              )}
            </div>
          )}

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
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Collapsible open={isFileBrowserOpen} onOpenChange={setIsFileBrowserOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold">File Browser</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Browse, upload, and manage all files in Supabase Storage
              </p>
            </div>
            {isFileBrowserOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6">
              <StorageFileBrowser />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
