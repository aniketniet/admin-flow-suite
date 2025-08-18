import { useState, useEffect } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Trash2,
  Edit,
} from "lucide-react";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Updated form schema to include all vendor fields
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  shopname: z.string().min(2, {
    message: "Shop name must be at least 2 characters.",
  }),
  eid_no: z.string().optional(),
  gst_no: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_ifsc: z.string().optional(),
  role: z.string().default("VENDOR"),
});

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function PendingVendors() {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const token = Cookies.get("admin_token");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      shopname: "",
      eid_no: "",
      gst_no: "",
      bank_name: "",
      bank_account_no: "",
      bank_ifsc: "",
      role: "VENDOR",
    },
  });

  const fetchVendors = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_UR}admin/get-all-pending-vendors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Reset form and set current vendor when opening the dialog
  const handleEditVendor = (vendor) => {
    setCurrentVendor(vendor);
    form.reset({
      name: vendor.name,
      email: vendor.email,
      shopname: vendor.shopname,
      eid_no: vendor.eid_no || "",
      gst_no: vendor.gst_no || "",
      bank_name: vendor.bank_name || "",
      bank_account_no: vendor.bank_account_no || "",
      bank_ifsc: vendor.bank_ifsc || "",
      role: vendor.role,
    });
    setIsAddVendorOpen(true);
  };

const filteredVendors = vendors.filter((vendor) =>
  (vendor?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
  vendor?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()))
);

  const onSubmit = async (values) => {
    console.log("Submitting vendor:", values);
    setIsLoading(true);
    try {
      const payload = {
        id: currentVendor ? currentVendor.id : undefined,
        name: values.name,
        email: values.email,
        shopname: values.shopname,
        eid_no: values.eid_no,
        gst_no: values.gst_no,
        bank_name: values.bank_name,
        bank_account_no: values.bank_account_no,
        bank_ifsc: values.bank_ifsc,
        role: values.role,
      };

      let response;
      if (currentVendor) {
        // Update existing vendor (send JSON, not FormData)
        response = await axios.put(
          `${import.meta.env.VITE_BASE_UR}admin/update-vendor-details`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Create new vendor (still using FormData for registration)
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined) formData.append(key, value);
        });
        response = await axios.post(
          `${import.meta.env.VITE_BASE_UR}public/vendor-register`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (response.data.success) {
        toast({
          title: currentVendor ? "Vendor Updated" : "Vendor Added",
          description: currentVendor
            ? "The vendor was updated successfully."
            : "A new vendor was added successfully.",
        });
        await fetchVendors();
        setIsAddVendorOpen(false);
        setCurrentVendor(null);
        form.reset();
      }
    } catch (error) {
      console.error("Failed to submit vendor:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_UR}admin/delete-vendor/${vendorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Vendor Deleted",
          description: "The vendor was deleted successfully.",
        });
        await fetchVendors();
      }
    } catch (error) {
      console.error("Failed to delete vendor:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete vendor",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
        </div>
      </div>

      {/* Edit Vendor Modal */}
      <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {currentVendor ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
            <DialogDescription>
              {currentVendor
                ? "Update the vendor details below."
                : "Fill out the form to register a new vendor."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter vendor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shopname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter shop name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="eid_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EID Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter EID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gst_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GST number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter email"
                            {...field}
                            disabled={currentVendor !== null}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bank_account_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter account number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bank_ifsc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter IFSC code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsAddVendorOpen(false);
                    setCurrentVendor(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? currentVendor
                      ? "Updating..."
                      : "Adding..."
                    : currentVendor
                    ? "Update Vendor"
                    : "Add Vendor"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Vendor Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Shop Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {vendor.name || "Not provided"}
                  </TableCell>
                  <TableCell>{vendor.email || "Not provided"}</TableCell>
                  <TableCell>{vendor.shopname || "Not provided"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        getStatusColor(vendor.status) + " pointer-events-none"
                      }
                    >
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vendor.createdAt
                      ? new Date(vendor.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
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
                            onClick={() =>
                              (window.location.href = `/admin/vendorprofile/${vendor.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditVendor(vendor)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteVendor(vendor.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVendors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center font-semibold text-gray-800"
                  >
                    No pending vendors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
