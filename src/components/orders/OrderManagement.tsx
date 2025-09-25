import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TrendingUp, ShoppingCart, Users, DollarSign } from "lucide-react";

interface Order {
  id: number;
  userId: number;
  addressId: number;
  totalAmount: string;
  gst: string;
  discount: string;
  couponCode: string;
  status: string;
  orderStatus: string;
  paymentMode: string;
  paymentOrderId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  orderItems: {
    id: number;
    orderId: number;
    productId: number;
    variantId: number;
    quantity: number;
    price: string;
    vendorId: number;
    orderItemStatus: string;
    variant: {
      id: number;
      productId: number;
      sku: string;
      price: string;
      stock: number;
      images: string[];
      product: {
        id: number;
        name: string;
        slug: string;
        description: string;
      };
    };
  }[];
}

interface ShipRocketResponse {
  success: boolean;
  awb: string;
  shipment_id: number;
  order_id: number;
  courier_name: string;
  rate: number;
  label_url: string;
  pickup: {
    status: string;
    scheduled_date: null | string;
    token_number: null | string;
  };
}

export function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const role = Cookies.get("user_role");
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";
  const navigate = useNavigate();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Get the appropriate token based on role
  const token = isAdmin ? Cookies.get("admin_token") : Cookies.get("vendor_token");

  const [error, setError] = useState<string | null>(null);

  const handleOrderDetails = (orderId: number) => {
    if (isAdmin) {
      navigate(`/orderdetails/${orderId}`);
    } else if (isVendor) {
      navigate(`/vendor/orderdetails/${orderId}`);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        let apiUrl = "";
        if (isAdmin) {
          apiUrl = `${import.meta.env.VITE_BASE_UR}admin/get-all-orders`;
        } else if (isVendor) {
          apiUrl = `${import.meta.env.VITE_BASE_UR}vendor/get-all-orders`;
        } else {
          throw new Error("Unauthorized access - Invalid user role");
        }

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        const data = await response.json();
        setOrders(data.data || data); // Handle different response structures
        toast.success("Orders loaded successfully");
      } catch (error: unknown) {
        console.error("Error fetching orders:", error);
        if (error instanceof Error) {
          setError(error.message);
          toast.error(error.message);
        } else if (typeof error === "string") {
          setError(error);
          toast.error(error);
        } else {
          setError("An unknown error occurred while fetching orders.");
          toast.error("An unknown error occurred while fetching orders.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAdmin, isVendor, token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-orange-100 text-orange-800";
      case "RETURNED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get the most common status among order items
  const getMostCommonItemStatus = (orderItems: Order['orderItems']) => {
    if (!orderItems || orderItems.length === 0) return null;
    
    const statusCount: Record<string, number> = {};
    orderItems.forEach(item => {
      const status = item.orderItemStatus;
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    let mostCommonStatus = '';
    let maxCount = 0;
    
    Object.entries(statusCount).forEach(([status, count]) => {
      if (count > maxCount) {
        mostCommonStatus = status;
        maxCount = count;
      }
    });
    
    return mostCommonStatus;
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "razorpay":
        return "Razorpay";
      case "COD":
        return "Cash on Delivery";
      default:
        return method;
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Improved search to include product names with better error handling
    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();
    const matchesSearch = searchTermLower === "" || 
      ((order?.id?.toString() || "").toLowerCase().includes(searchTermLower) ||
      (order?.user?.name || "").toLowerCase().includes(searchTermLower) ||
      (order?.paymentOrderId || "").toLowerCase().includes(searchTermLower) ||
      (order?.orderItems && order?.orderItems?.some(item => 
        (item?.variant?.product?.name || "").toLowerCase().includes(searchTermLower)
      )));

    // Payment filter is working correctly
    const matchesPayment =
      paymentFilter === "all" || order.paymentMode === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Pagination logic
  const ITEMS_PER_PAGE = 10; // Fixed value instead of state
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPaymentFilter("all");
  };

  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.totalAmount),
    0
  );
  const pendingOrders = orders.filter((order) =>
    order.orderItems.some((item) => item.orderItemStatus === "PROCESSING")
  ).length;

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <>
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={orders.length.toString()}
          change="+12% from last month"
          changeType="positive"
          icon={ShoppingCart}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          change="+8% from last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Pending Orders"
          value={pendingOrders.toString()}
          change="-5% from last month"
          changeType="positive"
          icon={Package}
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Unique Customers"
          value={new Set(orders.map((o) => o.userId)).size.toString()}
          change="+18% from last month"
          changeType="positive"
          icon={Users}
          iconColor="text-purple-600"
        />
      </div>

      {/* Header with Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
          <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10"
        />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Payment:{" "}
          {paymentFilter === "all"
            ? "All"
            : getPaymentMethodName(paymentFilter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPaymentFilter("all")}>
          All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentFilter("razorpay")}>
          Razorpay
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentFilter("COD")}>
          Cash on Delivery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {(searchTerm || paymentFilter !== "all") && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
          </div>
        </div>
        

      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Management ({filteredOrders.length})</CardTitle>
          {(debouncedSearchTerm || paymentFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-2">
              {debouncedSearchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{debouncedSearchTerm}"
                </Badge>
              )}
              {paymentFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Payment: {getPaymentMethodName(paymentFilter)}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentOrders.map((order) => {
                const totalItems = order.orderItems.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );
                const orderDate = new Date(
                  order.createdAt
                ).toLocaleDateString();

                return (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.user.name}</div>
                      <div className="text-sm text-gray-500">
                        {order.user.email}
                      </div>
                    </TableCell>
                    <TableCell>₹{order.totalAmount}</TableCell>
                    <TableCell>{totalItems}</TableCell>
                    <TableCell>
                      {getPaymentMethodName(order.paymentMode)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-center">
                        <Badge className={getStatusColor(order.status) + " pointer-events-none"}>
                          {order.status}
                        </Badge>
                        {/* {order.orderItems && order.orderItems.length > 1 && 
                         getMostCommonItemStatus(order.orderItems) !== order.status && (
                          <div className="text-xs text-gray-500">
                            Items have different statuses
                          </div>
                        )} */}
                      </div>
                    </TableCell>
                    <TableCell>{orderDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOrderDetails(order.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Order Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {currentOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-sm text-gray-500"
                  >
                    {debouncedSearchTerm || paymentFilter !== "all" 
                      ? `No orders found matching your filters.` 
                      : "No orders found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    <Toaster position="top-right" richColors closeButton />
    </>
  );
}