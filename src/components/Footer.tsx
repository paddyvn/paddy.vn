import paddyLogo from "@/assets/paddy-logo.avif";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <img src={paddyLogo} alt="Paddy.vn" className="h-12 w-auto brightness-0 invert" />
            <p className="text-sm text-background/80 leading-relaxed">
              Your trusted partner for premium pet supplies. 
              We're dedicated to keeping your furry friends happy and healthy.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-smooth hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-smooth hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Shop All
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Track Order
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Return Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-bold text-lg mb-4">Customer Care</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Pet Care Tips
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-primary transition-smooth">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-background/80">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  76 Hung Thai 1, Tan Phong, District 7, HCMC
                </span>
              </li>
              <li className="flex items-center gap-3 text-background/80 hover:text-primary transition-smooth">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a href="tel:0588112358" className="text-sm">
                  0588 112 358
                </a>
              </li>
              <li className="flex items-center gap-3 text-background/80 hover:text-primary transition-smooth">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a href="mailto:hello@paddy.vn" className="text-sm">
                  hello@paddy.vn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
            <p>© 2024 Paddy.vn. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-smooth">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary transition-smooth">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
