import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useMigrateImages } from "@/hooks/useMigrateImages";
import { useVerifyImages } from "@/hooks/useVerifyImages";
import { StorageFileBrowser } from "@/components/StorageFileBrowser";
import { useState } from "react";

export default function ContentFiles() {
  const migrateImages = useMigrateImages();
  const verifyImages = useVerifyImages();
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
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

      <Collapsible open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
        <div className="rounded-lg border bg-card">
          <div className="p-6 flex items-center justify-between">
            <CollapsibleTrigger className="flex-1 flex items-center justify-between hover:opacity-80 transition-opacity">
              <div className="text-left">
                <h3 className="text-lg font-semibold">Image Verification</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Verify that migrated images are accessible and display correctly
                </p>
              </div>
              {isVerificationOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground ml-4" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground ml-4" />
              )}
            </CollapsibleTrigger>
            
            <div className="ml-4">
              <Button
              onClick={() => verifyImages.verifyImages(20)}
              disabled={verifyImages.verifying}
              variant="outline"
              className="gap-2"
            >
              {verifyImages.verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Verify Sample
                </>
              )}
              </Button>
            </div>
          </div>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4">
              {verifyImages.stats.total > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total:</span>
                <Badge variant="outline">{verifyImages.stats.total}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">{verifyImages.stats.success}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">{verifyImages.stats.error}</span>
                </div>
              </div>
              )}

              {verifyImages.images.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {verifyImages.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg border overflow-hidden bg-muted"
                >
                  {image.status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  
                  {image.status === 'success' && (
                    <>
                      <img
                        src={image.url}
                        alt={image.alt || 'Product image'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <div className="bg-green-600 rounded-full p-1">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {image.status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
                      <XCircle className="h-6 w-6 text-destructive" />
                      <p className="text-xs text-center text-destructive">
                        {image.error || 'Failed to load'}
                      </p>
                    </div>
                  )}
                  
                  {image.status === 'pending' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">Pending</span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                    <p className="text-xs truncate">{image.alt || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{image.type}</p>
                  </div>
                  </div>
                ))}
              </div>
              )}
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
