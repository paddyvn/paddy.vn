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
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";

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

type MenuSection = "profile" | "addresses" | "orders" | "wishlist";

const menuItems: { key: MenuSection; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Thông tin cá nhân", icon: User },
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

  const activeSection = (searchParams.get("tab") as MenuSection) || "profile";

  const setActiveSection = (section: MenuSection) => {
    if (section === "orders") {
      navigate("/orders");
      return;
    }
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
        <Footer />
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

      <Footer />
    </div>
  );
};

export default Profile;
