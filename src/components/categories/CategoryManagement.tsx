import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {toast} from "sonner";
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

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  igst: string;
  cgst: string;
  sgst: string;
  position: string;
  sortOrder: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
}
import Cookies from "js-cookie";

export function CategoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    igst: "",
    cgst: "",
    sgst: "",
    position: "",

  });
  const [addFormData, setAddFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    igst: "",
    cgst: "",
    sgst: "",
    position: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [addImagePreview, setAddImagePreview] = useState("");

  const token = Cookies.get("admin_token");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${import.meta.env.VITE_BASE_UR}admin/get-all-main-categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          let errorMsg = "Failed to fetch categories";
          try {
            const errorData = await response.json();
            if (errorData?.message) errorMsg = errorData.message;
          } catch {
            // ignore JSON parse error
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        } else {
          throw new Error(data.message || "Failed to fetch categories");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) => {
   
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleEditClick = (category: Category) => {
    setCurrentCategory(category);
    setEditFormData({
      name: category.name,
      description: category.description,
      image: null,
      igst: category.igst || "",
      cgst: category.cgst || "",
      sgst: category.sgst || "",
      position: category.sortOrder || "",

    });
    if (category.imgUrl) {
      setImagePreview(`${import.meta.env.VITE_BASE_URL_IMG}${category.imgUrl}`);
    } else {
      setImagePreview("");
    }
    setIsEditDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddFormData({
      ...addFormData,
      [name]: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditFormData({
        ...editFormData,
        image: file,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAddFormData({
        ...addFormData,
        image: file,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setAddImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateCategory = async () => {
    if (!currentCategory) return;

    try {
      const formData = new FormData();
      formData.append("id", currentCategory.id.toString());
      formData.append("name", editFormData.name);
      formData.append("description", editFormData.description);
      formData.append("igst", editFormData.igst);
      formData.append("cgst", editFormData.cgst);
      formData.append("sgst", editFormData.sgst);
      formData.append("sortOrder", editFormData.position);
      if (editFormData.image) {
        formData.append("image", editFormData.image);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/update-main-category`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      const data = await response.json();
      if (data.success) {
        setCategories((prevCategories) =>
          prevCategories.map((cat) =>
            cat.id === currentCategory.id ? data.category : cat
          )
        );
        setIsEditDialogOpen(false);
       toast.success("Category updated successfully");
      } else {
        throw new Error(data.message || "Failed to update category");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleAddCategory = async () => {
    if (!addFormData.name) {
      toast.error("Category name is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", addFormData.name);
      formData.append("description", addFormData.description);
      formData.append("igst", addFormData.igst);
      formData.append("cgst", addFormData.cgst);
      formData.append("sgst", addFormData.sgst);
      formData.append("sortOrder", addFormData.position);
      if (addFormData.image) {
        formData.append("image", addFormData.image);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_UR}admin/add-main-category`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add category");
      }

      const data = await response.json();
      if (data.success) {
        setCategories((prevCategories) => [...prevCategories, data.category]);
        setIsAddDialogOpen(false);
        setAddFormData({
          name: "",
          description: "",
          igst: "",
          cgst: "",
          sgst: "",
          position: "",
          image: null,
        });
        setAddImagePreview("");
        toast.success("Category added successfully");
      } else {
        throw new Error(data.message || "Failed to add category");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading categories...
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
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName" >Category Name</Label>
                  <Input
                    id="categoryName"
                    name="name"
                    className="mt-4 "
                    value={addFormData.name}
                    onChange={handleAddFormChange}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    className="mt-4"
                    value={addFormData.description}
                    onChange={handleAddFormChange}
                    placeholder="Enter description"
                  />
                </div>
                <div className="flex space-x-4">
                  <div>
                    <Label htmlFor="cgst">CGST (%)</Label>
                    <Input
                      id="cgst"
                      name="cgst"
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-4"
                      required
                      placeholder="Enter CGST"
                      value={addFormData.cgst ?? ""}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, cgst: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="sgst">SGST (%)</Label>
                    <Input
                      id="sgst"
                      name="sgst"
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-4"
                      required
                      placeholder="Enter SGST"
                      value={addFormData.sgst ?? ""}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, sgst: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="igst">IGST (%) <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      id="igst"
                      name="igst"
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-4"
                      placeholder="Enter IGST"
                      value={addFormData.igst ?? ""}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, igst: e.target.value })
                      }
                    />
                  </div>
                </div>
                {/* //position */}

                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    type="number"
                    min="0"
                    className="mt-4"
                    placeholder="Enter position"
                    value={addFormData.position ?? ""}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, position: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="image">Category Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="mt-4"
                    onChange={handleAddImageChange}
                  />
                  {addImagePreview && (
                    <div className="mt-2">
                      <img
                        src={addImagePreview}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setAddImagePreview("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory}>Add Category</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({filteredCategories.length})</CardTitle>
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
                <TableHead>SGST</TableHead>
                <TableHead>CGST</TableHead>
              
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className="hover:bg-gray-50">
                  <TableCell>
                    {filteredCategories.indexOf(category) + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{category.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm text-gray-500">
                        {category.description.toString().slice(0, 40)}
                      </div>
                    </div>
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
                  <TableCell>{category.sgst}</TableCell>
                  <TableCell>{category.cgst}</TableCell>
                 
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Products
                        </DropdownMenuItem> */}
                        <DropdownMenuItem
                          onClick={() => handleEditClick(category)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={async () => {
                          if (
                            confirm(
                            "Are you sure you want to delete this category?"
                            )
                          ) {
                            try {
                            const response = await fetch(
                              `${
                              import.meta.env.VITE_BASE_UR
                              }admin/delete-main-category/${category.id}`,
                              {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              }
                            );

                            if (!response.ok) {
                              let errorMsg = "Failed to delete category";
                              try {
                              const errorData = await response.json();
                              if (errorData?.message) errorMsg = errorData.message;
                              } catch {
                              // ignore JSON parse error
                              }
                              throw new Error(errorMsg);
                            }

                            const data = await response.json();
                            if (data.success) {
                              setCategories((prevCategories) =>
                              prevCategories.filter(
                                (cat) => cat.id !== category.id
                              )
                              );
                              toast.success("Category deleted successfully");
                            } else {
                              throw new Error(
                              data.message || "Failed to delete category"
                              );
                            }
                            } catch (err) {
                            toast.error(
                              err instanceof Error
                              ? err.message
                              : "An unknown error occurred"
                            );
                            }
                          }
                          }}
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
                  <TableCell colSpan={8} className="text-center font-semibold text-gray-800">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={editFormData.name}
                onChange={handleEditFormChange}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                name="description"
                value={editFormData.description}
                onChange={handleEditFormChange}
                placeholder="Enter description"
              />
            </div>
            <div className="flex space-x-4">
              <div>
                <Label htmlFor="edit-cgst">CGST (%)</Label>
                <Input
                  id="edit-cgst"
                  name="cgst"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.cgst ?? ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, cgst: e.target.value })
                  }
                  placeholder="Enter CGST"
                />
              </div>
              <div>
                <Label htmlFor="edit-sgst">SGST (%)</Label>
                <Input
                  id="edit-sgst"
                  name="sgst"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.sgst ?? ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, sgst: e.target.value })
                  }
                  placeholder="Enter SGST"
                />
              </div>
              <div>
                <Label htmlFor="edit-igst">
                  IGST (%) <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="edit-igst"
                  name="igst"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.igst ?? ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, igst: e.target.value })
                  }
                  placeholder="Enter IGST"
                />
              </div>
            </div>
            {/* position */}
            <div>
              <Label htmlFor="edit-position">Position</Label>
              <Input
                id="edit-position"
                name="position"
                type="number"
                min="0"
                className="mt-4"
                placeholder="Enter position"
                value={editFormData.position ?? ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, position: e.target.value })
                }
              />
            </div>


            <div>
              <Label htmlFor="edit-image">Category Image</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateCategory}>Update Category</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
