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
  ChevronRight,
  ChevronLeft,
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

interface SubCategory {
  id: number;
  mainCategoryId: number;
  name: string;
  slug: string;
  description: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
  is_hidden?: boolean;
}

interface MainCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
}

export function SubCategoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    mainCategoryId: "",
    name: "",
    description: "",
    image: null as File | null,
    is_hidden: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

  const token = Cookies.get("admin_token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch sub-categories
        const subCatResponse = await fetch(
          `${import.meta.env.VITE_BASE_UR}admin/get-all-sub-categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const subCatData = await subCatResponse.json();
        if (subCatData.success) {
          setSubCategories(subCatData.subCategories);
        }

        // Fetch main categories
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

    fetchData();
  }, [token]);

  // Filter categories based on search term
  const filteredCategories = subCategories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    if (!formData.mainCategoryId || !formData.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Main category and name are required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("mainCategoryId", formData.mainCategoryId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("is_hidden", formData.is_hidden ? "1" : "0"); // Convert boolean to string
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const endpoint = formData.id
        ? `${import.meta.env.VITE_BASE_UR}admin/update-sub-category`
        : `${import.meta.env.VITE_BASE_UR}admin/add-sub-category`;

      if (formData.id) {
        formDataToSend.append("id", formData.id);
      }

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
            ? "Sub-category updated successfully"
            : "Sub-category added successfully",
        });
        // Refresh the sub-categories list
        const subCatResponse = await fetch(
          `${import.meta.env.VITE_BASE_UR}admin/get-all-sub-categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const subCatData = await subCatResponse.json();
        if (subCatData.success) {
          setSubCategories(subCatData.subCategories);
        }
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setFormData({
          id: "",
          mainCategoryId: "",
          name: "",
          description: "",
          image: null,
          is_hidden: false,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            data.message ||
            `Failed to ${formData.id ? "update" : "add"} sub-category`,
        });
      }
    } catch (error) {
      console.error(
        `Error ${formData.id ? "updating" : "adding"} sub-category:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: `An error occurred while ${
          formData.id ? "updating" : "adding"
        } sub-category`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (category: SubCategory) => {
    // console.log(category, "handleEditClick");
    setFormData({
      id: category.id.toString(),
      mainCategoryId: category.mainCategoryId.toString(),
      name: category.name,
      description: category.description || "",
      image: null,
      is_hidden: category.is_hidden || false,
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
        `${
          import.meta.env.VITE_BASE_UR
        }admin/delete-sub-category/${categoryToDelete}`,
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
          description: "Sub-category deleted successfully",
        });
        setSubCategories(
          subCategories.filter((cat) => cat.id !== categoryToDelete)
        );
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to delete sub-category",
        });
      }
    } catch (error) {
      console.error("Error deleting sub-category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting sub-category",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // const filteredCategories = subCategories.filter((category) => {
  //   const matchesSearch =
  //     category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     category.description?.toLowerCase().includes(searchTerm.toLowerCase());
  //   return matchesSearch;
  // });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
                Add Sub-Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sub-Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="mainCategoryId">Main Category</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        mainCategoryId: value,
                      }))
                    }
                    value={formData.mainCategoryId}
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
                  <Label htmlFor="name">Sub-Category Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter sub-category name"
                    className="mt-4"
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
                    className="mt-4 "
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
                    className="mt-4 "
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="add-is-hidden"
                    name="is_hidden"
                    type="checkbox"
                    checked={formData.is_hidden}
                    onChange={(e) => 
                      setFormData((prev) => ({
                        ...prev,
                        is_hidden: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="add-is-hidden">Hide from menu</Label>
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
                    {isSubmitting ? "Adding..." : "Add Sub-Category"}
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
          <CardTitle>
            Sub-Categories ({filteredCategories.length}) - Page {currentPage} of{" "}
            {totalPages}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((category, index) => (
                <TableRow key={category.id} className="hover:bg-gray-50">
                  <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {category.description?.slice(0, 20) || "-"}
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
                  <TableCell>
                    {category.is_hidden ? (
                      <Badge variant="destructive">Hidden</Badge>
                    ) : (
                      <Badge variant="default">Visible</Badge>
                    )}
                  </TableCell>
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
                  <TableCell
                    colSpan={7}
                    className="text-center font-semibold text-gray-800"
                  >
                    No sub-categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredCategories.length > itemsPerPage && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2  p-4">
            <div className="text-sm text-gray-500 mb-2 md:mb-0">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredCategories.length)} of{" "}
              {filteredCategories.length} sub-categories
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Generate page buttons based on current position */}
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(
                  totalPages,
                  startPage + maxVisiblePages - 1
                );

                // Adjust if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                // Always show first page
                if (startPage > 1) {
                  pages.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(1)}
                      className="w-8 h-8"
                    >
                      1
                    </Button>
                  );

                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="px-1 flex items-center">
                        ...
                      </span>
                    );
                  }
                }

                // Generate visible page buttons
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(i)}
                      className="w-8 h-8"
                    >
                      {i}
                    </Button>
                  );
                }

                // Add ellipsis and last page if needed
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" className="px-1 flex items-center">
                        ...
                      </span>
                    );
                  }

                  pages.push(
                    <Button
                      key={totalPages}
                      variant={
                        currentPage === totalPages ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => paginate(totalPages)}
                      className="w-8 h-8"
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pages;
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Category</DialogTitle>
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
                  }))
                }
                value={formData.mainCategoryId}
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
              <Label htmlFor="editName">Sub-Category Name</Label>
              <Input
                id="editName"
                name="name"
                placeholder="Enter sub-category name"
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
            <div className="flex items-center space-x-2">
              <input
                id="edit-is-hidden"
                name="is_hidden"
                type="checkbox"
                checked={formData.is_hidden}
                onChange={(e) => 
                  setFormData((prev) => ({
                    ...prev,
                    is_hidden: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="edit-is-hidden">Hide from menu</Label>
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
                {isSubmitting ? "Updating..." : "Update Sub-Category"}
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
              sub-category.
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
