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
  Plus,
  Search,
  Calendar,
  FileText,
  Clock,
  DoorOpen,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Save,
  Trash2,
  Edit,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Exam = Database["public"]["Tables"]["exams"]["Row"];
type ExamSchedule = Database["public"]["Tables"]["exam_schedules"]["Row"];
type ExamResult = Database["public"]["Tables"]["exam_results"]["Row"];
type ClassItem = Database["public"]["Tables"]["classes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ScheduleWithDetails extends ExamSchedule {
  exam?: Exam;
  classItem?: ClassItem;
  resultsCount?: number;
}

const AdminExaminations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("schedules");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");

  // Modals
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleWithDetails | null>(null);
  const [deleteScheduleItem, setDeleteScheduleItem] = useState<ScheduleWithDetails | null>(null);

  // Exam Form
  const [examForm, setExamForm] = useState({
    name: "",
    exam_type: "midterm",
    academic_year: "2026",
  });

  // Schedule Form
  const [scheduleForm, setScheduleForm] = useState({
    exam_id: "",
    class_id: "",
    exam_date: "",
    start_time: "09:30",
    end_time: "12:30",
    room_no: "Hall A-101",
    max_marks: 100,
    passing_marks: 40,
  });

  // Grading State: map of studentId -> { marks: number, remarks: string }
  const [gradingMarks, setGradingMarks] = useState<
    Record<string, { marks: number; remarks: string }>
  >({});
  const [isSavingGrades, setIsSavingGrades] = useState(false);

  // Table Missing State
  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // 1. Fetch Exam Terms
  const { data: exams } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") setTableMissing(true);
        return [];
      }
      setTableMissing(false);
      return data || [];
    },
  });

  // 2. Fetch Classes for dropdown
  const { data: classesList } = useQuery({
    queryKey: ["admin-classes-dropdown"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").order("name");
      return data || [];
    },
  });

  // 3. Fetch Exam Schedules
  const { data: schedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ["admin-exam-schedules"],
    queryFn: async () => {
      const { data: scheduleData, error } = await supabase
        .from("exam_schedules")
        .select("*")
        .order("exam_date", { ascending: true });

      if (error) {
        if (error.code === "42P01") setTableMissing(true);
        return [];
      }

      const { data: examsData } = await supabase.from("exams").select("*");
      const { data: classesData } = await supabase.from("classes").select("*");
      const { data: resultsData } = await supabase.from("exam_results").select("schedule_id");

      const examsMap = new Map((examsData || []).map((e) => [e.id, e]));
      const classesMap = new Map((classesData || []).map((c) => [c.id, c]));
      const resultsCountMap = new Map<string, number>();

      (resultsData || []).forEach((r) => {
        resultsCountMap.set(r.schedule_id, (resultsCountMap.get(r.schedule_id) || 0) + 1);
      });

      const enriched: ScheduleWithDetails[] = (scheduleData || []).map((s) => ({
        ...s,
        exam: examsMap.get(s.exam_id),
        classItem: classesMap.get(s.class_id),
        resultsCount: resultsCountMap.get(s.id) || 0,
      }));

      return enriched;
    },
  });

  // 4. Fetch Enrolled Students & Existing Results for Active Schedule in Grading Modal
  const { data: gradingData, isLoading: isGradingLoading } = useQuery({
    queryKey: ["schedule-grading", activeSchedule?.id],
    enabled: !!activeSchedule?.id && isGradingOpen,
    queryFn: async () => {
      if (!activeSchedule) return { enrolled: [], results: [] };

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("student_id")
        .eq("class_id", activeSchedule.class_id);

      const studentIds = (enrollments || []).map((e) => e.student_id);
      let students: Profile[] = [];
      if (studentIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", studentIds);
        students = profilesData || [];
      }

      // Get existing results
      const { data: existingResults } = await supabase
        .from("exam_results")
        .select("*")
        .eq("schedule_id", activeSchedule.id);

      // Pre-fill gradingMarks state
      const initialMarks: Record<string, { marks: number; remarks: string }> = {};
      (existingResults || []).forEach((r) => {
        initialMarks[r.student_id] = {
          marks: r.marks_obtained,
          remarks: r.remarks || "",
        };
      });
      setGradingMarks(initialMarks);

      return {
        enrolled: students,
        results: existingResults || [],
      };
    },
  });

  // Helper to calculate Grade
  const calculateGrade = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  // Mutations
  const createExamMutation = useMutation({
    mutationFn: async (payload: typeof examForm) => {
      const { error } = await supabase.from("exams").insert({
        name: payload.name.trim(),
        exam_type: payload.exam_type,
        academic_year: payload.academic_year.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      setIsAddExamOpen(false);
      setExamForm({ name: "", exam_type: "midterm", academic_year: "2026" });
      toast({ title: "Exam Term Created", description: "You can now schedule subject papers." });
    },
    onError: (err: any) => {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (payload: typeof scheduleForm) => {
      const { error } = await supabase.from("exam_schedules").insert({
        exam_id: payload.exam_id,
        class_id: payload.class_id,
        exam_date: payload.exam_date,
        start_time: payload.start_time,
        end_time: payload.end_time,
        room_no: payload.room_no.trim(),
        max_marks: Number(payload.max_marks),
        passing_marks: Number(payload.passing_marks),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exam-schedules"] });
      setIsAddScheduleOpen(false);
      toast({ title: "Paper Scheduled", description: "Exam timetable updated." });
    },
    onError: (err: any) => {
      toast({ title: "Scheduling Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exam-schedules"] });
      setDeleteScheduleItem(null);
      toast({ title: "Deleted", description: "Schedule paper removed." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  // Handle Save Grades
  const handleSaveGrades = async () => {
    if (!activeSchedule) return;
    setIsSavingGrades(true);

    try {
      const entries = Object.entries(gradingMarks);
      if (entries.length === 0) {
        toast({ title: "No Marks Entered", description: "Enter marks for at least one student." });
        return;
      }

      for (const [studentId, data] of entries) {
        const marks = Number(data.marks);
        const grade = calculateGrade(marks, activeSchedule.max_marks);
        const status = marks >= activeSchedule.passing_marks ? "pass" : "fail";

        const { error } = await supabase.from("exam_results").upsert(
          {
            schedule_id: activeSchedule.id,
            student_id: studentId,
            marks_obtained: marks,
            grade,
            status,
            remarks: data.remarks || null,
          },
          { onConflict: "schedule_id,student_id" }
        );

        if (error) throw error;
      }

      toast({
        title: "Results Saved! 🎉",
        description: `Successfully published grades for ${entries.length} students.`,
      });

      queryClient.invalidateQueries({ queryKey: ["schedule-grading", activeSchedule.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-exam-schedules"] });
      setIsGradingOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to Save Grades",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingGrades(false);
    }
  };

  const openGrading = (s: ScheduleWithDetails) => {
    setActiveSchedule(s);
    setIsGradingOpen(true);
  };

  const sqlSetup = `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  exam_type text not null default 'midterm',
  academic_year text default '2026',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  exam_date date not null,
  start_time time not null,
  end_time time not null,
  room_no text not null,
  max_marks integer not null default 100,
  passing_marks integer not null default 40,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
CREATE TABLE IF NOT EXISTS public.exam_results (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references public.exam_schedules(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  marks_obtained numeric not null,
  grade text not null,
  status text not null default 'pass',
  remarks text default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  CONSTRAINT exam_results_student_schedule_unique UNIQUE(schedule_id, student_id)
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can view exam schedules" ON public.exam_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can view results" ON public.exam_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and teachers manage exams" ON public.exams FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins and teachers manage schedules" ON public.exam_schedules FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins and teachers manage results" ON public.exam_results FOR ALL TO authenticated USING (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSetup);
    setCopiedSql(true);
    toast({ title: "SQL Copied!", description: "Paste into Supabase SQL editor whenever ready." });
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Filter
  const filteredSchedules = schedules?.filter((s) => {
    const matchesSearch =
      s.classItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.classItem?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room_no.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesExam = selectedExamId === "all" || s.exam_id === selectedExamId;

    return matchesSearch && matchesExam;
  });

  const totalExamsCount = exams?.length || 0;
  const totalSchedulesCount = schedules?.length || 0;
  const gradedPapersCount = schedules?.filter((s) => (s.resultsCount || 0) > 0).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Examinations & Results</h2>
          <p className="text-muted-foreground">
            Manage exam timetables, room halls, grading entries, and student results.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddExamOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Exam Term
          </Button>
          <Button onClick={() => setIsAddScheduleOpen(true)} className="gap-2 shadow-sm">
            <Calendar className="h-4 w-4" /> Schedule Paper
          </Button>
        </div>
      </div>

      {/* SQL Setup Banner */}
      {tableMissing && (
        <Card className="border-amber-400 bg-amber-500/10">
          <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Exams Database Tables Setup</p>
                <p className="text-xs text-muted-foreground">
                  The `exams`, `exam_schedules`, and `exam_results` migration is saved in your project.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={copySql} className="gap-1.5 flex-shrink-0">
              {copiedSql ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copiedSql ? "Copied SQL" : "Copy SQL Script"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exam Terms</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExamsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Midterms, Finals, & Assessments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Papers</CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchedulesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Class subjects scheduled with room halls</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Results Published</CardTitle>
            <Award className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedPapersCount} / {totalSchedulesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Papers with entered student grades</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subject or hall..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedExamId} onValueChange={setSelectedExamId}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Filter by Exam Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exam Terms</SelectItem>
            {exams?.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} ({e.exam_type.toUpperCase()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Schedules Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Exam Term</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Room Hall</TableHead>
              <TableHead className="text-center">Marks (Max / Pass)</TableHead>
              <TableHead className="text-center">Results Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSchedulesLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading examination schedule...
                </TableCell>
              </TableRow>
            ) : filteredSchedules?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-foreground">No exam papers scheduled yet</p>
                  <p className="text-xs mt-1">Click "Schedule Paper" to add a timetable entry.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules?.map((item) => {
                const hasResults = (item.resultsCount || 0) > 0;

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold text-sm">
                        {item.exam?.name || "Standard Exam"}
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono mt-0.5">
                        {item.exam?.exam_type || "Exam"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">
                        {item.classItem?.name || "Unknown Class"}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {item.classItem?.code}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(item.exam_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <DoorOpen className="h-3.5 w-3.5 text-primary" />
                        {item.room_no}
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      <span className="font-bold text-foreground">{item.max_marks}</span> /{" "}
                      <span className="text-muted-foreground">{item.passing_marks}</span>
                    </TableCell>

                    <TableCell className="text-center">
                      {hasResults ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-normal text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {item.resultsCount} Graded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                          Pending Grading
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant={hasResults ? "outline" : "default"}
                          onClick={() => openGrading(item)}
                          className="gap-1.5 h-8 text-xs font-medium"
                        >
                          <Award className="h-3.5 w-3.5" />
                          {hasResults ? "Edit Marks" : "Enter Marks"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteScheduleItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 1. CREATE EXAM TERM DIALOG */}
      <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Create Exam Term Session
            </DialogTitle>
            <DialogDescription>
              e.g. Midterm Spring 2026, Semester Final Exam 2026.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Exam Term Title *</Label>
              <Input
                placeholder="e.g. Spring 2026 Midterm Exams"
                value={examForm.name}
                onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Exam Type</Label>
                <Select
                  value={examForm.exam_type}
                  onValueChange={(val) => setExamForm({ ...examForm, exam_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final Exam</SelectItem>
                    <SelectItem value="quiz">Quiz / Unit Test</SelectItem>
                    <SelectItem value="practical">Practical / Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Input
                  value={examForm.academic_year}
                  onChange={(e) => setExamForm({ ...examForm, academic_year: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExamOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!examForm.name) {
                  toast({ title: "Name Required", variant: "destructive" });
                  return;
                }
                createExamMutation.mutate(examForm);
              }}
              disabled={createExamMutation.isPending}
            >
              {createExamMutation.isPending ? "Creating..." : "Create Term"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. SCHEDULE PAPER DIALOG */}
      <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule Exam Paper
            </DialogTitle>
            <DialogDescription>
              Assign date, time slot, and room hall for a subject paper.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Exam Term Session *</Label>
              <Select
                value={scheduleForm.exam_id}
                onValueChange={(val) => setScheduleForm({ ...scheduleForm, exam_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam Term" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.exam_type.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Class / Subject *</Label>
              <Select
                value={scheduleForm.class_id}
                onValueChange={(val) => setScheduleForm({ ...scheduleForm, class_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {classesList?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Exam Date *</Label>
                <Input
                  type="date"
                  value={scheduleForm.exam_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, exam_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Room / Hall *</Label>
                <Input
                  placeholder="e.g. Hall 204"
                  value={scheduleForm.room_no}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, room_no: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Max Marks</Label>
                <Input
                  type="number"
                  value={scheduleForm.max_marks}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, max_marks: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Passing Marks</Label>
                <Input
                  type="number"
                  value={scheduleForm.passing_marks}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, passing_marks: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!scheduleForm.exam_id || !scheduleForm.class_id || !scheduleForm.exam_date) {
                  toast({
                    title: "Missing Fields",
                    description: "Please select exam, class, and date.",
                    variant: "destructive",
                  });
                  return;
                }
                createScheduleMutation.mutate(scheduleForm);
              }}
              disabled={createScheduleMutation.isPending}
            >
              {createScheduleMutation.isPending ? "Scheduling..." : "Schedule Paper"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. MARKS ENTRY / GRADING MODAL */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Enter Exam Marks & Grades
            </DialogTitle>
            <DialogDescription>
              {activeSchedule?.classItem?.name} ({activeSchedule?.classItem?.code}) • Max Marks:{" "}
              {activeSchedule?.max_marks} • Pass: {activeSchedule?.passing_marks}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto border rounded-lg p-2 min-h-[260px]">
            {isGradingLoading ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                Loading enrolled students...
              </div>
            ) : gradingData?.enrolled.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-foreground">No students enrolled</p>
                <p className="text-xs">
                  Enroll students in this subject from the Academics page first.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Student Name</TableHead>
                    <TableHead>Enrollment No</TableHead>
                    <TableHead className="w-[120px]">Marks Obtained</TableHead>
                    <TableHead className="w-[80px] text-center">Grade</TableHead>
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingData?.enrolled.map((student) => {
                    const current = gradingMarks[student.id];
                    const marks = current?.marks ?? "";
                    const numMarks = Number(marks);
                    const grade = marks !== "" ? calculateGrade(numMarks, activeSchedule!.max_marks) : "-";
                    const isPass = numMarks >= (activeSchedule?.passing_marks || 40);

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-semibold text-sm">
                          {student.full_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {student.student_id || student.email}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={activeSchedule?.max_marks || 100}
                            placeholder="0"
                            className="h-8 text-center font-bold"
                            value={marks}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setGradingMarks({
                                ...gradingMarks,
                                [student.id]: {
                                  marks: val,
                                  remarks: current?.remarks || "",
                                },
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center font-bold text-sm">
                          {grade}
                        </TableCell>
                        <TableCell className="text-center">
                          {marks !== "" ? (
                            isPass ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 font-semibold text-xs">
                                PASS
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="font-semibold text-xs">
                                FAIL
                              </Badge>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Grades auto-calculated based on maximum score ({activeSchedule?.max_marks} marks).
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsGradingOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveGrades}
                disabled={isSavingGrades || gradingData?.enrolled.length === 0}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSavingGrades ? "Saving..." : "Save Results"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. DELETE CONFIRMATION ALERT */}
      <AlertDialog
        open={!!deleteScheduleItem}
        onOpenChange={(open) => !open && setDeleteScheduleItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Exam Schedule?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the scheduled paper for{" "}
              <span className="font-semibold text-foreground">
                {deleteScheduleItem?.classItem?.name} ({deleteScheduleItem?.classItem?.code})
              </span>
              ? Any marks recorded for this paper will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteScheduleItem) {
                  deleteScheduleMutation.mutate(deleteScheduleItem.id);
                }
              }}
            >
              Delete Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminExaminations;
