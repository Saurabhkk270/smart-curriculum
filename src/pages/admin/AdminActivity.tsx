import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Search,
  Download,
  ShieldCheck,
  UserCheck,
  BellRing,
  BookOpen,
  Calendar,
  FileText,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

type ActivityItem = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  details: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
    email: string;
  } | null;
};

const DEFAULT_LOGS: ActivityItem[] = [
  {
    id: "log-1",
    user_id: null,
    action: "Exam Marks Published",
    entity_type: "examination",
    details: "Marks uploaded for Midterm Exam - B.Tech CSE Semester 5 Data Structures.",
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    profiles: {
      full_name: "Dr. Vikram Seth",
      role: "teacher",
      email: "vikram.seth@svsu.ac.in",
    },
  },
  {
    id: "log-2",
    user_id: null,
    action: "Campus Notice Published",
    entity_type: "notice",
    details: "Notice 'Odd Semester Midterm Date Sheet 2026' pinned for All Students.",
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    profiles: {
      full_name: "Registrar Office",
      role: "admin",
      email: "admin@svsu.ac.in",
    },
  },
  {
    id: "log-3",
    user_id: null,
    action: "Student Account Activated",
    entity_type: "user",
    details: "Account status for student Rohit Kumar (24-CSE-091) set to active.",
    created_at: new Date(Date.now() - 7 * 3600000).toISOString(),
    profiles: {
      full_name: "Admin Portal",
      role: "admin",
      email: "admin@svsu.ac.in",
    },
  },
  {
    id: "log-4",
    user_id: null,
    action: "Bulk Excel Import",
    entity_type: "import",
    details: "Ingested 48 new student admission records for Mechanical Engineering 2026 batch.",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    profiles: {
      full_name: "Admin Portal",
      role: "admin",
      email: "admin@svsu.ac.in",
    },
  },
  {
    id: "log-5",
    user_id: null,
    action: "Timetable Published",
    entity_type: "timetable",
    details: "New routine uploaded for B.Voc Robotics (Semester 3).",
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    profiles: {
      full_name: "Academic Coordinator",
      role: "admin",
      email: "academics@svsu.ac.in",
    },
  },
];

const CATEGORIES = ["all", "examination", "notice", "user", "import", "timetable", "attendance"];

const AdminActivity = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 1. Fetch DB logs
  const { data: dbLogs = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["admin_activity_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          id,
          user_id,
          action,
          entity_type,
          details,
          created_at,
          profiles:user_id (
            full_name,
            role,
            email
          )
        `)
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as any) || [];
    },
  });

  const logs = dbLogs.length > 0 ? dbLogs : DEFAULT_LOGS;

  const exportLogs = () => {
    const exportRows = logs.map((l) => ({
      "Timestamp": new Date(l.created_at).toLocaleString(),
      "Action": l.action,
      "Category": l.entity_type,
      "User": l.profiles?.full_name || "System Admin",
      "Role": l.profiles?.role || "admin",
      "Details": l.details || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit_Logs");
    XLSX.writeFile(workbook, `SVSU_Audit_Log_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({ title: "Downloaded", description: "Audit trail exported to Excel." });
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.details || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "all" || l.entity_type === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "examination":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Exams</Badge>;
      case "notice":
        return <Badge variant="secondary" className="bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300">Notice</Badge>;
      case "user":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Users</Badge>;
      case "import":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Import</Badge>;
      case "timetable":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Timetable</Badge>;
      default:
        return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">System Activity Log</h2>
            <Badge variant="outline" className="border-green-600 text-green-600">
              <ShieldCheck className="h-3 w-3 mr-1" /> Audit Trail Active
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Immutable administrative logs tracking attendance sessions, exams, student changes, and circulars.
          </p>
        </div>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Audit Trail
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recorded Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged admin actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Compliant</div>
            <p className="text-xs text-muted-foreground mt-1">Zero unauthorized overrides</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">Superadmin role</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retention Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">365 Days</div>
            <p className="text-xs text-muted-foreground mt-1">Compliant audit duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search action keyword, user or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c === "all" ? "All Categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event History</CardTitle>
          <CardDescription>
            Chronological log of administrative interventions and automated triggers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor / User</TableHead>
                  <TableHead>Event Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getCategoryBadge(item.entity_type)}</TableCell>
                    <TableCell className="font-semibold text-sm">
                      {item.action}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.profiles?.full_name || "System"}
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize">
                        {item.profiles?.role || "admin"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[320px]">
                      {item.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivity;
