import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  Heart, 
  LogOut,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  ShoppingBag,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Loader2,
  PawPrint
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string | null;
  ward: string | null;
  is_default: boolean | null;
}

type OrderStatus = "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  notes: string | null;
  shipping_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    district?: string;
    ward?: string;
  };
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700", icon: Package },
  confirmed: { label: "Đã xác nhận", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  shipped: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-700", icon: Truck },
  delivered: { label: "Đã giao hàng", color: "bg-green-100 text-green-700", icon: PackageCheck },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: XCircle },
};

const ORDER_STEPS: OrderStatus[] = ["pending", "processing", "confirmed", "shipped", "delivered"];

type MenuSection = "profile" | "boss" | "addresses" | "orders" | "wishlist";

const menuItems: { key: MenuSection; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Sen", icon: User },
  { key: "boss", label: "Boss", icon: PawPrint },
  { key: "addresses", label: "Sổ địa chỉ", icon: MapPin },
  { key: "orders", label: "Đơn hàng của tôi", icon: Package },
  { key: "wishlist", label: "Sản phẩm yêu thích", icon: Heart },
];

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const activeSection = (searchParams.get("tab") as MenuSection) || "profile";

  const setActiveSection = (section: MenuSection) => {
    setSearchParams({ tab: section });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId!)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!userId,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Order[]) || [];
    },
    enabled: !!userId,
  });

  const getStatusStep = (status: OrderStatus) => {
    if (status === "cancelled") return -1;
    return ORDER_STEPS.indexOf(status);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setIsEditing(false);
      toast({ title: "Cập nhật thành công", description: "Thông tin cá nhân đã được cập nhật." });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật thông tin.", variant: "destructive" });
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (address: Partial<Address>) => {
      const insertData = {
        full_name: address.full_name!,
        phone: address.phone!,
        address_line1: address.address_line1!,
        address_line2: address.address_line2 || null,
        city: address.city!,
        district: address.district || null,
        ward: address.ward || null,
        user_id: userId!,
      };
      const { error } = await supabase
        .from("addresses")
        .insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setIsAddingAddress(false);
      setNewAddress({});
      toast({ title: "Thêm địa chỉ thành công" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể thêm địa chỉ.", variant: "destructive" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast({ title: "Xóa địa chỉ thành công" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể xóa địa chỉ.", variant: "destructive" });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId!);
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast({ title: "Đã đặt làm địa chỉ mặc định" });
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleEditStart = () => {
    setEditForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleAddAddress = () => {
    if (!newAddress.full_name || !newAddress.phone || !newAddress.address_line1 || !newAddress.city) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    addAddressMutation.mutate(newAddress);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <Skeleton className="h-80 w-64 rounded-xl hidden lg:block" />
            <Skeleton className="h-96 flex-1 rounded-xl" />
          </div>
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Helmet>
        <title>Tài khoản của tôi | Paddy.vn</title>
      </Helmet>

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <Card>
              <CardContent className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{profile?.full_name || "Chưa cập nhật"}</p>
                    <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                </div>

                {/* Menu Items */}
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveSection(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        activeSection === item.key
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Logout */}
                <div className="pt-4 mt-4 border-t">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>Quản lý thông tin cá nhân của bạn</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={handleEditStart} className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="gap-2">
                        <Save className="h-4 w-4" />
                        Lưu
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên</Label>
                      {isEditing ? (
                        <Input
                          id="fullName"
                          value={editForm.full_name || ""}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.full_name || "Chưa cập nhật"}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{profile?.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editForm.phone || ""}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="0912 345 678"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.phone || "Chưa cập nhật"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Boss Section */}
            {activeSection === "boss" && (
              <Card>
                <CardHeader>
                  <CardTitle>Boss</CardTitle>
                  <CardDescription>Quản lý thông tin thú cưng của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có thú cưng nào</p>
                    <p className="text-sm">Thêm thông tin về Boss của bạn</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Addresses Section */}
            {activeSection === "addresses" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Sổ địa chỉ</CardTitle>
                    <CardDescription>Quản lý các địa chỉ giao hàng của bạn</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsAddingAddress(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Address Form */}
                  {isAddingAddress && (
                    <Card className="border-dashed">
                      <CardContent className="p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Họ và tên *</Label>
                            <Input
                              value={newAddress.full_name || ""}
                              onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                              placeholder="Nguyễn Văn A"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Số điện thoại *</Label>
                            <Input
                              value={newAddress.phone || ""}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              placeholder="0912 345 678"
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Địa chỉ *</Label>
                            <Input
                              value={newAddress.address_line1 || ""}
                              onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                              placeholder="Số nhà, tên đường"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phường/Xã</Label>
                            <Input
                              value={newAddress.ward || ""}
                              onChange={(e) => setNewAddress({ ...newAddress, ward: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quận/Huyện</Label>
                            <Input
                              value={newAddress.district || ""}
                              onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tỉnh/Thành phố *</Label>
                            <Input
                              value={newAddress.city || ""}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              placeholder="Hồ Chí Minh"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => { setIsAddingAddress(false); setNewAddress({}); }}>
                            Hủy
                          </Button>
                          <Button onClick={handleAddAddress} disabled={addAddressMutation.isPending}>
                            Lưu địa chỉ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Address List */}
                  {addressesLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : addresses && addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{address.full_name}</span>
                              {address.is_default && (
                                <Badge variant="secondary" className="text-xs">Mặc định</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{address.phone}</p>
                            <p className="text-sm">
                              {address.address_line1}
                              {address.ward && `, ${address.ward}`}
                              {address.district && `, ${address.district}`}
                              {address.city && `, ${address.city}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!address.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDefaultAddressMutation.mutate(address.id)}
                              >
                                Đặt mặc định
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteAddressMutation.mutate(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Bạn chưa có địa chỉ nào</p>
                      <p className="text-sm">Thêm địa chỉ để đặt hàng nhanh hơn</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Orders Section */}
            {activeSection === "orders" && (
              <Card>
                <CardHeader>
                  <CardTitle>Đơn hàng của tôi</CardTitle>
                  <CardDescription>Theo dõi và quản lý đơn hàng</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const statusConfig = STATUS_CONFIG[order.status];
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                          <div
                            key={order.id}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold">#{order.order_number}</span>
                                <Badge className={`${statusConfig.color} hover:${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {order.order_items.length} sản phẩm
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Tổng tiền</p>
                                <p className="text-lg font-bold text-primary">
                                  {formatPrice(order.total)}₫
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <p>Chưa có đơn hàng nào</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!
                      </p>
                      <Button onClick={() => navigate("/")} size="sm">
                        Mua sắm ngay
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wishlist Section */}
            {activeSection === "wishlist" && (
              <Card>
                <CardHeader>
                  <CardTitle>Sản phẩm yêu thích</CardTitle>
                  <CardDescription>Các sản phẩm bạn đã lưu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có sản phẩm yêu thích</p>
                    <p className="text-sm">Lưu sản phẩm yêu thích để mua sau</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Đơn hàng #{selectedOrder.order_number}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Status */}
                <div>
                  <h3 className="font-medium mb-4">Trạng thái đơn hàng</h3>
                  {selectedOrder.status === "cancelled" ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Đơn hàng đã bị hủy</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {ORDER_STEPS.map((step, index) => {
                        const stepConfig = STATUS_CONFIG[step];
                        const StepIcon = stepConfig.icon;
                        const currentStep = getStatusStep(selectedOrder.status);
                        const isCompleted = index <= currentStep;
                        const isCurrent = index === currentStep;
                        
                        return (
                          <div key={step} className="flex flex-col items-center flex-1">
                            <div className="flex items-center w-full">
                              {index > 0 && (
                                <div 
                                  className={`flex-1 h-0.5 ${
                                    index <= currentStep ? "bg-primary" : "bg-muted"
                                  }`}
                                />
                              )}
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-muted-foreground"
                                } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                              >
                                <StepIcon className="h-4 w-4" />
                              </div>
                              {index < ORDER_STEPS.length - 1 && (
                                <div 
                                  className={`flex-1 h-0.5 ${
                                    index < currentStep ? "bg-primary" : "bg-muted"
                                  }`}
                                />
                              )}
                            </div>
                            <span className={`text-xs mt-2 text-center ${
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {stepConfig.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Shipping Address */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ giao hàng
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedOrder.shipping_address.full_name}</p>
                    <p>{selectedOrder.shipping_address.phone}</p>
                    <p>
                      {selectedOrder.shipping_address.address_line1}
                      {selectedOrder.shipping_address.address_line2 && `, ${selectedOrder.shipping_address.address_line2}`}
                    </p>
                    <p>
                      {[
                        selectedOrder.shipping_address.ward,
                        selectedOrder.shipping_address.district,
                        selectedOrder.shipping_address.city
                      ].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h3 className="font-medium mb-3">Sản phẩm</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)}₫ x {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(item.subtotal)}₫</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatPrice(selectedOrder.subtotal)}₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>{formatPrice(selectedOrder.shipping_fee || 0)}₫</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatPrice(selectedOrder.discount)}₫</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPrice(selectedOrder.total)}₫</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Ghi chú</h3>
                      <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>Ngày đặt: {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer hideNewsletter />
    </div>
  );
};

export default Profile;
