import { ShoppingCart, Search, Heart, Menu, User, Package, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import paddyLogo from "@/assets/paddy-logo.avif";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const { cart } = useCart(userId);
  const cartCount = cart.length;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center transition-smooth hover:opacity-80">
            <img src={paddyLogo} alt="Paddy.vn" className="h-10 w-auto" />
          </a>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-xl md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 h-11 rounded-full border-2 focus-visible:border-primary focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex rounded-full transition-bounce hover:scale-110">
              <Heart className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:inline-flex rounded-full transition-bounce hover:scale-110"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                {userId ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Sign In / Sign Up
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="relative rounded-full transition-bounce hover:scale-110">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in fade-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Button>

            <Button variant="ghost" size="icon" className="md:hidden rounded-full">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex h-14 items-center justify-center gap-8 text-sm font-medium border-t border-border/50">
          <a href="#" className="transition-smooth hover:text-primary relative group">
            Dogs
            <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
          </a>
          <a href="#" className="transition-smooth hover:text-primary relative group">
            Cats
            <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
          </a>
          <a href="#" className="transition-smooth hover:text-primary relative group">
            Food
            <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
          </a>
          <a href="#" className="transition-smooth hover:text-primary relative group">
            Toys
            <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
          </a>
          <a href="#" className="transition-smooth hover:text-primary relative group">
            Accessories
            <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
          </a>
          <a href="#" className="text-secondary transition-smooth hover:text-secondary/80 relative group font-semibold">
            Sale 🎉
            <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-secondary scale-x-0 group-hover:scale-x-100 transition-transform" />
          </a>
        </nav>

        {/* Search Bar - Mobile */}
        <div className="flex md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full pl-9 pr-4 h-10 rounded-full border-2 focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
