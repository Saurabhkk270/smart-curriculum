import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, UserCheck, UserX, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const AdminStudents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    student_id: "", // Enrollment No
    roll_no: "",
    course: "",
    branch: "",
    semester: "",
    section: "",
    account_status: "active",
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("full_name", { ascending: true });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        throw error;
      }
      return data;
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      if (!editingStudent) return;
      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", editingStudent.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Student updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleEdit = (student: Profile) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name || "",
      email: student.email || "",
      student_id: student.student_id || "",
      roll_no: student.roll_no || "",
      course: student.course || "",
      branch: student.branch || "",
      semester: student.semester || "",
      section: student.section || "",
      account_status: student.account_status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    updateStudentMutation.mutate({
      full_name: formData.full_name,
      student_id: formData.student_id,
      roll_no: formData.roll_no,
      course: formData.course,
      branch: formData.branch,
      semester: formData.semester,
      section: formData.section,
      account_status: formData.account_status,
    });
  };

  const filteredStudents = students?.filter((student) =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">
            Manage all student records and accounts.
          </p>
        </div>
        <Button onClick={() => toast({ description: "Use Bulk Import or Admin Provisioning API to create new accounts." })}>
          <Plus className="mr-2 h-4 w-4" /> Provision Account
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Enrollment No</TableHead>
              <TableHead>Course & Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : filteredStudents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-sm text-muted-foreground">{student.email}</div>
                  </TableCell>
                  <TableCell>
                    <div>{student.student_id || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">Roll: {student.roll_no || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    <div>{student.course || "N/A"} - {student.branch || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">
                      Sem: {student.semester || "N/A"} | Sec: {student.section || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      student.account_status === 'active' ? 'bg-green-100 text-green-800' :
                      student.account_status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {student.account_status || 'active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                      Edit Record
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student Record</DialogTitle>
            <DialogDescription>
              Update official academic identity for {editingStudent?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email (Read-only)</Label>
              <Input value={formData.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Enrollment Number</Label>
              <Input value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input value={formData.roll_no} onChange={e => setFormData({...formData, roll_no: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Input value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Input value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Account Status</Label>
              <Select value={formData.account_status} onValueChange={v => setFormData({...formData, account_status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateStudentMutation.isPending}>
              {updateStudentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
