import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import heroPets from "@/assets/hero-pets.jpg";

// Placeholder banners - replace with actual promotional images
const banners = [
  { id: 1, image: heroPets, alt: "Seasonal sale - Save on every order" },
  { id: 2, image: heroPets, alt: "Free shipping on orders over 500k VND" },
  { id: 3, image: heroPets, alt: "New arrivals - Premium pet supplies" },
];

export const Hero = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative bg-muted/30">
      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0">
              <img
                src={banner.image}
                alt={banner.alt}
                className="w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-colors"
        aria-label="Previous banner"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-colors"
        aria-label="Next banner"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-foreground/60">
        <ChevronLeft 
          className="h-4 w-4 text-background cursor-pointer hover:opacity-80" 
          onClick={scrollPrev}
        />
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              index === selectedIndex
                ? "bg-background"
                : "bg-background/40 hover:bg-background/60"
            }`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
        <ChevronRight 
          className="h-4 w-4 text-background cursor-pointer hover:opacity-80" 
          onClick={scrollNext}
        />
      </div>
    </section>
  );
};
