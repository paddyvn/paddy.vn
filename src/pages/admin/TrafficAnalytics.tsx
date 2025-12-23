import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, Clock, TrendingDown, Monitor, Smartphone, Tablet, Globe } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

// Mock traffic data (in real app, this would come from analytics service)
const generateMockTrafficData = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, "EEE"),
      pageViews: Math.floor(Math.random() * 5000) + 1000,
      visitors: Math.floor(Math.random() * 2000) + 500,
      sessions: Math.floor(Math.random() * 3000) + 700,
    };
  });
};

const trafficSourcesData = [
  { name: "Direct", value: 35 },
  { name: "Organic Search", value: 30 },
  { name: "Social Media", value: 20 },
  { name: "Referral", value: 15 },
];

const topPagesData = [
  { page: "/", views: 12500 },
  { page: "/products", views: 8200 },
  { page: "/collections/dog-food", views: 5600 },
  { page: "/collections/cat-food", views: 4300 },
  { page: "/cart", views: 3100 },
];

const deviceData = [
  { name: "Desktop", value: 45, icon: Monitor },
  { name: "Mobile", value: 40, icon: Smartphone },
  { name: "Tablet", value: 15, icon: Tablet },
];

export default function TrafficAnalytics() {
  const trafficData = generateMockTrafficData();

  // Calculate totals from mock data
  const totalPageViews = trafficData.reduce((sum, day) => sum + day.pageViews, 0);
  const totalVisitors = trafficData.reduce((sum, day) => sum + day.visitors, 0);
  const avgSessionDuration = "3m 24s";
  const bounceRate = "42.3%";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Traffic Analytics</h1>
        <p className="text-muted-foreground">Monitor your website traffic and visitor behavior</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bounceRate}</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSessionDuration}</div>
            <p className="text-xs text-muted-foreground">Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>Page views and visitors over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="pageViews" stroke="hsl(var(--primary))" strokeWidth={2} name="Page Views" />
                <Line type="monotone" dataKey="visitors" stroke="hsl(var(--secondary))" strokeWidth={2} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trafficSourcesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trafficSourcesData.map((_, index) => (
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages on your site</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topPagesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="page" type="category" width={120} className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
            <CardDescription>How visitors access your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceData.map((device) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <device.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${device.value}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{device.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Note</CardTitle>
            <CardDescription>Traffic data shown is for demonstration purposes</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To display real traffic analytics, connect your Google Analytics or other analytics service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
