import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import Cookies from "js-cookie";

export function ContactQueriesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
    const token = Cookies.get("admin_token");

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_UR}admin/get-contact-us-query`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setQueries(response.data.data);
        } else {
          throw new Error(response.data.message || "Failed to fetch queries");
        }
      } catch (err) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, [toast]);

  const filteredQueries = queries.filter((query) => {
    return (
      query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleViewMessage = (query) => {
    setSelectedQuery(query);
    setIsDialogOpen(true);
  };

//   const handleDeleteQuery = async (queryId) => {
//     try {
//       const response = await axios.delete(
//         `http://localhost:3000/api/admin/delete-contact-us-query/${queryId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       if (response.data.success) {
//         setQueries(queries.filter((q) => q.id !== queryId));
//         toast({
//           title: "Success",
//           description: "Query deleted successfully",
//         });
//       } else {
//         throw new Error(response.data.message || "Failed to delete query");
//       }
//     } catch (err) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: err.message,
//       });
//     }
//   };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 px-2 mx-auto">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Queries Table */}
      <Card className="overflow-x-auto w-full">
        <CardHeader>
          <CardTitle>Contact Queries ({filteredQueries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueries.map((query) => (
                  <TableRow key={query.id} className="hover:bg-gray-50">
                    <TableCell>{filteredQueries.indexOf(query) + 1}</TableCell>
                    <TableCell className="font-medium">{query.name}</TableCell>
                    <TableCell>{query.email}</TableCell>
                    <TableCell>{query.phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {query.subject}
                    </TableCell>
                    <TableCell>{formatDate(query.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewMessage(query)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Message
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteQuery(query.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredQueries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center font-semibold text-gray-500">
                      No queries found.
                    </TableCell>
                  </TableRow>
                )}
                
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Message View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedQuery && (
            <>
              <DialogHeader>
                <DialogTitle>Query Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm">{selectedQuery.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedQuery.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedQuery.phone}</p>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <p className="text-sm">{formatDate(selectedQuery.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <Label>Subject</Label>
                  <p className="text-sm font-medium">{selectedQuery.subject}</p>
                </div>
                <div>
                  <Label>Message</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm whitespace-pre-line">
                      {selectedQuery.message}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}