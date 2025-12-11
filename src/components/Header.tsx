import { ShoppingCart, Search, Heart, Menu, User, Package, Settings, LogOut, ChevronDown, HelpCircle } from "lucide-react";
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
import { MegaMenu, dogMenuColumns, catMenuColumns } from "@/components/MegaMenu";
import categoryDogs from "@/assets/category-dogs.jpg";
import categoryCats from "@/assets/category-cats.jpg";
export const Header = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | null>(null);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const { cart } = useCart(userId);
  const cartCount = cart.length;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
      if (session?.user?.id) {
        fetchUserName(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
      if (session?.user?.id) {
        setTimeout(() => {
          fetchUserName(session.user.id);
        }, 0);
      } else {
        setUserName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserName = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', id)
      .single();
    
    if (data?.full_name) {
      setUserName(data.full_name);
    }
  };

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
    <header className="sticky top-0 z-50 w-full bg-primary">
      {/* Top Header Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-6">
            {/* Logo */}
            <a href="/" className="flex-shrink-0">
              <img src={paddyLogo} alt="Paddy.vn" className="h-10 w-auto brightness-0 invert" />
            </a>

            {/* Search Bar - Centered */}
            <div className="hidden md:flex flex-1 max-w-lg">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search"
                  className="w-full pr-12 h-11 bg-background text-foreground rounded-md"
                />
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                className="hidden lg:flex items-center gap-1 text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">24/7 Help</span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10"
                  >
                    <User className="h-4 w-4" />
                    <div className="hidden md:flex flex-col items-start text-left">
                      {userId && userName && (
                        <span className="text-xs opacity-80">Hi, {userName.split(' ')[0]}</span>
                      )}
                      <span className="text-sm">
                        {userId ? 'Account' : 'Sign In'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
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

              <Button 
                variant="ghost" 
                className="relative text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10 px-3"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                    {cartCount}
                  </span>
                )}
                <span className="hidden md:inline ml-1 text-sm">Cart</span>
                <ChevronDown className="hidden md:inline h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div 
        className="bg-primary-foreground text-foreground border-t border-border/20 relative"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="container mx-auto px-4">
          <nav className="hidden md:flex h-12 items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-6">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu('dog')}
              >
                Dog
                <ChevronDown className="h-4 w-4" />
              </button>
              <button 
                className="flex items-center gap-1 hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu('cat')}
              >
                Cat
                <ChevronDown className="h-4 w-4" />
              </button>
              <button 
                className="flex items-center gap-1 hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Other Animals
                <ChevronDown className="h-4 w-4" />
              </button>
              <a 
                href="/blog" 
                className="hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Pagazine chăm Boss
              </a>
              <a 
                href="/brands-thuong-hieu-thu-cung" 
                className="hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Thương hiệu
              </a>
              <a 
                href="#" 
                className="hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Today's Deals
              </a>
            </div>
            <div className="text-secondary font-semibold text-sm">
              Free delivery on first-time orders over 500k VND
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden h-12 items-center justify-between">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mega Menus */}
        {activeMegaMenu === 'dog' && (
          <MegaMenu
            columns={dogMenuColumns}
            promoImage={categoryDogs}
            promoTitle="Summer Collection"
            promoSubtitle="Get your pup ready for the sunny days ahead."
            promoBadge="NEW ARRIVALS"
            promoHref="/collections/dog-new-arrivals"
          />
        )}
        {activeMegaMenu === 'cat' && (
          <MegaMenu
            columns={catMenuColumns}
            promoImage={categoryCats}
            promoTitle="Cozy Favorites"
            promoSubtitle="Keep your feline friend comfortable all year."
            promoBadge="BEST SELLERS"
            promoHref="/collections/cat-best-sellers"
          />
        )}
      </div>

      {/* Mobile Search */}
      <div className="md:hidden bg-primary-foreground border-t border-border/20 px-4 py-3">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search"
            className="w-full pr-12 h-10"
          />
          <Button 
            size="icon" 
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-muted rounded-lg py-2 text-center">
            <p className="text-sm font-medium">
              Miễn phí giao hàng cho đơn hàng đầu tiên trên 500.000đ 🎉
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
