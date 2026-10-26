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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  ArrowRight,
  Sparkles,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ClassItem = Database["public"]["Tables"]["classes"]["Row"];
type EnrollmentItem = Database["public"]["Tables"]["class_enrollments"]["Row"];

interface ClassWithDetails extends ClassItem {
  teacher?: Profile | null;
  enrollmentCount?: number;
}

const AdminAcademics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isEnrollmentsOpen, setIsEnrollmentsOpen] = useState(false);
  const [deleteClassItem, setDeleteClassItem] = useState<ClassWithDetails | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);

  // Forms
  const [classForm, setClassForm] = useState({
    name: "",
    code: "",
    teacher_id: "",
  });

  // Enrollment management
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState("");

  // Semester Promotion State
  const [promoCourse, setPromoCourse] = useState("");
  const [promoCurrentSem, setPromoCurrentSem] = useState("");
  const [promoTargetSem, setPromoTargetSem] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  // 1. Fetch Classes with Teachers and Enrollment Counts
  const { data: classes, isLoading: isClassesLoading } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: async () => {
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("name", { ascending: true });

      if (classesError) throw classesError;

      const { data: teachersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher");

      const { data: enrollmentsData } = await supabase
        .from("class_enrollments")
        .select("class_id");

      const teachersMap = new Map((teachersData || []).map((t) => [t.id, t]));
      const countMap = new Map<string, number>();

      (enrollmentsData || []).forEach((e) => {
        countMap.set(e.class_id, (countMap.get(e.class_id) || 0) + 1);
      });

      const enriched: ClassWithDetails[] = (classesData || []).map((c) => ({
        ...c,
        teacher: teachersMap.get(c.teacher_id) || null,
        enrollmentCount: countMap.get(c.id) || 0,
      }));

      return enriched;
    },
  });

  // 2. Fetch All Teachers for Dropdowns
  const { data: teachersList } = useQuery({
    queryKey: ["admin-teachers-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, course, branch")
        .eq("role", "teacher")
        .order("full_name");
      return data || [];
    },
  });

  // 3. Fetch All Students
  const { data: studentsList } = useQuery({
    queryKey: ["admin-students-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, student_id, email, course, semester, branch")
        .eq("role", "student")
        .order("full_name");
      return data || [];
    },
  });

  // 4. Fetch Enrolled Students for Selected Class
  const { data: currentEnrollments, isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ["class-enrollments", selectedClass?.id],
    enabled: !!selectedClass?.id && isEnrollmentsOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select("id, student_id, enrolled_at")
        .eq("class_id", selectedClass!.id);

      if (error) throw error;

      const studentIds = data.map((e) => e.student_id);
      if (studentIds.length === 0) return [];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", studentIds);

      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      return data.map((e) => ({
        enrollmentId: e.id,
        enrolled_at: e.enrolled_at,
        student: profilesMap.get(e.student_id),
      }));
    },
  });

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: async (payload: { name: string; code: string; teacher_id: string }) => {
      const { error } = await supabase.from("classes").insert({
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        teacher_id: payload.teacher_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      setIsAddClassOpen(false);
      setClassForm({ name: "", code: "", teacher_id: "" });
      toast({ title: "Class Created", description: "Subject has been registered." });
    },
    onError: (err: any) => {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; code: string; teacher_id: string }) => {
      const { error } = await supabase
        .from("classes")
        .update({
          name: payload.name.trim(),
          code: payload.code.trim().toUpperCase(),
          teacher_id: payload.teacher_id,
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      setIsEditClassOpen(false);
      toast({ title: "Class Updated", description: "Subject details saved." });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      setDeleteClassItem(null);
      toast({ title: "Deleted", description: "Class removed from curriculum." });
    },
    onError: (err: any) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      if (!selectedClass) return;
      const { error } = await supabase.from("class_enrollments").insert({
        class_id: selectedClass.id,
        student_id: studentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-enrollments", selectedClass?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      setSelectedStudentToEnroll("");
      toast({ title: "Enrolled", description: "Student enrolled in class." });
    },
    onError: (err: any) => {
      toast({ title: "Enrollment Failed", description: err.message, variant: "destructive" });
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-enrollments", selectedClass?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Removed", description: "Student unenrolled from class." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  // Handle Bulk Semester Promotion
  const handleBulkPromote = async () => {
    if (!promoCourse || !promoCurrentSem || !promoTargetSem) {
      toast({
        title: "Missing Selections",
        description: "Please specify Course, Current Semester, and Target Semester.",
        variant: "destructive",
      });
      return;
    }

    setIsPromoting(true);
    try {
      const { data: studentsToPromote, error: fetchErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "student")
        .eq("course", promoCourse)
        .eq("semester", promoCurrentSem);

      if (fetchErr) throw fetchErr;

      if (!studentsToPromote || studentsToPromote.length === 0) {
        toast({
          title: "No Students Found",
          description: `No students found matching ${promoCourse} - Semester ${promoCurrentSem}.`,
          variant: "destructive",
        });
        return;
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ semester: promoTargetSem })
        .eq("role", "student")
        .eq("course", promoCourse)
        .eq("semester", promoCurrentSem);

      if (updateErr) throw updateErr;

      toast({
        title: "Promotion Successful! 🎉",
        description: `Promoted ${studentsToPromote.length} students from Semester ${promoCurrentSem} to Semester ${promoTargetSem}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-students-list"] });
      setPromoCourse("");
      setPromoCurrentSem("");
      setPromoTargetSem("");
    } catch (err: any) {
      toast({
        title: "Promotion Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  // Open Edit
  const openEdit = (c: ClassWithDetails) => {
    setSelectedClass(c);
    setClassForm({
      name: c.name,
      code: c.code,
      teacher_id: c.teacher_id,
    });
    setIsEditClassOpen(true);
  };

  // Open Enrollments
  const openEnrollments = (c: ClassWithDetails) => {
    setSelectedClass(c);
    setIsEnrollmentsOpen(true);
  };

  // Filtering
  const filteredClasses = classes?.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTeacher =
      teacherFilter === "all" || c.teacher_id === teacherFilter;

    return matchesSearch && matchesTeacher;
  });

  // Calculate Metrics
  const totalClassesCount = classes?.length || 0;
  const totalEnrollmentsCount =
    classes?.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0) || 0;
  const assignedTeachersCount = new Set(classes?.map((c) => c.teacher_id)).size;

  // Department analytics from profiles
  const departmentStats = (studentsList || []).reduce((acc: any, s) => {
    const dept = s.branch || s.course || "General";
    if (!acc[dept]) acc[dept] = { students: 0, semesters: new Set<string>() };
    acc[dept].students += 1;
    if (s.semester) acc[dept].semesters.add(s.semester);
    return acc;
  }, {});

  const coursesList = Array.from(
    new Set((studentsList || []).map((s) => s.course).filter(Boolean) as string[])
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Curriculum</h2>
          <p className="text-muted-foreground">
            Manage subjects, course catalog, teacher assignments, and student enrollments.
          </p>
        </div>
        <Button onClick={() => setIsAddClassOpen(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Create New Subject
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects & Classes</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClassesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active across all degrees and branches
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollmentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Student-to-subject active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faculty Instructors</CardTitle>
            <GraduationCap className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedTeachersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Teachers actively assigned to subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes" className="gap-2">
            <BookOpen className="h-4 w-4" /> Subjects Catalog
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" /> Departments & Batches
          </TabsTrigger>
          <TabsTrigger value="promotion" className="gap-2">
            <Sparkles className="h-4 w-4" /> Semester Promotion
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SUBJECTS CATALOG */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject or code..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter by Teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instructors</SelectItem>
                {teachersList?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[120px]">Subject Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Assigned Instructor</TableHead>
                  <TableHead className="text-center">Enrolled Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isClassesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading subjects catalog...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClasses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No subjects found</p>
                      <p className="text-xs">Create your first subject or adjust search.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs font-semibold">
                          {item.code}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        {item.name}
                      </TableCell>

                      <TableCell>
                        {item.teacher ? (
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {item.teacher.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {item.teacher.full_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.teacher.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEnrollments(item)}
                          className="gap-1.5 h-8 text-xs hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span className="font-semibold">{item.enrollmentCount}</span> Students
                        </Button>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Subject Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit Subject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEnrollments(item)}>
                              <UserPlus className="h-4 w-4 mr-2" /> Manage Enrollments
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteClassItem(item)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Subject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 2: DEPARTMENTS & BATCHES */}
        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.keys(departmentStats).length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground border rounded-xl bg-card">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No department data recorded yet.</p>
                <p className="text-xs">Add students or faculty with branches to see metrics.</p>
              </div>
            ) : (
              Object.entries(departmentStats).map(([dept, data]: [string, any]) => (
                <Card key={dept} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">{dept}</CardTitle>
                      <Badge variant="secondary">{data.students} Students</Badge>
                    </div>
                    <CardDescription>Academic Department</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground">Active Semesters:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(data.semesters).sort().map((sem: any) => (
                        <Badge key={sem} variant="outline" className="text-xs">
                          Sem {sem}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 3: BATCH & SEMESTER PROMOTION */}
        <TabsContent value="promotion">
          <Card className="border shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Bulk Semester Promotion
              </CardTitle>
              <CardDescription>
                Promote all students of a specific course from their current semester to the next
                semester in one click (e.g. at the start of a new term).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Select Degree / Course</Label>
                <Select value={promoCourse} onValueChange={setPromoCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Course (e.g. B.Tech)" />
                  </SelectTrigger>
                  <SelectContent>
                    {coursesList.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <Label>Current Semester</Label>
                  <Select value={promoCurrentSem} onValueChange={setPromoCurrentSem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Current" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <SelectItem key={s} value={s.toString()}>
                          Semester {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Target Promoted Semester</Label>
                  <Select value={promoTargetSem} onValueChange={setPromoTargetSem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, "Graduated"].map((s) => (
                        <SelectItem key={s} value={s.toString()}>
                          {s === "Graduated" ? "Graduated / Alumni" : `Semester ${s}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  This operation will instantly update the academic semester of all students
                  matching the selected course and current semester.
                </span>
              </div>
            </CardContent>
            <DialogFooter className="p-6 pt-0">
              <Button
                onClick={handleBulkPromote}
                disabled={isPromoting || !promoCourse || !promoCurrentSem || !promoTargetSem}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                {isPromoting ? "Promoting..." : "Execute Bulk Promotion"}
              </Button>
            </DialogFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 1. CREATE CLASS MODAL */}
      <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Register New Subject
            </DialogTitle>
            <DialogDescription>
              Add a new course subject and assign a faculty member to lead it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Subject Name *</Label>
              <Input
                placeholder="e.g. Data Structures & Algorithms"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Subject Code *</Label>
              <Input
                placeholder="e.g. CS201"
                value={classForm.code}
                onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Faculty Instructor *</Label>
              <Select
                value={classForm.teacher_id}
                onValueChange={(val) => setClassForm({ ...classForm, teacher_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty instructor" />
                </SelectTrigger>
                <SelectContent>
                  {teachersList?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name} ({t.course || "General"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddClassOpen(false)}
              disabled={createClassMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!classForm.name || !classForm.code || !classForm.teacher_id) {
                  toast({
                    title: "Missing Fields",
                    description: "Please fill in all subject details.",
                    variant: "destructive",
                  });
                  return;
                }
                createClassMutation.mutate(classForm);
              }}
              disabled={createClassMutation.isPending}
            >
              {createClassMutation.isPending ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. EDIT CLASS MODAL */}
      <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Subject Details</DialogTitle>
            <DialogDescription>
              Update name, code, or change the assigned teacher.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Subject Name</Label>
              <Input
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Subject Code</Label>
              <Input
                value={classForm.code}
                onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Faculty Instructor</Label>
              <Select
                value={classForm.teacher_id}
                onValueChange={(val) => setClassForm({ ...classForm, teacher_id: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teachersList?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name} ({t.course || "General"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditClassOpen(false)}
              disabled={updateClassMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedClass) {
                  updateClassMutation.mutate({
                    id: selectedClass.id,
                    name: classForm.name,
                    code: classForm.code,
                    teacher_id: classForm.teacher_id,
                  });
                }
              }}
              disabled={updateClassMutation.isPending}
            >
              {updateClassMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. MANAGE ENROLLMENTS MODAL */}
      <Dialog open={isEnrollmentsOpen} onOpenChange={setIsEnrollmentsOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Manage Subject Enrollments
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.name} ({selectedClass?.code}) • Instructor:{" "}
              {selectedClass?.teacher?.full_name || "Unassigned"}
            </DialogDescription>
          </DialogHeader>

          {/* Enroll New Student Search & Select */}
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Enroll Student
            </Label>
            <div className="flex gap-2">
              <Select
                value={selectedStudentToEnroll}
                onValueChange={setSelectedStudentToEnroll}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select student to enroll..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {(studentsList || [])
                    .filter(
                      (s) =>
                        !currentEnrollments?.some((e) => e.student?.id === s.id)
                    )
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} ({s.student_id || s.email}) - {s.course} Sem {s.semester}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (selectedStudentToEnroll) {
                    enrollStudentMutation.mutate(selectedStudentToEnroll);
                  }
                }}
                disabled={!selectedStudentToEnroll || enrollStudentMutation.isPending}
              >
                <UserPlus className="h-4 w-4" />
                Enroll
              </Button>
            </div>
          </div>

          {/* List of currently enrolled students */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] border rounded-lg p-2">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Currently Enrolled ({currentEnrollments?.length || 0})
            </div>
            {isEnrollmentsLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading enrollments...
              </div>
            ) : currentEnrollments?.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No students enrolled in this subject yet.
              </div>
            ) : (
              currentEnrollments?.map((item) => (
                <div
                  key={item.enrollmentId}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40 text-sm"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {item.student?.full_name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {item.student?.student_id || item.student?.email} • {item.student?.course}{" "}
                      Sem {item.student?.semester}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:bg-destructive/10"
                    onClick={() => removeEnrollmentMutation.mutate(item.enrollmentId)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollmentsOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. DELETE CLASS CONFIRMATION */}
      <AlertDialog
        open={!!deleteClassItem}
        onOpenChange={(open) => !open && setDeleteClassItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Delete Subject?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteClassItem?.name} ({deleteClassItem?.code})
              </span>
              ? All attendance sessions and enrollments associated with this subject will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteClassItem) {
                  deleteClassMutation.mutate(deleteClassItem.id);
                }
              }}
            >
              Delete Subject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAcademics;
