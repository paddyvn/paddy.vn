import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { QuickActions } from "@/components/QuickActions";
import { DealsGrid } from "@/components/DealsGrid";
import { PetSelector } from "@/components/PetSelector";
import { Categories } from "@/components/Categories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroCarousel />
        <QuickActions />
        <DealsGrid />
        <PetSelector />
        <Categories />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
