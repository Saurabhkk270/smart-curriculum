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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ClassItem = Database["public"]["Tables"]["classes"]["Row"];

interface TeacherWithClasses extends Profile {
  assignedClasses?: ClassItem[];
}

const AdminTeachers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isClassesOpen, setIsClassesOpen] = useState(false);
  const [deleteTeacher, setDeleteTeacher] = useState<TeacherWithClasses | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<TeacherWithClasses | null>(null);

  // Add Form state
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    course: "",
    branch: "",
    password: "Teacher@123",
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Form state
  const [editForm, setEditForm] = useState({
    full_name: "",
    course: "",
    branch: "",
    account_status: "active",
  });

  // New Class Assignment State
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // 1. Fetch teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .order("full_name", { ascending: true });

      if (profilesError) {
        toast({
          title: "Error fetching teachers",
          description: profilesError.message,
          variant: "destructive",
        });
        throw profilesError;
      }

      // Fetch classes to map assignment
      const { data: classesData } = await supabase.from("classes").select("*");

      const enriched: TeacherWithClasses[] = (profilesData || []).map((teacher) => ({
        ...teacher,
        assignedClasses: (classesData || []).filter((c) => c.teacher_id === teacher.id),
      }));

      return enriched;
    },
  });

  // 2. Mutations
  const updateTeacherMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Profile> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(payload.data)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      setIsEditOpen(false);
      toast({ title: "Updated", description: "Teacher details saved successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast({ title: "Status Updated", description: "Account status was toggled." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      setDeleteTeacher(null);
      toast({ title: "Deleted", description: "Teacher record removed successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  // Handle Add Teacher via admin-provision edge function
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name || !addForm.email) {
      toast({
        title: "Required Fields Missing",
        description: "Please enter teacher name and email.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const payload = [
        {
          full_name: addForm.full_name,
          email: addForm.email,
          role: "teacher",
          course: addForm.course || null,
          branch: addForm.branch || null,
          password: addForm.password || "Teacher@123",
          account_status: "active",
        },
      ];

      const { data: resData, error: invokeError } = await supabase.functions.invoke(
        "admin-provision",
        {
          body: { users: payload },
        }
      );

      if (invokeError) throw invokeError;

      const result = resData?.results?.[0];
      if (result && !result.success) {
        throw new Error(result.error || "Failed to create teacher account");
      }

      toast({
        title: "Teacher Created!",
        description: `Account created for ${addForm.full_name}. Temporary password: ${addForm.password}`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      setIsAddOpen(false);
      setAddForm({
        full_name: "",
        email: "",
        course: "",
        branch: "",
        password: "Teacher@123",
      });
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Quick Add Class for Teacher
  const handleAssignNewClass = async () => {
    if (!activeTeacher || !newClassName.trim() || !newClassCode.trim()) {
      toast({
        title: "Missing Info",
        description: "Please enter both class name and subject code.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingClass(true);
    try {
      const { error } = await supabase.from("classes").insert({
        name: newClassName.trim(),
        code: newClassCode.trim().toUpperCase(),
        teacher_id: activeTeacher.id,
      });

      if (error) throw error;

      toast({
        title: "Class Created & Assigned",
        description: `${newClassName} (${newClassCode}) assigned to ${activeTeacher.full_name}.`,
      });

      setNewClassName("");
      setNewClassCode("");
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
    } catch (err: any) {
      toast({
        title: "Failed to assign class",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  // Open Edit Dialog
  const openEdit = (teacher: TeacherWithClasses) => {
    setActiveTeacher(teacher);
    setEditForm({
      full_name: teacher.full_name || "",
      course: teacher.course || "",
      branch: teacher.branch || "",
      account_status: teacher.account_status || "active",
    });
    setIsEditOpen(true);
  };

  // Open Classes Dialog
  const openClasses = (teacher: TeacherWithClasses) => {
    setActiveTeacher(teacher);
    setIsClassesOpen(true);
  };

  // Filtered List
  const departments = Array.from(
    new Set(teachers?.map((t) => t.course).filter(Boolean) as string[])
  );

  const filteredTeachers = teachers?.filter((teacher) => {
    const matchesSearch =
      teacher.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.course?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && teacher.account_status !== "suspended") ||
      (statusFilter === "suspended" && teacher.account_status === "suspended");

    const matchesDept =
      departmentFilter === "all" || teacher.course === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Metrics
  const totalTeachers = teachers?.length || 0;
  const activeCount =
    teachers?.filter((t) => t.account_status !== "suspended").length || 0;
  const totalClasses =
    teachers?.reduce((acc, t) => acc + (t.assignedClasses?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Faculty & Teachers</h2>
          <p className="text-muted-foreground">
            Manage faculty members, academic departments, and assigned class loads.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Teacher
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <GraduationCap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCount} active, {totalTeachers - activeCount} suspended
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Status</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Authorized to conduct sessions & mark attendance
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classes Assigned</CardTitle>
            <BookOpen className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all registered subjects & semesters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, dept..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Department Filter */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[280px]">Teacher Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Department / Branch</TableHead>
              <TableHead className="text-center">Assigned Classes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading faculty members...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTeachers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No teachers found</p>
                  <p className="text-xs">Try adjusting your search or filters.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeachers?.map((teacher) => {
                const isSuspended = teacher.account_status === "suspended";
                const classCount = teacher.assignedClasses?.length || 0;

                return (
                  <TableRow key={teacher.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {teacher.full_name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {teacher.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {teacher.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {teacher.email}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-sm">
                        {teacher.course || "General"}
                      </div>
                      {teacher.branch && (
                        <div className="text-xs text-muted-foreground">
                          {teacher.branch}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openClasses(teacher)}
                        className="gap-1.5 h-8 text-xs font-normal hover:bg-primary/10"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold">{classCount}</span>{" "}
                        {classCount === 1 ? "Class" : "Classes"}
                      </Button>
                    </TableCell>

                    <TableCell>
                      {isSuspended ? (
                        <Badge variant="destructive" className="gap-1 font-normal text-xs">
                          <XCircle className="h-3 w-3" /> Suspended
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-normal text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Teacher Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEdit(teacher)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openClasses(teacher)}>
                            <BookOpen className="h-4 w-4 mr-2" /> Manage Classes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: teacher.id,
                                newStatus: isSuspended ? "active" : "suspended",
                              })
                            }
                          >
                            {isSuspended ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                                Activate Account
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2 text-amber-600" />
                                Suspend Account
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTeacher(teacher)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 1. ADD TEACHER MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleAddTeacher}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Add New Faculty Member
              </DialogTitle>
              <DialogDescription>
                Provision a teacher login account and assign their academic department.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Full Name *</Label>
                <Input
                  id="t-name"
                  placeholder="e.g. Dr. Robert Vance"
                  value={addForm.full_name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-email">Official Email Address *</Label>
                <Input
                  id="t-email"
                  type="email"
                  placeholder="e.g. robert.vance@university.edu"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="t-dept">Department / Course</Label>
                  <Input
                    id="t-dept"
                    placeholder="e.g. B.Tech / CSE"
                    value={addForm.course}
                    onChange={(e) =>
                      setAddForm({ ...addForm, course: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-branch">Specialization / Branch</Label>
                  <Input
                    id="t-branch"
                    placeholder="e.g. AI & Robotics"
                    value={addForm.branch}
                    onChange={(e) =>
                      setAddForm({ ...addForm, branch: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-pwd" className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  Initial Password
                </Label>
                <Input
                  id="t-pwd"
                  type="text"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm({ ...addForm, password: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  The faculty member can log in immediately with this password.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmittingAdd}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingAdd}>
                {isSubmittingAdd ? "Provisioning..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. EDIT TEACHER MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit Faculty Details</DialogTitle>
            <DialogDescription>
              Update department, specialization, or access status for{" "}
              <span className="font-semibold text-foreground">
                {activeTeacher?.full_name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, full_name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input
                  value={editForm.course}
                  onChange={(e) =>
                    setEditForm({ ...editForm, course: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Input
                  value={editForm.branch}
                  onChange={(e) =>
                    setEditForm({ ...editForm, branch: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Account Access Status</Label>
              <Select
                value={editForm.account_status}
                onValueChange={(val) =>
                  setEditForm({ ...editForm, account_status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Full Access)</SelectItem>
                  <SelectItem value="suspended">
                    Suspended (Blocked from Login)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={updateTeacherMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (activeTeacher) {
                  updateTeacherMutation.mutate({
                    id: activeTeacher.id,
                    data: {
                      full_name: editForm.full_name,
                      course: editForm.course || null,
                      branch: editForm.branch || null,
                      account_status: editForm.account_status,
                    },
                  });
                }
              }}
              disabled={updateTeacherMutation.isPending}
            >
              {updateTeacherMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. MANAGE TEACHER CLASSES MODAL */}
      <Dialog open={isClassesOpen} onOpenChange={setIsClassesOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Classes & Subjects Assigned
            </DialogTitle>
            <DialogDescription>
              Classes assigned to{" "}
              <span className="font-semibold text-foreground">
                {activeTeacher?.full_name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* List of current assigned classes */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Classes ({activeTeacher?.assignedClasses?.length || 0})
              </Label>
              {activeTeacher?.assignedClasses?.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/40 text-center text-sm text-muted-foreground">
                  No classes assigned to this faculty member yet.
                </div>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {activeTeacher?.assignedClasses?.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3 flex items-center justify-between hover:bg-muted/30"
                    >
                      <div>
                        <div className="font-medium text-sm">{cls.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">
                          Code: {cls.code}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick assign new class */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assign New Class / Subject
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Subject Name (e.g. Data Structures)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
                <Input
                  placeholder="Code (e.g. CS201)"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={handleAssignNewClass}
                disabled={isCreatingClass || !newClassName || !newClassCode}
              >
                <Plus className="h-4 w-4" />
                {isCreatingClass ? "Assigning..." : "Create & Assign Subject"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. DELETE CONFIRMATION ALERT */}
      <AlertDialog
        open={!!deleteTeacher}
        onOpenChange={(open) => !open && setDeleteTeacher(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Delete Faculty Member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTeacher?.full_name}
              </span>
              ? This will remove their teacher profile and dissociate their classes.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteTeacher) {
                  deleteTeacherMutation.mutate(deleteTeacher.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTeachers;
