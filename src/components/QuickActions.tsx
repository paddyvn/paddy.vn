import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Truck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const QuickActions = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user?.id) fetchName(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user?.id) fetchName(session.user.id);
      else setUserName(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchName = async (id: string) => {
    const { data } = await supabase.from("profiles").select("full_name").eq("id", id).single();
    if (data?.full_name) setUserName(data.full_name);
  };

  return (
    <section className="container mx-auto px-4">
      <div className="flex items-center bg-muted/30 rounded-xl my-2.5 py-3 px-6 gap-6">
        {/* Greeting */}
        <div className="flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <>
              <span className="text-lg font-extrabold text-foreground">
                Xin chào, {userName?.split(" ")[0] || "bạn"}!
              </span>
              <Link to="/orders" className="text-sm font-semibold text-primary hover:underline">
                Đơn hàng
              </Link>
            </>
          ) : (
            <>
              <span className="text-base md:text-lg font-extrabold text-foreground">Xin chào!</span>
              <Link
                to="/auth"
                className="text-sm font-bold text-primary-foreground bg-primary px-5 py-1.5 rounded-full hover:bg-primary/85 transition-smooth whitespace-nowrap"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border shrink-0" />

        {/* Value prop 1 */}
        <Link to="/pages/uu-dai-tich-luy-thanh-vien-paddier" className="flex items-center gap-3 flex-1 p-1 rounded-lg hover:bg-muted/40 transition-smooth no-underline">
          <Star className="h-7 w-7 text-primary shrink-0" />
          <div>
            <span className="block text-sm font-bold text-foreground leading-tight">Tiết kiệm đến 25%</span>
            <span className="block text-xs font-semibold text-primary">Thành viên Paddier</span>
          </div>
        </Link>

        {/* Divider */}
        <div className="w-px h-8 bg-border shrink-0" />

        {/* Value prop 2 */}
        <Link to="/pages/chinh-sach-van-chuyen" className="flex items-center gap-3 flex-1 p-1 rounded-lg hover:bg-muted/40 transition-smooth no-underline">
          <Truck className="h-7 w-7 text-primary shrink-0" />
          <div>
            <span className="block text-sm font-bold text-foreground leading-tight">Freeship đơn từ 500K</span>
            <span className="block text-xs font-semibold text-primary">Giao hàng toàn quốc</span>
          </div>
        </Link>

        {/* Divider - hidden on mobile */}
        <div className="w-px h-8 bg-border shrink-0 hidden md:block" />

        {/* Value prop 3 - hidden on mobile */}
        <Link to="/pages/chinh-sach-van-chuyen" className="hidden md:flex items-center gap-3 flex-1 p-1 rounded-lg hover:bg-muted/40 transition-smooth no-underline">
          <Clock className="h-7 w-7 text-primary shrink-0" />
          <div>
            <span className="block text-sm font-bold text-foreground leading-tight">Giao nhanh 2H</span>
            <span className="block text-xs font-semibold text-primary">Nội thành HCM</span>
          </div>
        </Link>
      </div>
    </section>
  );
};