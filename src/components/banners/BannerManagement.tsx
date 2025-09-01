import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
} from "lucide-react";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Banner {
  id: number;
  type: string | null;
  imgUrl: string;
  title: string | null;
  description: string | null;
  catId: number | null;
  subCatId: number | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface SubCategory {
  id: number;
  mainCategoryId: number;
  name: string;
  slug: string;
  description: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
}

export function BannerManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<
    SubCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = Cookies.get("admin_token");

  // Form state for add/edit
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    catId: "",
    subCatId: "",
    status: "1",
    image: null as File | null,
  });

  useEffect(() => {
    if (token) {
      fetchBanners();
      fetchCategories();
      fetchSubCategories();
    } else {
      setError("You are not authorized to view this page.");
    }
  }, [token]);

  useEffect(() => {
    if (formData.catId) {
      const filtered = subCategories.filter(
        (subCat) => subCat.mainCategoryId === Number(formData.catId)
      );
      setFilteredSubCategories(filtered);
      // Reset subCatId when category changes if the current subCatId doesn't belong to the new category
      if (
        formData.subCatId &&
        !filtered.some((subCat) => subCat.id === Number(formData.subCatId))
      ) {
        setFormData((prev) => ({ ...prev, subCatId: "" }));
      }
    } else {
      setFilteredSubCategories([]);
      setFormData((prev) => ({ ...prev, subCatId: "" }));
    }
  }, [formData.catId, subCategories]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/get-all-banners`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch banners");
      }

      const data = await response.json();
      if (data.success) {
        setBanners(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch banners");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/get-all-main-categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      } else {
        throw new Error(data.message || "Failed to fetch categories");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/get-all-sub-categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch subcategories");
      }

      const data = await response.json();
      if (data.success) {
        setSubCategories(data.subCategories);
      } else {
        throw new Error(data.message || "Failed to fetch subcategories");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to fetch subcategories",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: number) => {
    return status === 1 ? "active" : "inactive";
  };

  const getStatusColor = (status: number) => {
    return status === 1
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const handleDelete = async (bannerId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/delete-banner/${bannerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete banner");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Banner deleted successfully",
          variant: "default",
        });
        fetchBanners();
      } else {
        throw new Error(data.message || "Failed to delete banner");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete banner",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (banner: Banner) => {
    setCurrentBanner(banner);
    setFormData({
      title: banner.title || "",
      description: banner.description || "",
      type: banner.type || "",
      catId: banner.catId ? banner.catId.toString() : "",
      subCatId: banner.subCatId ? banner.subCatId.toString() : "",
      status: banner.status.toString(),
      image: null,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!currentBanner) return;

    // No validation needed for edit - image is optional in edit mode
    // All fields are optional

    try {
      const formDataToSend = new FormData();

      // Only append non-empty optional fields
      if (formData.title.trim()) {
        formDataToSend.append("title", formData.title);
      }
      if (formData.description.trim()) {
        formDataToSend.append("description", formData.description);
      }
      if (formData.type.trim()) {
        formDataToSend.append("type", formData.type);
      }
      if (formData.catId) {
        formDataToSend.append("catId", formData.catId);
      }
      if (formData.subCatId) {
        formDataToSend.append("subCatId", formData.subCatId);
      }
      formDataToSend.append("status", formData.status);

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/update-banner/${
          currentBanner.id
        }`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update banner");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Banner updated successfully",
          variant: "default",
        });
        setIsEditDialogOpen(false);
        fetchBanners();
      } else {
        throw new Error(data.message || "Failed to update banner");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update banner",
        variant: "destructive",
      });
    }
  };

  const handleAddSubmit = async () => {
    // Validate required field (only image)
    if (!formData.image) {
      toast({
        title: "Error",
        description: "Banner image is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", formData.image);

      // Only append non-empty optional fields
      if (formData.title.trim()) {
        formDataToSend.append("title", formData.title);
      }
      if (formData.description.trim()) {
        formDataToSend.append("description", formData.description);
      }
      if (formData.type.trim()) {
        formDataToSend.append("type", formData.type);
      }
      if (formData.catId) {
        formDataToSend.append("catId", formData.catId);
      }
      if (formData.subCatId) {
        formDataToSend.append("subCatId", formData.subCatId);
      }
      formDataToSend.append("status", formData.status);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/add-banner`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add banner");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Banner added successfully",
          variant: "default",
        });
        setIsAddDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          type: "",
          catId: "",
          subCatId: "",
          status: "1",
          image: null,
        });
        fetchBanners();
      } else {
        throw new Error(data.message || "Failed to add banner");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to add banner",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        image: e.target.files![0],
      }));
    }
  };

  const filteredBanners = banners.filter((banner) => {
    const matchesSearch =
      searchTerm === "" ||
      (banner.title &&
        banner.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (banner.type &&
        banner.type.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || banner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading banners...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 ">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status:{" "}
                {statusFilter === "all" ? "All" : getStatusText(statusFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(1)}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(0)}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex space-x-2">
          {/* <Button variant="outline">Analytics</Button> */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Banner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Banner Title (Optional)</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter banner title"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type (Optional)</Label>
                  <Input
                    id="type"
                    name="type"
                    placeholder="Enter banner type (e.g., home)"
                    value={formData.type}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Enter banner description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Main Category (Optional)</Label>
                  <Select
                    value={formData.catId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, catId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subcategory (Optional)</Label>
                  <Select
                    value={formData.subCatId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subCatId: value })
                    }
                    disabled={!formData.catId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubCategories.map((subCat) => (
                        <SelectItem
                          key={subCat.id}
                          value={subCat.id.toString()}
                        >
                          {subCat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="image">Banner Image *</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddSubmit}>Add Banner</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.map((banner) => (
          <Card key={banner.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(banner.status)}>
                  {getStatusText(banner.status)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditClick(banner)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <img
                  src={`${import.meta.env.VITE_BASE_URL_IMG}${banner.imgUrl}`}
                  alt={banner.title}
                  className="w-full h-32 object-cover rounded-md bg-gray-100"
                />
                <div>
                  <h3 className="font-medium">
                    {banner.title || "Untitled Banner"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {banner.type || "No type specified"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {banner.description || "No description"}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    Category:{" "}
                    {banner.catId
                      ? categories.find((cat) => cat.id === banner.catId)
                          ?.name || banner.catId
                      : "None"}
                  </span>
                  <span>
                    Subcategory:{" "}
                    {banner.subCatId
                      ? subCategories.find((sub) => sub.id === banner.subCatId)
                          ?.name || banner.subCatId
                      : "None"}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(banner.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Banner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Banner Title (Optional)</Label>
              <Input
                id="edit-title"
                name="title"
                placeholder="Enter banner title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type (Optional)</Label>
              <Input
                id="edit-type"
                name="type"
                placeholder="Enter banner type (e.g., home)"
                value={formData.type}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                name="description"
                placeholder="Enter banner description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Main Category (Optional)</Label>
              <Select
                value={formData.catId}
                onValueChange={(value) =>
                  setFormData({ ...formData, catId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategory (Optional)</Label>
              <Select
                value={formData.subCatId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subCatId: value })
                }
                disabled={!formData.catId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubCategories.map((subCat) => (
                    <SelectItem key={subCat.id} value={subCat.id.toString()}>
                      {subCat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-image">Banner Image (Optional)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {currentBanner && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Current Image:</p>
                  <img
                    src={`${import.meta.env.VITE_BASE_URL_IMG}${
                      currentBanner.imgUrl
                    }`}
                    alt="Current banner"
                    className="w-32 h-20 object-cover mt-1"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSubmit}>Save Changes</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
