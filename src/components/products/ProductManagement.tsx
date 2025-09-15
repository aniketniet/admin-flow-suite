import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import Cookies from "js-cookie";
import { Switch } from "../ui/switch";

interface Product {
  id: number;
  name: string;
  description: string;
  mainCategory: {
    name: string;
  };
  subCategory: {
    name: string;
  };
  vendor: {
    name: string;
  };
  variants: {
    price: string;
    stock: number;
    images: string[];
    attributes: {
      key: string;
      value: string;
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export function ProductManagement() {
  // URL-based pagination and filters
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  
  // Initialize filters from URL or default values
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Track if this is the initial load and previous filter values
  const isInitialLoad = useRef(true);
  const prevFilters = useRef({ 
    searchTerm: searchParams.get("search") || "", 
    statusFilter: searchParams.get("status") || "all", 
    categoryFilter: searchParams.get("category") || "all" 
  });
  const isReturningFromNavigation = useRef(false);
  const userChangedFilters = useRef(false);
  
  // Check if returning from navigation (has returnPage in previous URL)
  useEffect(() => {
    const hasReturnPage = searchParams.get('returnPage') !== null;
    if (hasReturnPage) {
      isReturningFromNavigation.current = true;
    }
  }, []);
  
  const role = Cookies.get("user_role");
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";

  const navigate = useNavigate();

  const handleDetailClick = (productId: number) => {
    // Store current page and filters in URL before navigating
    const currentParams = new URLSearchParams(searchParams);
    const returnUrl = `?${currentParams.toString()}`;
    
    if (isAdmin) {
      navigate(`/productdetails/${productId}${returnUrl}`);
    } else if (isVendor) {
      navigate(`/vendor/productdetails/${productId}${returnUrl}`);
    }
  };

  console.log("Role:", role);

  const productsPerPage = 10;

  // Get the appropriate token based on role
  const token = isAdmin
    ? Cookies.get("admin_token")
    : Cookies.get("vendor_token");

  useEffect(() => {
    fetchProducts();
    // Mark that initial load is complete after first render
    setTimeout(() => {
      isInitialLoad.current = false;
      isReturningFromNavigation.current = false;
    }, 100);
  }, []);

  // Filter products based on search and filter criteria
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "in_stock" && product.variants[0].stock > 0) ||
      (statusFilter === "out_of_stock" && product.variants[0].stock <= 0);
    const matchesCategory =
      categoryFilter === "all" || product.mainCategory.name === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Reset to page 1 when filters change (but not on initial load or returning from navigation)
  useEffect(() => {
    const filtersChanged = 
      prevFilters.current.searchTerm !== searchTerm ||
      prevFilters.current.statusFilter !== statusFilter ||
      prevFilters.current.categoryFilter !== categoryFilter;
    
    // Only reset to page 1 if:
    // 1. Not initial load
    // 2. Not returning from navigation (unless user explicitly changed filters)
    // 3. Filters actually changed
    if (!isInitialLoad.current && filtersChanged && 
        (!isReturningFromNavigation.current || userChangedFilters.current)) {
      updatePage(1);
    }
    
    // Update previous filters
    prevFilters.current = { searchTerm, statusFilter, categoryFilter };
    
    // Reset flags after processing
    if (filtersChanged) {
      userChangedFilters.current = false;
    }
  }, [searchTerm, statusFilter, categoryFilter]);

  // Ensure current page is within valid range (only after products are loaded)
  useEffect(() => {
    if (!loading && products.length > 0) {
      const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
      if (totalPages > 0 && currentPage > totalPages) {
        updatePage(totalPages);
      }
    }
  }, [filteredProducts.length, currentPage, loading, products.length]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let apiUrl = "";
      if (isAdmin) {
        apiUrl = `${import.meta.env.VITE_BASE_UR}admin/get-all-products`;
      } else if (isVendor) {
        apiUrl = `${import.meta.env.VITE_BASE_UR}vendor/get-my-products`;
      } else {
        throw new Error("Unauthorized access");
      }

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    // Only admin should be able to delete products
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete products",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/soft-delete-product/${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
          body: new URLSearchParams({
            houseNo: "222",
            street: "straeet 2",
            city: "New Delhi",
            district: "New Delhi",
            pincode: "110075",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status === false) {
        const errorMsg = data?.message || "Failed to delete product";
        toast({
          title: "Delete Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Product Deleted",
        description: "The product was deleted successfully.",
      });

      // Refresh the product list after successful deletion
      await fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  //active and inactive products

  const handleToggleProductStatus = async (
    productId: number,
    isActive: boolean
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}vendor/update-status/${productId}`,
        {
          method: "put",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status === false) {
        const errorMsg = data?.message || "Failed to update product status";
        toast({
          title: "Update Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Product Status Updated",
        description: `The product is now ${!isActive ? "inactive" : "active"}.`,
      });

      // Refresh the product list after successful status update
      await fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (stock: number) => {
    if (stock > 0) {
      return "bg-green-100 text-green-800";
    } else {
      return "bg-red-100 text-red-800";
    }
  };

  const getStatusText = (stock: number) => {
    return (
      <span className="text-xs">{stock > 0 ? "In Stock" : "Out of Stock"}</span>
    );
  };

  // Get current products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Update URL with all current parameters
  const updateURLParams = (updates: { page?: number; search?: string; status?: string; category?: string }) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Update or remove parameters
    if (updates.page !== undefined) {
      newParams.set("page", updates.page.toString());
    }
    if (updates.search !== undefined) {
      if (updates.search === "") {
        newParams.delete("search");
      } else {
        newParams.set("search", updates.search);
      }
    }
    if (updates.status !== undefined) {
      if (updates.status === "all") {
        newParams.delete("status");
      } else {
        newParams.set("status", updates.status);
      }
    }
    if (updates.category !== undefined) {
      if (updates.category === "all") {
        newParams.delete("category");
      } else {
        newParams.set("category", updates.category);
      }
    }
    
    setSearchParams(newParams);
  };
  // Change page - update URL parameters
  const updatePage = (pageNumber: number) => {
    // Only update if the page actually changes
    if (pageNumber !== currentPage) {
      updateURLParams({ page: pageNumber });
    }
  };
  
  const paginate = (pageNumber: number) => updatePage(pageNumber);
  
  const nextPage = () => {
    if (currentPage < Math.ceil(filteredProducts.length / productsPerPage)) {
      updatePage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      updatePage(currentPage - 1);
    }
  };

  const categories = [...new Set(products.map((p) => p.mainCategory.name))];
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Custom filter handlers that mark user interaction and update URL
  const handleSearchChange = (value: string) => {
    userChangedFilters.current = true;
    setSearchTerm(value);
    updateURLParams({ search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    userChangedFilters.current = true;
    setStatusFilter(value);
    updateURLParams({ status: value, page: 1 });
  };

  const handleCategoryFilterChange = (value: string) => {
    userChangedFilters.current = true;
    setCategoryFilter(value);
    updateURLParams({ category: value, page: 1 });
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  // if (error) {
  //   return <div>Error: {error}</div>;
  // }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status:{" "}
                {statusFilter === "all"
                  ? "All"
                  : statusFilter === "in_stock"
                  ? "In Stock"
                  : "Out of Stock"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("in_stock")}>
                In Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("out_of_stock")}>
                Out of Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Category: {categoryFilter === "all" ? "All" : categoryFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCategoryFilterChange("all")}>
                All
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => handleCategoryFilterChange(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex space-x-2">
          {/* <Button variant="outline">Bulk Upload</Button> */}
          {/* <Button variant="outline">Export</Button> */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              {/* <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button> */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input id="productName" placeholder="Enter product name" />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" placeholder="Enter category" />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" placeholder="0" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  {/* <Button onClick={() => setIsAddDialogOpen(false)}>
                    Add Product
                  </Button> */}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Management ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                {isVendor && <TableHead>Active/Inactive</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50">
                  <TableCell>{filteredProducts.indexOf(product) + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {product?.variants[0]?.images?.length > 0 && (
                        <img
                          src={`${import.meta.env.VITE_BASE_URL_IMG}${
                            product.variants[0].images[0]
                          }`}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover bg-gray-100"
                        />
                      )}
                      <div className="font-medium text-ellipsis overflow-hidden whitespace-nowrap">
                        {product.name.split(" ").slice(0, 7).join(" ")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.mainCategory.name}</TableCell>
                  <TableCell>{product.subCategory.name}</TableCell>
                  <TableCell>{product.vendor.name}</TableCell>
                  <TableCell>{product.variants[0]?.stock || 0}</TableCell>
                  <TableCell>
                    ₹{product.variants[0]?.sellingprice || "0.00"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        getStatusColor(product.variants[0]?.stock || 0) +
                        " pointer-events-none"
                      }
                    >
                      {getStatusText(product.variants[0]?.stock || 0)}
                    </Badge>
                  </TableCell>
                  {isVendor && (
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={(checked) =>
                          handleToggleProductStatus(product.id, checked)
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDetailClick(product.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Product
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // Store current page and filters before navigating to edit
                            const currentParams = new URLSearchParams(searchParams);
                            const returnUrl = `?${currentParams.toString()}`;
                            navigate(
                              isAdmin
                                ? `/product-update/${product.id}${returnUrl}`
                                : `/vendor/product-update/${product.id}${returnUrl}`
                            );
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-sm text-gray-500"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredProducts.length > productsPerPage && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstProduct + 1} to{" "}
                {Math.min(indexOfLastProduct, filteredProducts.length)} of{" "}
                {filteredProducts.length} products
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {(() => {
                  const pageNumbers = [];
                  if (totalPages <= 4) {
                    for (let i = 1; i <= totalPages; i++) {
                      pageNumbers.push(i);
                    }
                  } else {
                    if (currentPage <= 3) {
                      pageNumbers.push(1, 2, 3, 4);
                    } else if (currentPage >= totalPages - 2) {
                      pageNumbers.push(
                        totalPages - 3,
                        totalPages - 2,
                        totalPages - 1,
                        totalPages
                      );
                    } else {
                      pageNumbers.push(
                        currentPage - 1,
                        currentPage,
                        currentPage + 1,
                        currentPage + 2
                      );
                    }
                  }
                  return pageNumbers.map((number) => (
                    <Button
                      key={number}
                      variant={currentPage === number ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </Button>
                  ));
                })()}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
