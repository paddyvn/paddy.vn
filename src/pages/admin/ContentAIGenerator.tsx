import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Wand2, Download, Loader2, Cat, Dog, Sparkles, Settings2, Save } from "lucide-react";

const IMAGE_SIZES = [
  { value: "1024x1024", label: "1024 × 1024 (Square)" },
  { value: "1536x1024", label: "1536 × 1024 (Landscape)" },
  { value: "1024x1536", label: "1024 × 1536 (Portrait)" },
];

async function uploadToTempStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `ai-temp/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, { contentType: file.type, cacheControl: "300" });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export default function ContentAIGenerator() {
  const { toast } = useToast();
  const [petPreview, setPetPreview] = useState<string | null>(null);
  const [accessoryPreview, setAccessoryPreview] = useState<string | null>(null);
  const [petUrl, setPetUrl] = useState<string | null>(null);
  const [accessoryUrl, setAccessoryUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<"pet" | "accessory" | null>(null);

  const petInputRef = useRef<HTMLInputElement>(null);
  const accessoryInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "pet" | "accessory"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === "pet") setPetPreview(e.target?.result as string);
      else setAccessoryPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setIsUploading(type);
    try {
      const publicUrl = await uploadToTempStorage(file);
      if (type === "pet") setPetUrl(publicUrl);
      else setAccessoryUrl(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
      if (type === "pet") { setPetPreview(null); setPetUrl(null); }
      else { setAccessoryPreview(null); setAccessoryUrl(null); }
    } finally {
      setIsUploading(null);
    }
  };

  const handleGenerate = async () => {
    if (!petUrl || !accessoryUrl) {
      toast({ title: "Missing images", description: "Please upload both a pet image and an accessory/toy image", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-pet-image", {
        body: {
          petImage: petUrl,
          accessoryImage: accessoryUrl,
          prompt: customPrompt || undefined,
          size: imageSize,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedImage(data.generatedImage);
      toast({ title: "Image generated!", description: data.message || "Your pet image has been created successfully" });
    } catch (error) {
      console.error("Generation error:", error);
      toast({ title: "Generation failed", description: error instanceof Error ? error.message : "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = generatedImage;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const mimeType = `image/${downloadFormat}`;
      const quality = downloadFormat === "png" ? undefined : 0.92;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `pet-with-accessory-${Date.now()}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = `pet-with-accessory-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveToFiles = async () => {
    if (!generatedImage) return;

    setIsSaving(true);
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const fileName = `pet-generated-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, blob, { contentType: "image/png", cacheControl: "3600" });

      if (error) throw error;

      toast({ title: "Image saved!", description: "Image has been saved to Files storage" });
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Save failed", description: error instanceof Error ? error.message : "Failed to save image", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setPetPreview(null);
    setAccessoryPreview(null);
    setPetUrl(null);
    setAccessoryUrl(null);
    setGeneratedImage(null);
    setCustomPrompt("");
    setImageSize("1024x1024");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Pet Image Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a pet photo and an accessory/toy to create adorable combined images
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Pet Image Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dog className="h-5 w-5" />
                <Cat className="h-5 w-5" />
                Pet Image
              </CardTitle>
              <CardDescription>Upload a photo of your dog or cat</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept="image/*"
                ref={petInputRef}
                onChange={(e) => handleImageUpload(e, "pet")}
                className="hidden"
              />
              {petPreview ? (
                <div className="relative group">
                  <img src={petPreview} alt="Pet" className="w-full h-48 object-contain rounded-lg bg-muted" />
                  {isUploading === "pet" && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => petInputRef.current?.click()}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-48 border-dashed flex flex-col gap-2"
                  onClick={() => petInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-muted-foreground">Click to upload pet image</span>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Accessory Image Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                Accessory / Toy Image
              </CardTitle>
              <CardDescription>Upload the accessory or toy for your pet</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept="image/*"
                ref={accessoryInputRef}
                onChange={(e) => handleImageUpload(e, "accessory")}
                className="hidden"
              />
              {accessoryPreview ? (
                <div className="relative group">
                  <img src={accessoryPreview} alt="Accessory" className="w-full h-48 object-contain rounded-lg bg-muted" />
                  {isUploading === "accessory" && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => accessoryInputRef.current?.click()}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-48 border-dashed flex flex-col gap-2"
                  onClick={() => accessoryInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-muted-foreground">Click to upload accessory/toy image</span>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Output Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="h-5 w-5" />
                Output Settings
              </CardTitle>
              <CardDescription>Configure the generated image output</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-size">Image Size</Label>
                <Select value={imageSize} onValueChange={setImageSize}>
                  <SelectTrigger id="image-size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Custom Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Custom Instructions (Optional)</CardTitle>
              <CardDescription>
                Add specific instructions for how the pet should interact with the item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Make the cat wear the bow tie on its neck, looking elegant..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!petUrl || !accessoryUrl || isGenerating || isUploading !== null}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Output Section */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader>
            <CardTitle>Generated Result</CardTitle>
            <CardDescription>
              Your AI-generated pet image will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="w-full h-80 rounded-lg bg-muted flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Creating your adorable pet image...</p>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <img
                  src={generatedImage}
                  alt="Generated pet with accessory"
                  className="w-full rounded-lg"
                />
                <div className="flex gap-2">
                  <Select value={downloadFormat} onValueChange={(v) => setDownloadFormat(v as "png" | "jpeg" | "webp")}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <Button
                  onClick={handleSaveToFiles}
                  variant="outline"
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Files
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="w-full h-80 rounded-lg bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Sparkles className="h-12 w-12" />
                <p>Upload images and click generate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
