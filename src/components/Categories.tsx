import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useCategories } from "@/hooks/useCategories";
import { ArrowRight } from "lucide-react";
import categoryDogs from "@/assets/category-dogs.jpg";
import categoryCats from "@/assets/category-cats.jpg";
import categoryToys from "@/assets/category-toys.jpg";
import categoryFood from "@/assets/category-food.jpg";

const fallbackImages = [categoryDogs, categoryCats, categoryToys, categoryFood];

export const Categories = () => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="pt-6 pb-3 md:pt-8 md:pb-4 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayCategories = categories && categories.length > 0 ? categories : [];

  return (
    <section className="pt-6 pb-3 md:pt-8 md:pb-4 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Shop by Category
          </h2>
          <Link 
            to="/collections" 
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {displayCategories.map((category, index) => (
              <CarouselItem key={category.id} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                <Link to={`/collections/${category.slug}`}>
                  <Card className="group relative overflow-hidden border-0 transition-smooth cursor-pointer shadow-card hover:shadow-hover">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={category.image_url || fallbackImages[index % fallbackImages.length]}
                      alt={category.name}
                      className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-xl font-bold text-foreground mb-3 transition-smooth group-hover:text-primary">
                      {category.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold transition-smooth group-hover:translate-x-2">
                      Shop Now
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </div>
    </section>
  );
};
