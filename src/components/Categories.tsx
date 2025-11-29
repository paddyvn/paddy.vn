import { Card } from "@/components/ui/card";
import categoryDogs from "@/assets/category-dogs.jpg";
import categoryCats from "@/assets/category-cats.jpg";
import categoryToys from "@/assets/category-toys.jpg";
import categoryFood from "@/assets/category-food.jpg";

const categories = [
  {
    title: "Dogs",
    description: "Everything for your loyal companion",
    image: categoryDogs,
    color: "primary",
  },
  {
    title: "Cats",
    description: "Purr-fect supplies for your feline",
    image: categoryCats,
    color: "secondary",
  },
  {
    title: "Toys",
    description: "Endless fun and entertainment",
    image: categoryToys,
    color: "accent",
  },
  {
    title: "Food & Treats",
    description: "Nutritious meals they'll love",
    image: categoryFood,
    color: "muted",
  },
];

export const Categories = () => {
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
          {categories.map((category, index) => (
            <Card
              key={category.title}
              className="group relative overflow-hidden border-2 hover:border-primary transition-smooth cursor-pointer shadow-card hover:shadow-hover animate-in fade-in zoom-in duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-foreground mb-2 transition-smooth group-hover:text-primary">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
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
