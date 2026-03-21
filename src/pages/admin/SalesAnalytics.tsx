import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingCart, Users, TrendingUp, TrendingDown, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

type DateRange = "7d" | "14d" | "30d" | "90d";

const getDays = (range: DateRange) => {
  switch (range) {
    case "7d": return 7;
    case "14d": return 14;
    case "30d": return 30;
    case "90d": return 90;
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

function TrendBadge({ current, previous, label }: { current: number; previous: number; label: string }) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      {isPositive ? (
        <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <TrendingDown className="h-3 w-3 text-destructive" />
      )}
      <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
        {Math.abs(change).toFixed(1)}%
      </span>
      <span>vs previous {label}</span>
    </p>
  );
}

export default function SalesAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const days = getDays(dateRange);
  const startDate = startOfDay(subDays(new Date(), days));
  const prevStartDate = startOfDay(subDays(new Date(), days * 2));

  // Current period orders (specific fields, date-scoped)
  const { data: currentOrders = [] } = useQuery({
    queryKey: ["sales-current", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Previous period orders (for comparison)
  const { data: prevOrders = [] } = useQuery({
    queryKey: ["sales-previous", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());
      if (error) throw error;
      return data;
    },
  });

  // New customers count (head: true)
  const { data: newCustomersCount = 0 } = useQuery({
    queryKey: ["sales-customers", dateRange],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString());
      if (error) throw error;
      return count || 0;
    },
  });

  // Previous period customer count
  const { data: prevCustomersCount = 0 } = useQuery({
    queryKey: ["sales-customers-prev", dateRange],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());
      if (error) throw error;
      return count || 0;
    },
  });

  // Active products count (cached)
  const { data: productsCount = 0 } = useQuery({
    queryKey: ["sales-products-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000,
  });

  // Computed metrics
  const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const currentOrderCount = currentOrders.length;
  const prevOrderCount = prevOrders.length;
  const avgOrderValue = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;

  const rangeLabel = dateRange.replace("d", " days");

  // Daily revenue chart
  const dailyRevenue = eachDayOfInterval({ start: startDate, end: new Date() }).map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayOrders = currentOrders.filter(
      (o) => format(new Date(o.created_at), "yyyy-MM-dd") === dayStr
    );
    return {
      date: format(day, dateRange === "7d" ? "EEE" : "MMM dd"),
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
      orders: dayOrders.length,
    };
  });

  // Order status pie chart
  const orderStatusData = currentOrders.reduce((acc, order) => {
    const status = order.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(orderStatusData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Analytics</h1>
          <p className="text-muted-foreground">Track your revenue and order performance</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentRevenue)}</div>
            <TrendBadge current={currentRevenue} previous={prevRevenue} label={rangeLabel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentOrderCount.toLocaleString()}</div>
            <TrendBadge current={currentOrderCount} previous={prevOrderCount} label={rangeLabel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCustomersCount.toLocaleString()}</div>
            <TrendBadge current={newCustomersCount} previous={prevCustomersCount} label={rangeLabel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <CardDescription>Revenue over the last {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown by order status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Overview of active products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{productsCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Active products in catalog</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
