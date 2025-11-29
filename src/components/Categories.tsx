import { Card } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import categoryDogs from "@/assets/category-dogs.jpg";
import categoryCats from "@/assets/category-cats.jpg";
import categoryToys from "@/assets/category-toys.jpg";
import categoryFood from "@/assets/category-food.jpg";

const fallbackImages = [categoryDogs, categoryCats, categoryToys, categoryFood];

export const Categories = () => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-background">
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
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find exactly what your pets need, from food to toys to accessories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayCategories.map((category, index) => (
            <Card
              key={category.id}
              className="group relative overflow-hidden border-2 hover:border-primary transition-smooth cursor-pointer shadow-card hover:shadow-hover animate-in fade-in zoom-in duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={category.image_url || fallbackImages[index % fallbackImages.length]}
                  alt={category.name}
                  className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-foreground mb-2 transition-smooth group-hover:text-primary">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description || `Browse our ${category.name.toLowerCase()} collection`}
                </p>
                
                <div className="flex items-center gap-2 text-primary font-semibold transition-smooth group-hover:translate-x-2">
                  Shop Now
                  <svg
                    className="w-4 h-4"
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
          ))}
        </div>
      </div>
    </section>
  );
};
