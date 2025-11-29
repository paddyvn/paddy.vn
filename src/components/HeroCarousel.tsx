import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import heroPets from "@/assets/hero-pets.jpg";

const slides = [
  {
    title: "Year-end deals",
    subtitle: "Up to 40% off",
    description: "Toys, treats & more.",
    image: heroPets,
  },
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <section className="relative bg-primary overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="text-primary-foreground z-10">
            <p className="text-lg mb-2 font-medium">{slides[currentSlide].title}</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
              {slides[currentSlide].subtitle}
            </h1>
            <p className="text-xl mb-8">{slides[currentSlide].description}</p>
            <Button 
              size="lg" 
              className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 h-12 font-semibold"
            >
              Shop now
            </Button>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={slides[currentSlide].image}
                alt="Happy pets"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-smooth z-20"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg transition-smooth z-20"
        >
          <ChevronRight className="h-6 w-6 text-foreground" />
        </button>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-smooth ${
                index === currentSlide ? "w-8 bg-background" : "w-2 bg-background/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
