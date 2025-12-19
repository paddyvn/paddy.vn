import { Dog, Cat } from "lucide-react";
import { Link } from "react-router-dom";
import { usePetSelectorData } from "@/hooks/usePetSelectorData";
import { Skeleton } from "@/components/ui/skeleton";

export const PetSelector = () => {
  const { data, isLoading } = usePetSelectorData();

  // Fallback data if database is empty
  const fallbackDogCategories = [
    { label: "Dog Food", link: "/category/dog-food" },
    { label: "Treats", link: "/category/dog-treats" },
    { label: "Flea & Worm", link: "/category/flea-worm" },
    { label: "Dog Toys", link: "/category/dog-toys" },
  ];

  const fallbackCatCategories = [
    { label: "Cat Food", link: "/category/cat-food" },
    { label: "Treats", link: "/category/cat-treats" },
    { label: "Cat Toys", link: "/category/cat-toys" },
    { label: "Litter", link: "/category/cat-litter" },
  ];

  if (isLoading) {
    return (
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  // Use database data or fallback
  const dogBlocks = data?.dogBlocks || [];
  const catBlocks = data?.catBlocks || [];
  
  // Get first block's items for quick links (main Dog/Cat block)
  const dogQuickLinks = dogBlocks[0]?.items || fallbackDogCategories;
  const catQuickLinks = catBlocks[0]?.items || fallbackCatCategories;

  const getIcon = (iconType: string | null, size: "large" | "small") => {
    const iconSize = size === "large" ? "w-12 h-12" : "w-10 h-10";
    const containerSize = size === "large" ? "w-16 h-16" : "w-14 h-14";
    
    if (iconType === 'cat') {
      return (
        <div className={`${containerSize} flex items-center justify-center`}>
          <Cat className={`${iconSize} text-foreground`} strokeWidth={1.5} />
        </div>
      );
    }
    return (
      <div className={`${containerSize} flex items-center justify-center`}>
        <Dog className={`${iconSize} text-foreground`} strokeWidth={1.5} />
      </div>
    );
  };

  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dog Section */}
          <div className="bg-background rounded-2xl shadow-card overflow-hidden">
            <div className="flex">
              {dogBlocks.length > 0 ? (
                dogBlocks.map((block, index) => (
                  <Link
                    key={block.id}
                    to={block.link || '/category/dog'}
                    className="flex-1 transition-colors p-6 flex items-center justify-center gap-4 group hover:opacity-90"
                    style={{ backgroundColor: block.background_color || '#F97316' }}
                  >
                    {getIcon(block.icon_type, index === 0 ? 'large' : 'small')}
                    <span className="text-2xl font-bold text-foreground">{block.title}</span>
                  </Link>
                ))
              ) : (
                <>
                  <Link 
                    to="/category/dog" 
                    className="flex-1 bg-amber-400 hover:bg-amber-500 transition-colors p-6 flex items-center justify-center gap-4 group"
                  >
                    {getIcon('dog', 'large')}
                    <span className="text-2xl font-bold text-foreground">Dog</span>
                  </Link>
                  <Link 
                    to="/category/puppy" 
                    className="flex-1 bg-amber-300 hover:bg-amber-400 transition-colors p-6 flex items-center justify-center gap-4 group"
                  >
                    {getIcon('dog', 'small')}
                    <span className="text-2xl font-bold text-foreground">Puppy</span>
                  </Link>
                </>
              )}
            </div>
            <div className="px-8 py-4 flex justify-evenly flex-wrap gap-2">
              {dogQuickLinks.map((item, index) => (
                <Link 
                  key={item.link + index}
                  to={item.link}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Cat Section */}
          <div className="bg-background rounded-2xl shadow-card overflow-hidden">
            <div className="flex">
              {catBlocks.length > 0 ? (
                catBlocks.map((block, index) => (
                  <Link
                    key={block.id}
                    to={block.link || '/category/cat'}
                    className="flex-1 transition-colors p-6 flex items-center justify-center gap-4 group hover:opacity-90"
                    style={{ backgroundColor: block.background_color || '#3B82F6' }}
                  >
                    {getIcon(block.icon_type, index === 0 ? 'large' : 'small')}
                    <span className="text-2xl font-bold text-foreground">{block.title}</span>
                  </Link>
                ))
              ) : (
                <>
                  <Link 
                    to="/category/cat" 
                    className="flex-1 bg-amber-100 hover:bg-amber-200 transition-colors p-6 flex items-center justify-center gap-4 group"
                  >
                    {getIcon('cat', 'large')}
                    <span className="text-2xl font-bold text-foreground">Cat</span>
                  </Link>
                  <Link 
                    to="/category/kitten" 
                    className="flex-1 bg-amber-50 hover:bg-amber-100 transition-colors p-6 flex items-center justify-center gap-4 group"
                  >
                    {getIcon('cat', 'small')}
                    <span className="text-2xl font-bold text-foreground">Kitten</span>
                  </Link>
                </>
              )}
            </div>
            <div className="px-8 py-4 flex justify-evenly flex-wrap gap-2">
              {catQuickLinks.map((item, index) => (
                <Link 
                  key={item.link + index}
                  to={item.link}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
