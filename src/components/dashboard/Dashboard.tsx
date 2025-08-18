import { StatsCard } from "./StatsCard";
import { RecentOrders } from "./RecentOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  List,
  Layers,
  IndianRupee,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface DashboardStats {
  products: number;
  orders: number;
  users: number;
  pendingVendors: number;
  approvedVendors: number;
  categories: number;
  subCategories: number;
  last5Orders: any[];
  last5MonthSales: any[];
}

interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
  urgent: boolean;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const  role = Cookies.get("user_role");
  console.log("User Role:", role);
  

  const token = role === "admin" ? Cookies.get("admin_token") : Cookies.get("vendor_token");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BASE_UR;
        const endpoint = role === "admin" 
          ? "admin/dashboard-stats" 
          : "vendor/dashboard-stats";
        
        const response = await axios.get(
          `${baseUrl}${endpoint}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setStats(role === "admin" ? response.data.data : response.data.stats);
        } else {
          setError("Failed to fetch dashboard stats");
        }
      } catch (err) {
        setError("Error fetching dashboard data");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();

  }, [role]);
  

  // Generate notifications based on stats
  const generateNotifications = (): Notification[] => {
    if (!stats) return [];

    const notifications: Notification[] = [];

    if (stats.pendingVendors > 0) {
      notifications.push({
        id: 1,
        type: "vendor",
        message: `${stats.pendingVendors} vendor applications pending approval`,
        time: "Just now",
        urgent: true,
      });
    }

    if (stats.orders > 0) {
      notifications.push({
        id: 2,
        type: "order",
        message: `${stats.orders} orders need processing`,
        time: "Today",
        urgent: stats.orders > 5,
      });
    }

    if (stats.products < 10) {
      notifications.push({
        id: 3,
        type: "product",
        message: "Low product count - consider adding more",
        time: "Today",
        urgent: true,
      });
    }

    return notifications.length > 0
      ? notifications
      : [
          {
            id: 1,
            type: "system",
            message: "All systems operational",
            time: "Just now",
            urgent: false,
          },
        ];
  };

  const notifications = generateNotifications();

  if (loading) {
    return (
      <div className="ml-64 mt-14 flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-64 mt-14 flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <p className="text-lg">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="ml-64 mt-14 flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg">No data available</p>
        </div>
      </div>
    );
  }

  // If vendor, show vendor-specific stats
  let dashboardStats;
  
  if (role === "vendor" && stats && (stats as any).totalProducts !== undefined) {
    dashboardStats = [
      {
        title: "Total Products",
        value: (stats as any).totalProducts?.toString() ?? "0",
        changeType: "neutral" as const,
        icon: Package,
        iconColor: "text-purple-600",
      },
      {
        title: "Total Orders",
        value: (stats as any).totalOrders?.toString() ?? "0",
        changeType: "positive" as const,
        icon: ShoppingCart,
        iconColor: "text-orange-600",
      },
      {
        title: "Total Revenue",
        value: `₹${(stats as any).totalRevenue ?? 0}`,
        changeType: "positive" as const,
        icon: IndianRupee,
        iconColor: "text-green-600",
      },
      {
        title: "Items Sold",
        value: (stats as any).totalItemsSold?.toString() ?? "0",
        changeType: "positive" as const,
        icon: Layers,
        iconColor: "text-blue-600",
      },
    ];
  } else {
    dashboardStats = [
      {
        title: "Total Revenue",
        value: `₹${stats.last5MonthSales?.reduce(
          (total, month) => total + month.totalSales,
          0
        )}`,
        change: `${stats.last5MonthSales.length} months of sales data`,
        changeType: "positive" as const,
        icon: IndianRupee,
        iconColor: "text-green-600",
      },
      {
        title: "Active Users",
        value: stats.users.toString(),
        change: `${stats.approvedVendors} approved vendors`,
        changeType: "positive" as const,
        icon: Users,
        iconColor: "text-blue-600",
      },
      {
        title: "Total Products",
        value: stats.products.toString(),
        changeType: "neutral" as const,
        icon: Package,
        iconColor: "text-purple-600",
      },
      {
        title: "Total Orders",
        value: stats.orders.toString(),
        change: `${stats.pendingVendors} vendors pending approval`,
        changeType: stats.pendingVendors > 0 ? "negative" : "positive",
        icon: ShoppingCart,
        iconColor: "text-orange-600",
      },
    ];
  }

  return (
    <div className="space-y-6  p-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      {role === "admin" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendors</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approvedVendors}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingVendors} pending approval
          </p>
        </CardContent>
          </Card>
          <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <List className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.categories}</div>
          <p className="text-xs text-muted-foreground">
            {stats.subCategories} sub-categories
          </p>
        </CardContent>
          </Card>
          <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Order</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.last5Orders.length > 0
          ? `${stats.last5Orders[0].id}`
          : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.last5Orders.length > 0
          ? `₹${stats.last5Orders[0].totalAmount}`
          : "No orders"}
          </p>
        </CardContent>
          </Card>
          <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Month</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.last5MonthSales.length > 0
          ? `₹${stats.last5MonthSales[0].totalSales}`
          : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.last5MonthSales.length > 0
          ? new Date(stats.last5MonthSales[0].month).toLocaleString(
              "default",
              { month: "long", year: "numeric" }
            )
          : "No data"}
          </p>
        </CardContent>
          </Card>
        </div>
      )}

      {/* Content Grid */}
      {/* Show Recent Orders only for ADMIN */}
      {role === "admin" && (
        <div className="">
          {/* Recent Orders */}
          <div >
        <Card>
          <CardHeader>
            {/* <CardTitle>Recent Orders</CardTitle> */}
          </CardHeader>
          <CardContent>
            <RecentOrders last5Orders={stats.last5Orders} />
          </CardContent>
        </Card>
          </div>
        </div>
      )}

    
    </div>
  );
}
