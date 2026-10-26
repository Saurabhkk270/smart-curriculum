import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Plus,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

type SessionRow = {
  id: string;
  session_date: string;
  session_time: string;
  expires_at: string;
  class_id: string;
  classes?: {
    name: string;
    code: string;
  } | null;
  profiles?: {
    full_name: string;
  } | null;
  attendance_records?: { count: number }[];
};

type RecordRow = {
  id: string;
  session_id: string;
  student_id: string;
  marked_at: string;
  is_manual: boolean;
  profiles?: {
    full_name: string;
    student_id: string | null;
    roll_no: string | null;
    branch: string | null;
  } | null;
  attendance_sessions?: {
    session_date: string;
    session_time: string;
    classes?: {
      name: string;
      code: string;
    } | null;
  } | null;
};

const AdminAttendance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Manual Override Dialog
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideStudentId, setOverrideStudentId] = useState("");
  const [overrideSessionId, setOverrideSessionId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Classes for dropdown
  const { data: classesList = [] } = useQuery({
    queryKey: ["admin_attendance_classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name, code");
      return data || [];
    },
  });

  // 2. Fetch Students for override dropdown
  const { data: studentsList = [] } = useQuery({
    queryKey: ["admin_attendance_students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, student_id, roll_no")
        .eq("role", "student");
      return data || [];
    },
  });

  // 3. Fetch Attendance Sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin_attendance_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select(`
          id,
          session_date,
          session_time,
          expires_at,
          class_id,
          classes (
            name,
            code
          ),
          profiles:created_by (
            full_name
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
  });

  // 4. Fetch Attendance Records with Student Details
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["admin_attendance_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          session_id,
          student_id,
          marked_at,
          is_manual,
          profiles:student_id (
            full_name,
            student_id,
            roll_no,
            branch
          ),
          attendance_sessions:session_id (
            session_date,
            session_time,
            classes:class_id (
              name,
              code
            )
          )
        `)
        .order("marked_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any) || [];
    },
  });

  // Export to Excel
  const exportToExcel = () => {
    if (records.length === 0) {
      toast({
        title: "No Data",
        description: "There are no attendance records to export.",
        variant: "destructive",
      });
      return;
    }

    const exportRows = records.map((r: RecordRow) => ({
      "Record ID": r.id,
      "Student Name": r.profiles?.full_name || "N/A",
      "Roll No": r.profiles?.roll_no || r.profiles?.student_id || "N/A",
      Department: r.profiles?.branch || "N/A",
      Class: r.attendance_sessions?.classes?.name || "N/A",
      "Class Code": r.attendance_sessions?.classes?.code || "N/A",
      Date: r.attendance_sessions?.session_date || "N/A",
      Time: r.attendance_sessions?.session_time || "N/A",
      "Method": r.is_manual ? "Manual Override" : "QR Verified",
      "Marked Timestamp": new Date(r.marked_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance_Audit");
    XLSX.writeFile(workbook, `Attendance_Audit_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Export Completed",
      description: `Downloaded ${exportRows.length} attendance audit rows as Excel.`,
    });
  };

  // Submit Manual Attendance Override
  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideStudentId || !overrideSessionId) {
      toast({
        title: "Missing Information",
        description: "Please select both a student and an active session.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("attendance_records").insert({
        session_id: overrideSessionId,
        student_id: overrideStudentId,
        is_manual: true,
        marked_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Attendance Recorded",
        description: "Manual attendance override applied successfully.",
      });

      setIsOverrideOpen(false);
      setOverrideStudentId("");
      setOverrideSessionId("");
      setOverrideReason("");
      queryClient.invalidateQueries({ queryKey: ["admin_attendance_records"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record override";
      toast({
        title: "Action Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Records
  const filteredRecords = records.filter((r: RecordRow) => {
    const studentName = r.profiles?.full_name?.toLowerCase() || "";
    const rollNo = (r.profiles?.roll_no || r.profiles?.student_id || "").toLowerCase();
    const className = r.attendance_sessions?.classes?.name?.toLowerCase() || "";
    const matchesSearch =
      studentName.includes(search.toLowerCase()) ||
      rollNo.includes(search.toLowerCase()) ||
      className.includes(search.toLowerCase());

    const matchesClass =
      selectedClass === "all" ||
      r.attendance_sessions?.classes?.name === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Audit & Logs</h2>
          <p className="text-muted-foreground">
            Campus-wide attendance registry, QR session audits, and manual adjustment controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => setIsOverrideOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Manual Override
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions Conducted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Class periods held</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Verified Attendances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all lectures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">QR Scans Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {records.length > 0
                ? Math.round(
                    (records.filter((r: RecordRow) => !r.is_manual).length / records.length) * 100
                  )
                : 100}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Direct QR code check-ins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Manual Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {records.filter((r: RecordRow) => r.is_manual).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Teacher / Admin overrides</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Scanned Records vs Sessions List */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Student Attendance Entries ({filteredRecords.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Clock className="h-4 w-4" />
            Conducted Sessions ({sessions.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Detailed Records */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-base">Audit Trail</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search student or roll no..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {classesList.map((c: any) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading audit records...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p>No matching attendance records found.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll / ID</TableHead>
                        <TableHead>Subject / Class</TableHead>
                        <TableHead>Session Date & Time</TableHead>
                        <TableHead>Verification Mode</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((r: RecordRow) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.profiles?.full_name || "Unknown Student"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {r.profiles?.roll_no || r.profiles?.student_id || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {r.attendance_sessions?.classes?.name || "Class"}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({r.attendance_sessions?.classes?.code || "CODE"})
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.attendance_sessions?.session_date} at {r.attendance_sessions?.session_time}
                          </TableCell>
                          <TableCell>
                            {r.is_manual ? (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Manual Override
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                QR Verified
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.marked_at).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Sessions List */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Sessions</CardTitle>
              <CardDescription>
                Chronological list of all dynamic QR code attendance sessions generated by teachers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No sessions created yet.</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Teacher / Host</TableHead>
                        <TableHead>Session Date</TableHead>
                        <TableHead>Session Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s: SessionRow) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.classes?.name || "Subject Class"}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({s.classes?.code})
                            </span>
                          </TableCell>
                          <TableCell>{s.profiles?.full_name || "Faculty"}</TableCell>
                          <TableCell>{s.session_date}</TableCell>
                          <TableCell>{s.session_time}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Completed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manual Override Dialog */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleManualOverride}>
            <DialogHeader>
              <DialogTitle>Admin Attendance Override</DialogTitle>
              <DialogDescription>
                Directly mark attendance for a student who could not scan during a session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Select Student</label>
                <Select value={overrideStudentId} onValueChange={setOverrideStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsList.map((stu: any) => (
                      <SelectItem key={stu.id} value={stu.id}>
                        {stu.full_name} ({stu.roll_no || stu.student_id || "No Roll"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Select Session</label>
                <Select value={overrideSessionId} onValueChange={setOverrideSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose lecture session..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.slice(0, 15).map((sess: any) => (
                      <SelectItem key={sess.id} value={sess.id}>
                        {sess.classes?.name} - {sess.session_date} ({sess.session_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Audit Note / Reason</label>
                <Input
                  placeholder="e.g. Device issue / verified by HOD"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOverrideOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Apply Attendance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAttendance;
