import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroPets from "@/assets/hero-pets.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-soft">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Content */}
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-secondary/20 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm border border-secondary/30 animate-in fade-in slide-in-from-left delay-100">
              <Sparkles className="h-4 w-4 text-secondary" />
              New arrivals every week
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-left delay-200">
              Everything Your
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                Furry Friends Need
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl animate-in fade-in slide-in-from-left delay-300">
              Premium pet supplies, toys, and food delivered fast across Vietnam. 
              Because your pets deserve the best! 🐾
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-left delay-500">
              <Button size="lg" className="text-base h-12 px-8 rounded-full transition-bounce hover:scale-105 shadow-soft hover:shadow-hover group">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base h-12 px-8 rounded-full border-2 transition-bounce hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                View Categories
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4 animate-in fade-in slide-in-from-left delay-700">
              <div>
                <p className="text-2xl font-bold text-foreground">10,000+</p>
                <p className="text-sm text-muted-foreground">Happy Pets</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-foreground">5,000+</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-foreground">Fast</p>
                <p className="text-sm text-muted-foreground">Delivery</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-in fade-in zoom-in duration-700 delay-300">
            <div className="relative rounded-3xl overflow-hidden shadow-card hover:shadow-hover transition-smooth">
              <img 
                src={heroPets} 
                alt="Happy pets with toys" 
                className="w-full h-auto object-cover aspect-square lg:aspect-auto"
              />
              
              {/* Floating Badge */}
              <div className="absolute top-6 right-6 rounded-2xl bg-secondary px-4 py-3 shadow-lg backdrop-blur-sm animate-in fade-in zoom-in delay-1000">
                <p className="text-sm font-semibold text-secondary-foreground">Free Shipping</p>
                <p className="text-xs text-secondary-foreground/80">Orders over 500k VND</p>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-secondary/20 blur-2xl animate-pulse delay-300" />
          </div>
        </div>
      </div>
    </section>
  );
};
