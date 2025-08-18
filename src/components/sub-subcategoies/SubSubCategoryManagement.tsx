import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Cookies from "js-cookie";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubSubCategory {
  id: number;
  mainCategoryId: number;
  subCategoryId: number;
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
}

interface MainCategory {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

export function SubSubCategoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    mainCategoryId: "",
    subCategoryId: "",
    name: "",
    description: "",
    image: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableSubCategories, setAvailableSubCategories] = useState<SubCategory[]>([]);

  const token = Cookies.get("admin_token");

  const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch main categories with their sub-categories
        const mainCatResponse = await fetch(
          `${import.meta.env.VITE_BASE_UR}admin/get-all-main-categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const mainCatData = await mainCatResponse.json();
        if (mainCatData.success) {
          setMainCategories(mainCatData.categories);
        }

        // Fetch sub-sub-categories
        const subSubCatResponse = await fetch(
          `${import.meta.env.VITE_BASE_UR}admin/get-all-sub-sub-categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const subSubCatData = await subSubCatResponse.json();
        //  subSubCatData = subSubCatData.subSubCategories
        console.log("Sub-sub-categories data:", subSubCatData);
        if (subSubCatData.success) {
          setSubSubCategories(subSubCatData.subSubCategories);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch categories",
        });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
  

    fetchData();
  }, [token]);

  useEffect(() => {
    // When main category changes, update available sub-categories
    if (formData.mainCategoryId) {
      const selectedMainCategory = mainCategories.find(
        (cat) => cat.id === parseInt(formData.mainCategoryId)
      );
      if (selectedMainCategory) {
        setAvailableSubCategories(selectedMainCategory.subCategories);
        // Reset subCategoryId if it's not available in the new main category
        if (
          formData.subCategoryId &&
          !selectedMainCategory.subCategories.some(
            (subCat) => subCat.id === parseInt(formData.subCategoryId)
          )
        ) {
          setFormData((prev) => ({ ...prev, subCategoryId: "" }));
        }
      }
    } else {
      setAvailableSubCategories([]);
      setFormData((prev) => ({ ...prev, subCategoryId: "" }));
    }
  }, [formData.mainCategoryId, mainCategories]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mainCategoryId || !formData.subCategoryId || !formData.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Main category, sub-category and name are required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("mainCategoryId", formData.mainCategoryId);
      formDataToSend.append("subCategoryId", formData.subCategoryId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const endpoint = formData.id
        ? `${import.meta.env.VITE_BASE_UR}admin/update-sub-sub-category/${formData.id}`
        : `${import.meta.env.VITE_BASE_UR}admin/add-sub-sub-category`;

      const response = await fetch(endpoint, {
        method: formData.id ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: formData.id
            ? "Sub-sub-category updated successfully"
            : "Sub-sub-category added successfully",
        });
        // Refresh the sub-sub-categories list
        await fetchData();
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setFormData({
          id: "",
          mainCategoryId: "",
          subCategoryId: "",
          name: "",
          description: "",
          image: null,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            data.message ||
            `Failed to ${formData.id ? "update" : "add"} sub-sub-category`,
        });
      }
    } catch (error) {
      console.error(
        `Error ${formData.id ? "updating" : "adding"} sub-sub-category:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: `An error occurred while ${
          formData.id ? "updating" : "adding"
        } sub-sub-category`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (category: SubSubCategory) => {

    setFormData({
      id: (category.id ?? "").toString(),
      mainCategoryId: (category.mainCategoryId ?? "").toString(),
      subCategoryId: (category.subCategoryId ?? "").toString(),
      name: category.name ?? "",
      description: category.description || "",
      image: null,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/delete-sub-sub-category/${categoryToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Sub-sub-category deleted successfully",
        });
        setSubSubCategories(
          subSubCategories.filter((cat) => cat.id !== categoryToDelete)
        );
        fetchData(); // Refresh the list
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to delete sub-sub-category",
        });
      }
    } catch (error) {
      console.error("Error deleting sub-sub-category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting sub-sub-category",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = subSubCategories?.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getMainCategoryName = (id: number) => {
    const category = mainCategories.find((cat) => cat.id === id);
    return category ? category.name : "N/A";
  };

  const getSubCategoryName = (mainCatId: number, subCatId: number) => {
    const mainCategory = mainCategories.find((cat) => cat.id === mainCatId);
    if (!mainCategory) return "N/A";
    const subCategory = mainCategory.subCategories.find(
      (subCat) => subCat.id === subCatId
    );
    return subCategory ? subCategory.name : "N/A";
  };

  if (loading) {
    return (
      <div className="space-y-6 ">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {/* <Button variant="outline">Export</Button> */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-Sub-Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sub-Sub-Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="mainCategoryId">Main Category</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        mainCategoryId: value,
                        subCategoryId: "", // Reset sub-category when main changes
                      }))
                    }
                    value={formData.mainCategoryId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a main category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((category) => (
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
                  <Label htmlFor="subCategoryId">Sub-Category</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        subCategoryId: value,
                      }))
                    }
                    value={formData.subCategoryId}
                    required
                    disabled={!formData.mainCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubCategories.map((subCategory) => (
                        <SelectItem
                          key={subCategory.id}
                          value={subCategory.id.toString()}
                        >
                          {subCategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Sub-Sub-Category Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter sub-sub-category name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Enter description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Sub-Sub-Category"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sub-Sub-Categories ({filteredCategories?.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                {/* <TableHead>Main Category</TableHead> */}
                {/* <TableHead>Sub-Category</TableHead> */}
                <TableHead>Description</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories?.map((category) => (
                <TableRow key={category.id} className="hover:bg-gray-50">
                  <TableCell>
                    {filteredCategories.indexOf(category) + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  {/* <TableCell>
                    {getMainCategoryName(category.mainCategoryId)}
                  </TableCell> */}
                  {/* <TableCell>
                    {getSubCategoryName(
                      category.mainCategoryId,
                      category.subCategoryId
                    )}
                  </TableCell> */}
                  <TableCell className="max-w-xs truncate">
                    {category.description?.slice(0, 20) || "N/A"}
                  </TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    {category.imgUrl && (
                      <img
                        src={`${import.meta.env.VITE_BASE_URL_IMG}${
                          category.imgUrl
                        }`}
                        alt={category.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(category.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditClick(category)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteClick(category.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center font-semibold text-gray-800">
                    No sub-categories found.
                  </TableCell>
                </TableRow>
              )}
              
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Sub-Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={formData.id} />
            <div>
              <Label htmlFor="editMainCategoryId">Main Category</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    mainCategoryId: value,
                    subCategoryId: "", // Reset sub-category when main changes
                  }))
                }
                value={formData.mainCategoryId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a main category" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((category) => (
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
              <Label htmlFor="editSubCategoryId">Sub-Category</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subCategoryId: value,
                  }))
                }
                value={formData.subCategoryId}
                required
                disabled={!formData.mainCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubCategories.map((subCategory) => (
                    <SelectItem
                      key={subCategory.id}
                      value={subCategory.id.toString()}
                    >
                      {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editName">Sub-Sub-Category Name</Label>
              <Input
                id="editName"
                name="name"
                placeholder="Enter sub-sub-category name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                name="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="editImage">Image</Label>
              <Input
                id="editImage"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Sub-Sub-Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              sub-sub-category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}