import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";
import { ShopifySync } from "@/components/ShopifySync";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <div className="container mx-auto px-4 py-8">
          <ShopifySync />
        </div>
        <Categories />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
