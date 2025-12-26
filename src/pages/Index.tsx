import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { QuickActions } from "@/components/QuickActions";
import { FlashSaleSection } from "@/components/FlashSaleSection";
import { DealsGrid } from "@/components/DealsGrid";
import { PetSelector } from "@/components/PetSelector";
import { Categories } from "@/components/Categories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Brands } from "@/components/Brands";
import { BlogSection } from "@/components/BlogSection";
import { StoreLocations } from "@/components/StoreLocations";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroCarousel />
        <QuickActions />
        <FlashSaleSection />
        <DealsGrid />
        <PetSelector />
        <Categories />
        <FeaturedProducts />
        <Brands />
        <BlogSection />
        <StoreLocations />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
