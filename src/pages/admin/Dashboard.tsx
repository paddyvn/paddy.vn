import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  XCircle,
  DollarSign 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { format, subDays, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  productsChange: number;
  cancelledOrders: number;
  cancelledChange: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export default function Dashboard() {
  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const now = new Date();
      const last7Days = subDays(now, 7);
      const last14Days = subDays(now, 14);

      // Get current period stats
      const { data: currentOrders } = await supabase
        .from("orders")
        .select("total, status, created_at")
        .gte("created_at", last7Days.toISOString());

      // Get previous period stats for comparison
      const { data: previousOrders } = await supabase
        .from("orders")
        .select("total, status, created_at")
        .gte("created_at", last14Days.toISOString())
        .lt("created_at", last7Days.toISOString());

      // Get products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const currentRevenue = currentOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const previousRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      
      const currentOrdersCount = currentOrders?.length || 0;
      const previousOrdersCount = previousOrders?.length || 0;
      
      const currentCancelled = currentOrders?.filter(o => o.status === "cancelled").length || 0;
      const previousCancelled = previousOrders?.filter(o => o.status === "cancelled").length || 0;

      const revenueChange = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      
      const ordersChange = previousOrdersCount > 0
        ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
        : 0;

      const cancelledChange = previousCancelled > 0
        ? ((currentCancelled - previousCancelled) / previousCancelled) * 100
        : 0;

      return {
        totalRevenue: currentRevenue,
        revenueChange,
        totalOrders: currentOrdersCount,
        ordersChange,
        totalProducts: productsCount || 0,
        productsChange: 0, // We'd need historical data for this
        cancelledOrders: currentCancelled,
        cancelledChange,
      } as DashboardMetrics;
    },
  });

  // Fetch sales trend data (last 14 days)
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["sales-trend"],
    queryFn: async () => {
      const last14Days = subDays(new Date(), 14);
      
      const { data: orders } = await supabase
        .from("orders")
        .select("total, created_at")
        .gte("created_at", last14Days.toISOString())
        .order("created_at", { ascending: true });

      // Group by date
      const salesByDate: Record<string, { revenue: number; orders: number }> = {};
      
      orders?.forEach(order => {
        const date = format(startOfDay(new Date(order.created_at)), "MMM d");
        if (!salesByDate[date]) {
          salesByDate[date] = { revenue: 0, orders: 0 };
        }
        salesByDate[date].revenue += Number(order.total);
        salesByDate[date].orders += 1;
      });

      return Object.entries(salesByDate).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));
    },
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, shipping_address")
        .order("created_at", { ascending: false })
        .limit(5);

      return data;
    },
  });

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend = "up" 
  }: { 
    title: string; 
    value: string | number; 
    change: number; 
    icon: any; 
    trend?: "up" | "down" 
  }) => {
    const isPositive = trend === "up" ? change >= 0 : change < 0;
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span>vs last 7 days</span>
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Track your store's performance and metrics</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(metrics?.totalRevenue || 0)}
              change={metrics?.revenueChange || 0}
              icon={DollarSign}
            />
            <MetricCard
              title="Total Orders"
              value={metrics?.totalOrders || 0}
              change={metrics?.ordersChange || 0}
              icon={ShoppingCart}
            />
            <MetricCard
              title="Total Products"
              value={metrics?.totalProducts || 0}
              change={metrics?.productsChange || 0}
              icon={Package}
            />
            <MetricCard
              title="Cancelled Orders"
              value={metrics?.cancelledOrders || 0}
              change={metrics?.cancelledChange || 0}
              icon={XCircle}
              trend="down"
            />
          </>
        )}
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders?.map((order) => {
                const shippingAddress = order.shipping_address as any;
                return (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{order.order_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {shippingAddress?.first_name} {shippingAddress?.last_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={
                          order.status === "delivered" ? "default" :
                          order.status === "cancelled" ? "destructive" :
                          "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(order.total)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}