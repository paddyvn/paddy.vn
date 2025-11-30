import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageVerification {
  id: string;
  url: string;
  alt: string | null;
  type: 'category' | 'product';
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

export function useVerifyImages() {
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [images, setImages] = useState<ImageVerification[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 });

  const verifyImages = async (sampleSize = 20) => {
    setVerifying(true);
    setImages([]);
    setStats({ total: 0, success: 0, error: 0 });

    try {
      // Fetch sample migrated images from categories
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .not('image_url', 'is', null)
        .not('image_url', 'like', '%cdn.shopify.com%')
        .limit(Math.floor(sampleSize / 2));

      // Fetch sample migrated images from products
      const { data: productImages } = await supabase
        .from('product_images')
        .select('id, alt_text, image_url')
        .not('image_url', 'like', '%cdn.shopify.com%')
        .limit(Math.ceil(sampleSize / 2));

      const sampleImages: ImageVerification[] = [
        ...(categories?.map(c => ({
          id: c.id,
          url: c.image_url!,
          alt: c.name,
          type: 'category' as const,
          status: 'pending' as const,
        })) || []),
        ...(productImages?.map(p => ({
          id: p.id,
          url: p.image_url,
          alt: p.alt_text,
          type: 'product' as const,
          status: 'pending' as const,
        })) || []),
      ];

      setImages(sampleImages);
      setStats({ total: sampleImages.length, success: 0, error: 0 });

      // Verify each image by loading it
      for (let i = 0; i < sampleImages.length; i++) {
        const img = sampleImages[i];
        
        setImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'loading' } : item
        ));

        try {
          await verifyImageUrl(img.url);
          
          setImages(prev => prev.map(item => 
            item.id === img.id ? { ...item, status: 'success' } : item
          ));
          setStats(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to load';
          
          setImages(prev => prev.map(item => 
            item.id === img.id ? { ...item, status: 'error', error: errorMsg } : item
          ));
          setStats(prev => ({ ...prev, error: prev.error + 1 }));
        }
      }

      const finalStats = {
        total: sampleImages.length,
        success: sampleImages.filter(img => 
          images.find(i => i.id === img.id)?.status === 'success'
        ).length,
        error: sampleImages.filter(img => 
          images.find(i => i.id === img.id)?.status === 'error'
        ).length,
      };

      toast({
        title: "Verification complete",
        description: `${finalStats.success} images loaded successfully, ${finalStats.error} failed`,
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Failed to verify images",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return {
    verifying,
    images,
    stats,
    verifyImages,
  };
}

function verifyImageUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
    
    // Timeout after 10 seconds
    setTimeout(() => reject(new Error('Image load timeout')), 10000);
  });
}
