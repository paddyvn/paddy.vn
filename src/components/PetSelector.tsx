import { ChevronRight } from "lucide-react";
import categoryDogs from "@/assets/category-dogs.jpg";
import categoryCats from "@/assets/category-cats.jpg";

export const PetSelector = () => {
  const pets = [
    { name: "Dogs", image: categoryDogs },
    { name: "Cats", image: categoryCats },
    { name: "Birds", image: categoryDogs },
    { name: "Fish", image: categoryCats },
    { name: "Small Pets", image: categoryDogs },
  ];

  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Who are you shopping for today?</h2>
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {pets.map((pet, index) => (
              <button
                key={index}
                className="flex-shrink-0 group"
              >
                <div className="w-40 h-40 rounded-full overflow-hidden mb-3 border-4 border-background shadow-card hover:shadow-hover transition-smooth group-hover:scale-105">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center font-semibold text-foreground">{pet.name}</p>
              </button>
            ))}
          </div>
          
          {/* Scroll button */}
          <button className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-smooth">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
};
