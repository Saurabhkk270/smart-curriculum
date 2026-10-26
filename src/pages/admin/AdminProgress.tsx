import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Printer,
  GraduationCap,
  FileText,
  UserCheck,
  UserX,
  Filter,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ExamResult = Database["public"]["Tables"]["exam_results"]["Row"];
type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];

interface StudentProgressData extends Profile {
  totalSessions: number;
  attendedSessions: number;
  attendancePercent: number;
  examResults: (ExamResult & { subjectName?: string; maxMarks?: number })[];
  averageScore: number;
  overallGrade: string;
  hasRisk: boolean;
  riskReason: string;
}

const AdminProgress = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  const [selectedStudent, setSelectedStudent] = useState<StudentProgressData | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // 1. Fetch Students, Attendance, and Exam Results
  const { data: progressData, isLoading } = useQuery({
    queryKey: ["admin-progress-reports"],
    queryFn: async () => {
      // Fetch students
      const { data: students, error: studentError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("full_name");

      if (studentError) throw studentError;

      // Fetch all attendance records
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("student_id, status");

      // Fetch all classes
      const { data: classesData } = await supabase.from("classes").select("id, name, code");
      const classesMap = new Map((classesData || []).map((c) => [c.id, c]));

      // Fetch exam schedules and results
      const { data: schedulesData } = await supabase.from("exam_schedules").select("*");
      const schedulesMap = new Map((schedulesData || []).map((s) => [s.id, s]));

      let resultsData: ExamResult[] = [];
      try {
        const { data: res } = await supabase.from("exam_results").select("*");
        resultsData = res || [];
      } catch (e) {
        // Table may not exist yet
      }

      // Compute statistics per student
      const attendanceMap = new Map<string, { total: number; attended: number }>();
      (attendanceData || []).forEach((rec) => {
        const current = attendanceMap.get(rec.student_id) || { total: 0, attended: 0 };
        current.total += 1;
        if (rec.status === "present") current.attended += 1;
        attendanceMap.set(rec.student_id, current);
      });

      const resultsMap = new Map<string, any[]>();
      (resultsData || []).forEach((r) => {
        const sched = schedulesMap.get(r.schedule_id);
        const cls = sched ? classesMap.get(sched.class_id) : null;
        const entry = {
          ...r,
          subjectName: cls ? `${cls.name} (${cls.code})` : "General Subject",
          maxMarks: sched?.max_marks || 100,
        };
        const list = resultsMap.get(r.student_id) || [];
        list.push(entry);
        resultsMap.set(r.student_id, list);
      });

      const enriched: StudentProgressData[] = (students || []).map((student) => {
        const att = attendanceMap.get(student.id) || { total: 0, attended: 0 };
        const attPct = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 100;

        const resList = resultsMap.get(student.id) || [];
        let avgScore = 0;
        let grade = "-";
        if (resList.length > 0) {
          const totalEarned = resList.reduce((acc, curr) => acc + Number(curr.marks_obtained), 0);
          const totalPossible = resList.reduce((acc, curr) => acc + Number(curr.maxMarks), 0);
          avgScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

          if (avgScore >= 90) grade = "A+";
          else if (avgScore >= 80) grade = "A";
          else if (avgScore >= 70) grade = "B";
          else if (avgScore >= 60) grade = "C";
          else if (avgScore >= 40) grade = "D";
          else grade = "F";
        }

        // Risk detection
        let hasRisk = false;
        let riskReason = "";
        if (att.total > 3 && attPct < 75) {
          hasRisk = true;
          riskReason = `Low Attendance (${attPct}%)`;
        } else if (resList.some((r) => r.status === "fail" || r.marks_obtained < 40)) {
          hasRisk = true;
          riskReason = "Failing Exam Score";
        }

        return {
          ...student,
          totalSessions: att.total,
          attendedSessions: att.attended,
          attendancePercent: attPct,
          examResults: resList,
          averageScore: avgScore,
          overallGrade: grade,
          hasRisk,
          riskReason,
        };
      });

      return enriched;
    },
  });

  const openReportCard = (student: StudentProgressData) => {
    setSelectedStudent(student);
    setIsReportOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter
  const courses = Array.from(
    new Set(progressData?.map((s) => s.course).filter(Boolean) as string[])
  );

  const filteredStudents = progressData?.filter((s) => {
    const matchesSearch =
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "risk" && s.hasRisk) ||
      (riskFilter === "good" && !s.hasRisk);

    const matchesCourse = courseFilter === "all" || s.course === courseFilter;

    return matchesSearch && matchesRisk && matchesCourse;
  });

  // Metrics
  const totalStudents = progressData?.length || 0;
  const avgCampusAttendance =
    totalStudents > 0
      ? Math.round(
          (progressData || []).reduce((acc, s) => acc + s.attendancePercent, 0) / totalStudents
        )
      : 0;

  const atRiskCount = progressData?.filter((s) => s.hasRisk).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Progress & Reports</h2>
          <p className="text-muted-foreground">
            Holistic academic performance tracking combining real-time attendance and exam results.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
            <GraduationCap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Monitored across all departments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <UserCheck className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCampusAttendance}%</div>
            <p className="text-xs text-muted-foreground mt-1">Institution-wide presence rate</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Academic Alerts / At-Risk</CardTitle>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {atRiskCount} Students
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Attendance &lt; 75% or failing exam marks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student or ID..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Standing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Standings</SelectItem>
              <SelectItem value="good">Good Standing</SelectItem>
              <SelectItem value="risk">At-Risk Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Student Details</TableHead>
              <TableHead>Course & Semester</TableHead>
              <TableHead className="w-[180px]">Attendance Rate</TableHead>
              <TableHead className="text-center">Exam Score Avg</TableHead>
              <TableHead className="text-center">Overall Grade</TableHead>
              <TableHead>Academic Standing</TableHead>
              <TableHead className="text-right">Report Card</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Compiling student progress cards...
                </TableCell>
              </TableRow>
            ) : filteredStudents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-foreground">No students found</p>
                  <p className="text-xs mt-1">Adjust your search or filter options.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents?.map((student) => {
                const attPercent = student.attendancePercent;
                const isLowAttendance = student.totalSessions > 3 && attPercent < 75;

                return (
                  <TableRow key={student.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold text-sm">{student.full_name}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {student.student_id || student.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium">{student.course || "General"}</div>
                      <div className="text-xs text-muted-foreground">
                        Sem {student.semester || 1} • {student.branch || "General"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span
                            className={
                              isLowAttendance
                                ? "text-rose-600 dark:text-rose-400 font-bold"
                                : "text-foreground"
                            }
                          >
                            {attPercent}%
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {student.attendedSessions}/{student.totalSessions} sessions
                          </span>
                        </div>
                        <Progress
                          value={attPercent}
                          className={`h-1.5 ${
                            isLowAttendance ? "[&>div]:bg-rose-500" : "[&>div]:bg-emerald-500"
                          }`}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-bold text-sm">
                      {student.averageScore > 0 ? `${student.averageScore}%` : "N/A"}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`font-bold text-xs ${
                          student.overallGrade === "A+" || student.overallGrade === "A"
                            ? "border-emerald-500 text-emerald-600"
                            : student.overallGrade === "F"
                            ? "border-rose-500 text-rose-600"
                            : ""
                        }`}
                      >
                        {student.overallGrade}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {student.hasRisk ? (
                        <Badge variant="destructive" className="gap-1 font-semibold text-xs">
                          <AlertTriangle className="h-3 w-3" /> {student.riskReason}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Good Standing
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReportCard(student)}
                        className="gap-1.5 h-8 text-xs font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Card
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* STUDENT REPORT CARD MODAL (PRINTABLE) */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col print:border-none print:shadow-none">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Official Student Progress Report
                  </DialogTitle>
                  <DialogDescription>Smart Curriculum Academic Standing Card</DialogDescription>
                </div>
              </div>
              <Badge
                variant={selectedStudent?.hasRisk ? "destructive" : "secondary"}
                className="text-xs uppercase font-semibold"
              >
                {selectedStudent?.hasRisk ? "Academic Alert" : "Good Standing"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-3">
            {/* Student Summary Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3.5 rounded-lg border text-xs">
              <div>
                <span className="text-muted-foreground block">Full Name:</span>
                <span className="font-bold text-sm text-foreground">
                  {selectedStudent?.full_name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Enrollment ID:</span>
                <span className="font-mono font-semibold text-foreground">
                  {selectedStudent?.student_id || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Program & Branch:</span>
                <span className="font-semibold text-foreground">
                  {selectedStudent?.course} - {selectedStudent?.branch || "General"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Current Semester:</span>
                <span className="font-semibold text-foreground">
                  Semester {selectedStudent?.semester || 1}
                </span>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attendance Standing
              </h4>
              <div className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {selectedStudent?.attendancePercent}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Attended {selectedStudent?.attendedSessions} of{" "}
                    {selectedStudent?.totalSessions} recorded class sessions
                  </div>
                </div>
                <Badge
                  variant={
                    (selectedStudent?.attendancePercent || 0) >= 75 ? "outline" : "destructive"
                  }
                  className="font-semibold"
                >
                  {(selectedStudent?.attendancePercent || 0) >= 75
                    ? "Satisfies 75% Requirement"
                    : "Below Mandatory 75%"}
                </Badge>
              </div>
            </div>

            {/* Examination Results */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Subject Examination Grades
              </h4>
              {selectedStudent?.examResults.length === 0 ? (
                <div className="border rounded-lg p-6 text-center text-xs text-muted-foreground">
                  No examination results recorded for this term yet.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent?.examResults.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell className="font-medium text-xs">
                            {res.subjectName}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            {res.marks_obtained} / {res.maxMarks}
                          </TableCell>
                          <TableCell className="text-center font-bold text-xs">
                            {res.grade}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={res.status === "pass" ? "secondary" : "destructive"}
                              className="text-[10px] uppercase font-bold"
                            >
                              {res.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Overall Academic Evaluation */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Cumulative Performance Rating:</span>
                <span className="font-bold text-primary text-sm">
                  Overall Grade: {selectedStudent?.overallGrade} (
                  {selectedStudent?.averageScore > 0 ? `${selectedStudent?.averageScore}%` : "Pending"}
                  )
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Generated automatically from certified attendance records and examination results on{" "}
                {new Date().toLocaleDateString()}.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print Report Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProgress;
