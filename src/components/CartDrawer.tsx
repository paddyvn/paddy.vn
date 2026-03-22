import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CartDrawerProps {
  userId?: string;
  trigger: React.ReactNode;
}

export const CartDrawer = ({ userId, trigger }: CartDrawerProps) => {
  const { cart, isLoading, removeFromCart, updateQuantity, isRemoving } = useCart(userId);
  const navigate = useNavigate();

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }> | undefined) => {
    if (!images || images.length === 0) {
      return "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100&h=100&fit=crop";
    }
    const primary = images.find(img => img.is_primary);
    return primary?.image_url || images[0]?.image_url;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.product_variants?.price || item.products?.base_price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Giỏ hàng ({cart.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Giỏ hàng trống</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Hãy thêm sản phẩm yêu thích vào giỏ hàng
              </p>
              <SheetTrigger asChild>
                <Button onClick={() => navigate('/')}>
                  Tiếp tục mua sắm
                </Button>
              </SheetTrigger>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const price = item.product_variants?.price || item.products?.base_price || 0;
                const productImages = item.products?.product_images;
                
                return (
                  <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <img
                      src={getPrimaryImage(productImages)}
                      alt={item.products?.name || 'Product'}
                      className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/products/${item.products?.slug}`)}
                      >
                        {item.products?.name}
                      </h4>
                      {item.product_variants?.name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.product_variants.name}
                        </p>
                      )}
                      <p className="text-primary font-semibold mt-1">
                        {formatPrice(price)}₫
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity({ cartItemId: item.id, quantity: item.quantity - 1 });
                              }
                            }}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity({ cartItemId: item.id, quantity: item.quantity + 1 })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tạm tính:</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(calculateTotal())}₫
              </span>
            </div>
            <Button className="w-full" size="lg" onClick={() => navigate('/thanh-toan')}>
              Thanh toán
            </Button>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full" onClick={() => navigate('/gio-hang')}>
                Xem giỏ hàng
              </Button>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
