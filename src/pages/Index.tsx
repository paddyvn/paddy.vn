import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { QuickActions } from "@/components/QuickActions";
import { FlashSaleSection } from "@/components/FlashSaleSection";
import { VouchersSection } from "@/components/VouchersSection";
import { DealsGrid } from "@/components/DealsGrid";
import { Categories } from "@/components/Categories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Brands } from "@/components/Brands";
import { BlogSection } from "@/components/BlogSection";
import { StoreLocations } from "@/components/StoreLocations";
import { Footer } from "@/components/Footer";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: session } = useQuery({
    queryKey: ["session-home"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroCarousel />
        <QuickActions />
        <FlashSaleSection />
        <VouchersSection />
        <DealsGrid />
        
        <Categories />
        <FeaturedProducts />
        {session?.user?.id && <RecentlyViewed userId={session.user.id} />}
        <Brands />
        <BlogSection />
        <StoreLocations />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
