import { Dog, Cat } from "lucide-react";
import { Link } from "react-router-dom";

export const PetSelector = () => {
  const dogCategories = [
    { name: "Dog Food", icon: "🍖", href: "/category/dog-food" },
    { name: "Treats", icon: "🦴", href: "/category/dog-treats" },
    { name: "Flea & Worm", icon: "💊", href: "/category/flea-worm" },
    { name: "Dog Toys", icon: "🎾", href: "/category/dog-toys" },
  ];

  const catCategories = [
    { name: "Cat Food", icon: "🐟", href: "/category/cat-food" },
    { name: "Treats", icon: "🍤", href: "/category/cat-treats" },
    { name: "Cat Toys", icon: "🧶", href: "/category/cat-toys" },
    { name: "Litter", icon: "🪣", href: "/category/cat-litter" },
  ];

  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dog Section */}
          <div className="bg-background rounded-2xl shadow-card overflow-hidden">
            <div className="flex">
              <Link 
                to="/category/dog" 
                className="flex-1 bg-amber-400 hover:bg-amber-500 transition-colors p-6 flex items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <Dog className="w-12 h-12 text-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-2xl font-bold text-foreground">Dog</span>
              </Link>
              <Link 
                to="/category/puppy" 
                className="flex-1 bg-amber-300 hover:bg-amber-400 transition-colors p-6 flex items-center justify-center gap-4 group"
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <Dog className="w-10 h-10 text-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-2xl font-bold text-foreground">Puppy</span>
              </Link>
            </div>
            <div className="px-8 py-4 flex justify-evenly">
              {dogCategories.map((cat, index) => (
                <Link 
                  key={index}
                  to={cat.href}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Cat Section */}
          <div className="bg-background rounded-2xl shadow-card overflow-hidden">
            <div className="flex">
              <Link 
                to="/category/cat" 
                className="flex-1 bg-amber-100 hover:bg-amber-200 transition-colors p-6 flex items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <Cat className="w-12 h-12 text-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-2xl font-bold text-foreground">Cat</span>
              </Link>
              <Link 
                to="/category/kitten" 
                className="flex-1 bg-amber-50 hover:bg-amber-100 transition-colors p-6 flex items-center justify-center gap-4 group"
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <Cat className="w-10 h-10 text-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-2xl font-bold text-foreground">Kitten</span>
              </Link>
            </div>
            <div className="px-8 py-4 flex justify-evenly">
              {catCategories.map((cat, index) => (
                <Link 
                  key={index}
                  to={cat.href}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
