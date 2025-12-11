import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroPets from "@/assets/hero-pets.jpg";

const slides = [
  {
    headline: "'Tis the season to",
    headlineBold: "save on every order.",
    bullets: [
      { prefix: "Save 35%", text: " on your first AutoShip order." },
      { prefix: "Save 5%", text: " on all ongoing AutoShip orders." },
    ],
    note: "Pause, skip, or cancel anytime.",
    promoCode: "SAVE35",
    terms: "Terms and Exclusions Apply.\nMax savings $20. Expires 12/31/25.",
    image: heroPets,
  },
  {
    headline: "Everything Your",
    headlineBold: "Furry Friends Need",
    bullets: [
      { prefix: "Free shipping", text: " on orders over 500k VND." },
      { prefix: "10,000+", text: " happy pets served." },
    ],
    note: "Quality products, fast delivery.",
    promoCode: "WELCOME",
    terms: "New customers only.\nMinimum order 1M VND required.",
    image: heroPets,
  },
  {
    headline: "Premium Pet",
    headlineBold: "Supplies & Food",
    bullets: [
      { prefix: "5,000+", text: " products available." },
      { prefix: "Fast delivery", text: " across Vietnam." },
    ],
    note: "Because your pets deserve the best!",
    promoCode: "PETLOVE",
    terms: "Valid for all categories.\nCannot combine with other offers.",
    image: heroPets,
  },
];

export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative bg-muted/50">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center min-h-[400px]">
          {/* Content */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-foreground">
              {slide.headline}
              <span className="block font-bold mt-1">{slide.headlineBold}</span>
            </h1>
            
            <div className="space-y-1 text-base md:text-lg text-foreground">
              {slide.bullets.map((bullet, index) => (
                <p key={index}>
                  <span className="font-bold">{bullet.prefix}</span>
                  {bullet.text}
                </p>
              ))}
              <p>{slide.note}</p>
            </div>
            
            <p className="text-primary font-medium">
              Use Code: <span className="font-bold">{slide.promoCode}</span>
            </p>
            
            <Button 
              size="lg" 
              className="w-fit px-12 rounded-full bg-primary hover:bg-primary/90"
            >
              Shop Now
            </Button>
            
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {slide.terms}
            </p>
          </div>

          {/* Image */}
          <div className="flex justify-center lg:justify-end">
            <img 
              src={slide.image} 
              alt="Happy pet" 
              className="w-full max-w-md lg:max-w-lg h-auto object-contain"
            />
          </div>
        </div>

        {/* Carousel Navigation */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={prevSlide}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide 
                  ? "bg-foreground" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
          
          <button
            onClick={nextSlide}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
