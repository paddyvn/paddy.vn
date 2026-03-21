import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  PawPrint,
  CalendarIcon,
  Ticket,
  Gift,
  Star,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { formatPrice, cn } from "@/lib/utils";
import { format, differenceInMonths, differenceInYears } from "date-fns";
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

interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string | null;
  age_years: number | null;
  age_months: number | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
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

type MenuSection = "profile" | "addresses" | "rewards" | "orders" | "vouchers" | "wishlist";

const menuItems: { key: MenuSection; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Sen & Boss", icon: User },
  { key: "addresses", label: "Sổ địa chỉ", icon: MapPin },
  { key: "rewards", label: "Điểm thưởng", icon: Gift },
  { key: "orders", label: "Đơn hàng của tôi", icon: Package },
  { key: "vouchers", label: "Mã giảm giá của tôi", icon: Ticket },
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
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editAddressForm, setEditAddressForm] = useState<Partial<Address>>({});
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [newPet, setNewPet] = useState<Partial<Pet>>({ species: "dog" });
  const [petBirthday, setPetBirthday] = useState<Date | undefined>(undefined);
  const [petPhotoFile, setPetPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editPetForm, setEditPetForm] = useState<Partial<Pet>>({});
  const [editPetBirthday, setEditPetBirthday] = useState<Date | undefined>(undefined);
  const [editPetPhotoFile, setEditPetPhotoFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Pet[];
    },
    enabled: !!userId,
  });

  // Fetch user saved vouchers with full voucher details
  const { data: savedVouchers, isLoading: savedVouchersLoading } = useQuery({
    queryKey: ["saved-vouchers-full", userId],
    queryFn: async () => {
      // First get saved voucher IDs
      const { data: savedData, error: savedError } = await supabase
        .from("user_saved_vouchers")
        .select("promotion_id")
        .eq("user_id", userId!);

      if (savedError) throw savedError;
      if (!savedData || savedData.length === 0) return [];

      const promotionIds = savedData.map((d) => d.promotion_id);

      // Then fetch the voucher details
      const { data: vouchers, error: vouchersError } = await supabase
        .from("promotions")
        .select("*")
        .in("id", promotionIds)
        .eq("program_kind", "voucher");

      if (vouchersError) throw vouchersError;
      return vouchers || [];
    },
    enabled: !!userId,
  });

  const getStatusStep = (status: OrderStatus) => {
    if (status === "cancelled") return -1;
    return ORDER_STEPS.indexOf(status);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile> & { avatarFile?: File }) => {
      let avatarUrl = updates.avatar_url;
      
      if (updates.avatarFile) {
        setUploadingAvatar(true);
        const fileExt = updates.avatarFile.name.split('.').pop();
        const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(fileName, updates.avatarFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
        setUploadingAvatar(false);
      }
      
      const { avatarFile: _, ...updateData } = updates;
      const { error } = await supabase
        .from("profiles")
        .update({ ...updateData, avatar_url: avatarUrl })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setIsEditing(false);
      setAvatarFile(null);
      toast({ title: "Cập nhật thành công", description: "Thông tin Sen đã được cập nhật." });
    },
    onError: () => {
      setUploadingAvatar(false);
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

  const updateAddressMutation = useMutation({
    mutationFn: async (address: Partial<Address> & { id: string }) => {
      const { error } = await supabase
        .from("addresses")
        .update({
          full_name: address.full_name!,
          phone: address.phone!,
          address_line1: address.address_line1!,
          address_line2: address.address_line2 || null,
          city: address.city!,
          district: address.district || null,
          ward: address.ward || null,
        })
        .eq("id", address.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setEditingAddress(null);
      setEditAddressForm({});
      toast({ title: "Cập nhật địa chỉ thành công" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật địa chỉ.", variant: "destructive" });
    },
  });

  const addPetMutation = useMutation({
    mutationFn: async (pet: Partial<Pet> & { photoFile?: File }) => {
      let photoUrl: string | null = null;
      
      if (pet.photoFile) {
        setUploadingPhoto(true);
        const fileExt = pet.photoFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(fileName, pet.photoFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
        setUploadingPhoto(false);
      }
      
      const { error } = await supabase
        .from("pets")
        .insert({
          user_id: userId!,
          name: pet.name!,
          species: pet.species!,
          breed: pet.breed || null,
          age_years: pet.age_years || null,
          age_months: pet.age_months || null,
          photo_url: photoUrl,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets", userId] });
      setIsAddingPet(false);
      setNewPet({ species: "dog" });
      setPetBirthday(undefined);
      setPetPhotoFile(null);
      toast({ title: "Thêm Boss thành công!" });
    },
    onError: () => {
      setUploadingPhoto(false);
      toast({ title: "Lỗi", description: "Không thể thêm Boss.", variant: "destructive" });
    },
  });

  const deletePetMutation = useMutation({
    mutationFn: async (petId: string) => {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets", userId] });
      toast({ title: "Xóa Boss thành công" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể xóa Boss.", variant: "destructive" });
    },
  });

  const updatePetMutation = useMutation({
    mutationFn: async (pet: Partial<Pet> & { photoFile?: File }) => {
      if (!editingPet) return;
      
      let photoUrl = editingPet.photo_url;
      
      if (pet.photoFile) {
        setUploadingPhoto(true);
        const fileExt = pet.photoFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(fileName, pet.photoFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
        setUploadingPhoto(false);
      }
      
      const { error } = await supabase
        .from("pets")
        .update({
          name: pet.name!,
          species: pet.species!,
          breed: pet.breed || null,
          age_years: pet.age_years || null,
          age_months: pet.age_months || null,
          photo_url: photoUrl,
        })
        .eq("id", editingPet.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets", userId] });
      setEditingPet(null);
      setEditPetForm({});
      setEditPetBirthday(undefined);
      setEditPetPhotoFile(null);
      toast({ title: "Cập nhật Boss thành công!" });
    },
    onError: () => {
      setUploadingPhoto(false);
      toast({ title: "Lỗi", description: "Không thể cập nhật Boss.", variant: "destructive" });
    },
  });

  const handleAddPet = () => {
    if (!newPet.name || !newPet.species) {
      toast({ title: "Vui lòng điền tên và loại thú cưng", variant: "destructive" });
      return;
    }
    
    // Calculate age from birthday
    let age_years: number | undefined;
    let age_months: number | undefined;
    if (petBirthday) {
      const now = new Date();
      age_years = differenceInYears(now, petBirthday);
      age_months = differenceInMonths(now, petBirthday) % 12;
    }
    
    addPetMutation.mutate({ 
      ...newPet, 
      age_years, 
      age_months, 
      photoFile: petPhotoFile || undefined 
    });
  };

  const handleEditPet = () => {
    if (!editPetForm.name || !editPetForm.species) {
      toast({ title: "Vui lòng điền tên và loại thú cưng", variant: "destructive" });
      return;
    }
    
    // Calculate age from birthday
    let age_years: number | undefined;
    let age_months: number | undefined;
    if (editPetBirthday) {
      const now = new Date();
      age_years = differenceInYears(now, editPetBirthday);
      age_months = differenceInMonths(now, editPetBirthday) % 12;
    }
    
    updatePetMutation.mutate({ 
      ...editPetForm, 
      age_years, 
      age_months, 
      photoFile: editPetPhotoFile || undefined 
    });
  };

  const startEditingPet = (pet: Pet) => {
    setEditingPet(pet);
    setEditPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || undefined,
    });
    // Calculate birthday from age if available
    if (pet.age_years || pet.age_months) {
      const now = new Date();
      const totalMonths = (pet.age_years || 0) * 12 + (pet.age_months || 0);
      const birthday = new Date(now.setMonth(now.getMonth() - totalMonths));
      setEditPetBirthday(birthday);
    } else {
      setEditPetBirthday(undefined);
    }
    setEditPetPhotoFile(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleEditStart = () => {
    setEditForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || "",
    });
    setAvatarFile(null);
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ ...editForm, avatarFile: avatarFile || undefined });
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
              <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Thông tin Sen</CardTitle>
                    <CardDescription>Quản lý thông tin Sen của bạn</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={handleEditStart} className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setAvatarFile(null); }}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending || uploadingAvatar} className="gap-2">
                        {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Lưu
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4 pb-4 border-b">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl">{getInitials(profile?.full_name)}</AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                          <Edit2 className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setAvatarFile(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {isEditing && avatarFile && (
                      <p className="text-sm text-muted-foreground">Ảnh mới: {avatarFile.name}</p>
                    )}
                  </div>
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

              {/* Boss Section - within Sen & Boss page */}
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Boss</CardTitle>
                      <CardDescription>Quản lý thông tin thú cưng của bạn</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setIsAddingPet(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Thêm Boss
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  {/* Add Pet Form */}
                  {isAddingPet && (
                    <Card className="border-dashed">
                      <CardContent className="p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Tên Boss *</Label>
                            <Input
                              value={newPet.name || ""}
                              onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                              placeholder="Milu"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Loại thú cưng *</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={newPet.species === "dog" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNewPet({ ...newPet, species: "dog" })}
                              >
                                🐕 Chó
                              </Button>
                              <Button
                                type="button"
                                variant={newPet.species === "cat" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNewPet({ ...newPet, species: "cat" })}
                              >
                                🐈 Mèo
                              </Button>
                              <Button
                                type="button"
                                variant={newPet.species === "other" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNewPet({ ...newPet, species: "other" })}
                              >
                                🐾 Khác
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Giống</Label>
                            <Select
                              value={newPet.breed === "custom" || (newPet.breed && !["Poodle", "Corgi", "Golden Retriever", "Labrador", "Husky", "Shiba Inu", "Phốc Sóc", "Chihuahua", "Beagle", "Bulldog", "Chó ta", "Mèo Anh lông ngắn", "Mèo Anh lông dài", "Mèo Ba Tư", "Mèo Munchkin", "Mèo Scottish Fold", "Mèo Bengal", "Mèo Ragdoll", "Mèo Siamese", "Mèo Maine Coon", "Mèo ta"].includes(newPet.breed)) ? "custom" : (newPet.breed || "")}
                              onValueChange={(value) => {
                                if (value === "custom") {
                                  setNewPet({ ...newPet, breed: "custom" });
                                } else {
                                  setNewPet({ ...newPet, breed: value });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn giống..." />
                              </SelectTrigger>
                              <SelectContent>
                                {newPet.species === "dog" ? (
                                  <>
                                    <SelectItem value="Poodle">Poodle</SelectItem>
                                    <SelectItem value="Corgi">Corgi</SelectItem>
                                    <SelectItem value="Golden Retriever">Golden Retriever</SelectItem>
                                    <SelectItem value="Labrador">Labrador</SelectItem>
                                    <SelectItem value="Husky">Husky</SelectItem>
                                    <SelectItem value="Shiba Inu">Shiba Inu</SelectItem>
                                    <SelectItem value="Phốc Sóc">Phốc Sóc</SelectItem>
                                    <SelectItem value="Chihuahua">Chihuahua</SelectItem>
                                    <SelectItem value="Beagle">Beagle</SelectItem>
                                    <SelectItem value="Bulldog">Bulldog</SelectItem>
                                    <SelectItem value="Chó ta">Chó ta</SelectItem>
                                    <SelectItem value="custom">Khác (nhập tên giống)</SelectItem>
                                  </>
                                ) : newPet.species === "cat" ? (
                                  <>
                                    <SelectItem value="Mèo Anh lông ngắn">Mèo Anh lông ngắn</SelectItem>
                                    <SelectItem value="Mèo Anh lông dài">Mèo Anh lông dài</SelectItem>
                                    <SelectItem value="Mèo Ba Tư">Mèo Ba Tư</SelectItem>
                                    <SelectItem value="Mèo Munchkin">Mèo Munchkin</SelectItem>
                                    <SelectItem value="Mèo Scottish Fold">Mèo Scottish Fold</SelectItem>
                                    <SelectItem value="Mèo Bengal">Mèo Bengal</SelectItem>
                                    <SelectItem value="Mèo Ragdoll">Mèo Ragdoll</SelectItem>
                                    <SelectItem value="Mèo Siamese">Mèo Siamese</SelectItem>
                                    <SelectItem value="Mèo Maine Coon">Mèo Maine Coon</SelectItem>
                                    <SelectItem value="Mèo ta">Mèo ta</SelectItem>
                                    <SelectItem value="custom">Khác (nhập tên giống)</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="custom">Khác (nhập tên giống)</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            {(newPet.breed === "custom" || (newPet.breed && !["Poodle", "Corgi", "Golden Retriever", "Labrador", "Husky", "Shiba Inu", "Phốc Sóc", "Chihuahua", "Beagle", "Bulldog", "Chó ta", "Mèo Anh lông ngắn", "Mèo Anh lông dài", "Mèo Ba Tư", "Mèo Munchkin", "Mèo Scottish Fold", "Mèo Bengal", "Mèo Ragdoll", "Mèo Siamese", "Mèo Maine Coon", "Mèo ta", "custom"].includes(newPet.breed))) && (
                              <Input
                                className="mt-2"
                                value={newPet.breed === "custom" ? "" : newPet.breed || ""}
                                onChange={(e) => setNewPet({ ...newPet, breed: e.target.value || "custom" })}
                                placeholder="Nhập tên giống..."
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Ngày sinh</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !petBirthday && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {petBirthday ? format(petBirthday, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày sinh..."}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={petBirthday}
                                  onSelect={setPetBirthday}
                                  disabled={(date) => date > new Date() || date < new Date("1990-01-01")}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            {petBirthday && (
                              <p className="text-xs text-muted-foreground">
                                Tuổi: {differenceInYears(new Date(), petBirthday)} năm {differenceInMonths(new Date(), petBirthday) % 12} tháng
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Ảnh Boss</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setPetPhotoFile(e.target.files?.[0] || null)}
                            />
                            {petPhotoFile && (
                              <p className="text-sm text-muted-foreground">
                                Đã chọn: {petPhotoFile.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => { setIsAddingPet(false); setNewPet({ species: "dog" }); setPetPhotoFile(null); }}>
                            Hủy
                          </Button>
                          <Button onClick={handleAddPet} disabled={addPetMutation.isPending || uploadingPhoto}>
                            {uploadingPhoto ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang tải ảnh...
                              </>
                            ) : addPetMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang lưu...
                              </>
                            ) : (
                              "Thêm Boss"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pet List */}
                  {petsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pets && pets.length > 0 ? (
                    <div className="grid gap-4">
                      {pets.map((pet) => (
                        <div
                          key={pet.id}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <PawPrint className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">{pet.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {pet.species === "dog" ? "🐕 Chó" : pet.species === "cat" ? "🐈 Mèo" : "🐾 Khác"}
                              </Badge>
                            </div>
                            {pet.breed && (
                              <p className="text-sm text-muted-foreground">{pet.breed}</p>
                            )}
                            {(pet.age_years || pet.age_months) && (
                              <p className="text-sm text-muted-foreground">
                                {pet.age_years ? `${pet.age_years} tuổi` : ""}
                                {pet.age_years && pet.age_months ? " " : ""}
                                {pet.age_months ? `${pet.age_months} tháng` : ""}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditingPet(pet)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : !isAddingPet ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có Boss nào</p>
                      <p className="text-sm">Thêm thông tin về Boss của bạn</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              </div>

              {/* Edit Pet Dialog */}
              <Dialog open={!!editingPet} onOpenChange={(open) => !open && setEditingPet(null)}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa Boss</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tên Boss *</Label>
                        <Input
                          value={editPetForm.name || ""}
                          onChange={(e) => setEditPetForm({ ...editPetForm, name: e.target.value })}
                          placeholder="Tên thú cưng"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Loại *</Label>
                        <Select
                          value={editPetForm.species || ""}
                          onValueChange={(value) => setEditPetForm({ ...editPetForm, species: value, breed: undefined })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">🐕 Chó</SelectItem>
                            <SelectItem value="cat">🐈 Mèo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Giống</Label>
                        <Select
                          value={editPetForm.breed === "custom" || (editPetForm.breed && !["Poodle", "Corgi", "Golden Retriever", "Labrador", "Husky", "Shiba Inu", "Phốc Sóc", "Chihuahua", "Beagle", "Bulldog", "Chó ta", "Mèo Anh lông ngắn", "Mèo Anh lông dài", "Mèo Ba Tư", "Mèo Munchkin", "Mèo Scottish Fold", "Mèo Bengal", "Mèo Ragdoll", "Mèo Siamese", "Mèo Maine Coon", "Mèo ta"].includes(editPetForm.breed)) ? "custom" : (editPetForm.breed || "")}
                          onValueChange={(value) => {
                            if (value === "custom") {
                              setEditPetForm({ ...editPetForm, breed: "custom" });
                            } else {
                              setEditPetForm({ ...editPetForm, breed: value });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giống..." />
                          </SelectTrigger>
                          <SelectContent>
                            {editPetForm.species === "dog" ? (
                              <>
                                <SelectItem value="Poodle">Poodle</SelectItem>
                                <SelectItem value="Corgi">Corgi</SelectItem>
                                <SelectItem value="Golden Retriever">Golden Retriever</SelectItem>
                                <SelectItem value="Labrador">Labrador</SelectItem>
                                <SelectItem value="Husky">Husky</SelectItem>
                                <SelectItem value="Shiba Inu">Shiba Inu</SelectItem>
                                <SelectItem value="Phốc Sóc">Phốc Sóc</SelectItem>
                                <SelectItem value="Chihuahua">Chihuahua</SelectItem>
                                <SelectItem value="Beagle">Beagle</SelectItem>
                                <SelectItem value="Bulldog">Bulldog</SelectItem>
                                <SelectItem value="Chó ta">Chó ta</SelectItem>
                                <SelectItem value="custom">Khác (nhập tên giống)</SelectItem>
                              </>
                            ) : editPetForm.species === "cat" ? (
                              <>
                                <SelectItem value="Mèo Anh lông ngắn">Mèo Anh lông ngắn</SelectItem>
                                <SelectItem value="Mèo Anh lông dài">Mèo Anh lông dài</SelectItem>
                                <SelectItem value="Mèo Ba Tư">Mèo Ba Tư</SelectItem>
                                <SelectItem value="Mèo Munchkin">Mèo Munchkin</SelectItem>
                                <SelectItem value="Mèo Scottish Fold">Mèo Scottish Fold</SelectItem>
                                <SelectItem value="Mèo Bengal">Mèo Bengal</SelectItem>
                                <SelectItem value="Mèo Ragdoll">Mèo Ragdoll</SelectItem>
                                <SelectItem value="Mèo Siamese">Mèo Siamese</SelectItem>
                                <SelectItem value="Mèo Maine Coon">Mèo Maine Coon</SelectItem>
                                <SelectItem value="Mèo ta">Mèo ta</SelectItem>
                                <SelectItem value="custom">Khác (nhập tên giống)</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="custom">Khác (nhập tên giống)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {(editPetForm.breed === "custom" || (editPetForm.breed && !["Poodle", "Corgi", "Golden Retriever", "Labrador", "Husky", "Shiba Inu", "Phốc Sóc", "Chihuahua", "Beagle", "Bulldog", "Chó ta", "Mèo Anh lông ngắn", "Mèo Anh lông dài", "Mèo Ba Tư", "Mèo Munchkin", "Mèo Scottish Fold", "Mèo Bengal", "Mèo Ragdoll", "Mèo Siamese", "Mèo Maine Coon", "Mèo ta", "custom"].includes(editPetForm.breed))) && (
                          <Input
                            className="mt-2"
                            value={editPetForm.breed === "custom" ? "" : editPetForm.breed || ""}
                            onChange={(e) => setEditPetForm({ ...editPetForm, breed: e.target.value || "custom" })}
                            placeholder="Nhập tên giống..."
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Ngày sinh</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !editPetBirthday && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editPetBirthday ? format(editPetBirthday, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày sinh..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={editPetBirthday}
                              onSelect={setEditPetBirthday}
                              disabled={(date) => date > new Date() || date < new Date("1990-01-01")}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        {editPetBirthday && (
                          <p className="text-xs text-muted-foreground">
                            Tuổi: {differenceInYears(new Date(), editPetBirthday)} năm {differenceInMonths(new Date(), editPetBirthday) % 12} tháng
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Ảnh Boss</Label>
                        {editingPet?.photo_url && !editPetPhotoFile && (
                          <div className="mb-2">
                            <img src={editingPet.photo_url} alt="Current" className="w-20 h-20 rounded-lg object-cover" />
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditPetPhotoFile(e.target.files?.[0] || null)}
                        />
                        {editPetPhotoFile && (
                          <p className="text-xs text-muted-foreground">Ảnh mới: {editPetPhotoFile.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (editingPet) {
                            deletePetMutation.mutate(editingPet.id);
                            setEditingPet(null);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa Boss
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditingPet(null)}>
                          Hủy
                        </Button>
                        <Button onClick={handleEditPet} disabled={updatePetMutation.isPending || uploadingPhoto}>
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang tải ảnh...
                            </>
                          ) : updatePetMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang lưu...
                            </>
                          ) : (
                            "Lưu thay đổi"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </>
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
                              onClick={() => {
                                setEditingAddress(address);
                                setEditAddressForm(address);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
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

              {/* Edit Address Dialog */}
              <Dialog open={!!editingAddress} onOpenChange={(open) => !open && setEditingAddress(null)}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa địa chỉ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Họ và tên *</Label>
                        <Input
                          value={editAddressForm.full_name || ""}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, full_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Số điện thoại *</Label>
                        <Input
                          value={editAddressForm.phone || ""}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Địa chỉ *</Label>
                        <Input
                          value={editAddressForm.address_line1 || ""}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, address_line1: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phường/Xã</Label>
                        <Input
                          value={editAddressForm.ward || ""}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, ward: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quận/Huyện</Label>
                        <Input
                          value={editAddressForm.district || ""}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, district: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tỉnh/Thành phố *</Label>
                        <Input
                          value={editAddressForm.city || ""}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, city: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingAddress(null)}>
                        Hủy
                      </Button>
                      <Button
                        onClick={() => {
                          if (!editAddressForm.full_name || !editAddressForm.phone || !editAddressForm.address_line1 || !editAddressForm.city) {
                            toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
                            return;
                          }
                          updateAddressMutation.mutate({ ...editAddressForm, id: editingAddress!.id } as Partial<Address> & { id: string });
                        }}
                        disabled={updateAddressMutation.isPending}
                      >
                        {updateAddressMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Rewards Section */}
            {activeSection === "rewards" && (
              <div className="space-y-6">
                {/* Points Summary Card */}
                <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <Crown className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Điểm thưởng hiện có</p>
                          <p className="text-3xl font-bold text-primary">0</p>
                          <p className="text-xs text-muted-foreground">= 0đ giá trị quy đổi</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          <Star className="h-3 w-3 mr-1" />
                          Thành viên
                        </Badge>
                        <p className="text-xs text-muted-foreground">Hạng thành viên</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Điểm đã tích lũy</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">0</p>
                      <p className="text-xs text-muted-foreground">Điểm đã sử dụng</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-500">0</p>
                      <p className="text-xs text-muted-foreground">Điểm sắp hết hạn</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-secondary">0</p>
                      <p className="text-xs text-muted-foreground">Quà đã nhận</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Rewards History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lịch sử điểm thưởng</CardTitle>
                    <CardDescription>Theo dõi điểm tích lũy và sử dụng</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có lịch sử điểm thưởng</p>
                      <p className="text-sm mb-4">Mua sắm để tích lũy điểm thưởng</p>
                      <Button onClick={() => navigate("/")} size="sm">
                        Mua sắm ngay
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Gifts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quà tặng có thể đổi</CardTitle>
                    <CardDescription>Sử dụng điểm để đổi quà hấp dẫn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có quà tặng</p>
                      <p className="text-sm">Tích lũy thêm điểm để đổi quà</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                            onClick={() => navigate(`/orders/${order.order_number}`)}
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

            {/* Vouchers Section */}
            {activeSection === "vouchers" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mã giảm giá của tôi</CardTitle>
                  <CardDescription>Các mã giảm giá bạn đã lưu</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedVouchersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : savedVouchers && savedVouchers.length > 0 ? (
                    <div className="space-y-4">
                      {savedVouchers.map((voucher: any) => {
                        const discountType = voucher.discount_type || "percentage";
                        const discountValue = voucher.discount_value || 0;
                        const minOrderValue = voucher.min_order_value || 0;
                        const maxDiscount = voucher.max_discount;
                        const usageLimit = voucher.usage_limit || 0;
                        const usedCount = voucher.used_count || 0;
                        const usagePercent = usageLimit > 0 ? Math.min(100, Math.round((usedCount / usageLimit) * 100)) : 0;
                        const remaining = usageLimit > 0 ? usageLimit - usedCount : null;
                        
                        const now = new Date();
                        const endDate = voucher.end_date ? new Date(voucher.end_date) : null;
                        const isExpired = endDate && endDate < now;
                        const isFullyUsed = usageLimit > 0 && usedCount >= usageLimit;
                        const isAvailable = voucher.is_active && !isExpired && !isFullyUsed;

                        const getDiscountText = () => {
                          if (discountType === "percentage") {
                            return `Giảm ${discountValue}%`;
                          } else {
                            return `Giảm ${formatPrice(discountValue)}đ`;
                          }
                        };

                        const getConditionText = () => {
                          const conditions: string[] = [];
                          if (minOrderValue > 0) {
                            conditions.push(`Đơn tối thiểu ${formatPrice(minOrderValue)}đ`);
                          }
                          if (maxDiscount && discountType === "percentage") {
                            conditions.push(`Giảm tối đa ${formatPrice(maxDiscount)}đ`);
                          }
                          return conditions.length > 0 ? conditions.join(" · ") : "Áp dụng cho tất cả sản phẩm";
                        };

                        return (
                          <div
                            key={voucher.id}
                            className={cn(
                              "relative border rounded-lg p-4 transition-colors",
                              isAvailable ? "hover:bg-muted/50" : "opacity-60 bg-muted/30"
                            )}
                          >
                            {/* Ticket notch design */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-r-full -ml-[1px] border-r" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-l-full -mr-[1px] border-l" />
                            
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 pl-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-lg font-bold text-destructive">
                                    {getDiscountText()}
                                  </h3>
                                  {!isAvailable && (
                                    <Badge variant="secondary" className="text-xs">
                                      {isExpired ? "Hết hạn" : isFullyUsed ? "Hết lượt" : "Không khả dụng"}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {getConditionText()}
                                </p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {voucher.voucher_code && (
                                    <Badge variant="secondary" className="font-mono text-xs">
                                      {voucher.voucher_code}
                                    </Badge>
                                  )}
                                  {endDate && (
                                    <span className="text-xs text-muted-foreground">
                                      HSD: {format(endDate, "dd/MM/yyyy")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right pr-2">
                                {remaining !== null && (
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    Còn {remaining} lượt
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có mã giảm giá nào</p>
                      <p className="text-sm mb-4">Lưu mã giảm giá từ trang chủ để sử dụng</p>
                      <Button onClick={() => navigate("/")} size="sm">
                        Khám phá mã giảm giá
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
