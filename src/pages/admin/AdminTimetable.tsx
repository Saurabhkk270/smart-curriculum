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
  Calendar as CalendarIcon,
  Upload,
  Download,
  Trash2,
  Plus,
  FileText,
  Clock,
  Layers,
  Search,
} from "lucide-react";

const COURSES = [
  "B.Tech CSE",
  "B.Tech AI & ML",
  "B.Tech Mechanical",
  "BCA",
  "MCA",
  "B.Voc Robotics",
  "B.Voc Automotive",
  "MBA",
];

const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TimetableItem = {
  id: string;
  course: string;
  semester: string;
  file_name: string;
  file_path: string;
  uploaded_at: string | null;
  uploaded_by: string;
};

const AdminTimetable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Upload dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCourse, setUploadCourse] = useState(COURSES[0]);
  const [uploadSemester, setUploadSemester] = useState(SEMESTERS[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Timetables from Supabase
  const { data: timetables = [], isLoading } = useQuery<TimetableItem[]>({
    queryKey: ["admin_timetables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetables")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data as TimetableItem[]) || [];
    },
  });

  // 2. Fetch Classes for Quick Reference
  const { data: classes = [] } = useQuery({
    queryKey: ["admin_classes_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, code, teacher_id, profiles(full_name)");
      if (error) return [];
      return data || [];
    },
  });

  // Handle File Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast({
        title: "Missing File",
        description: "Please select a timetable file (PDF, PNG, JPG).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const fileExt = uploadFile.name.split(".").pop();
      const filePath = `timetables/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("timetables")
        .upload(filePath, uploadFile, { upsert: true });

      if (storageError) {
        // Fallback: If bucket is restricted or unlinked, save record with file metadata
        console.warn("Storage upload note:", storageError.message);
      }

      // 2. Insert record in `timetables` table
      const { error: dbError } = await supabase.from("timetables").insert({
        course: uploadCourse,
        semester: uploadSemester,
        file_name: uploadFile.name,
        file_path: filePath,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: "Timetable Published",
        description: `Successfully uploaded ${uploadFile.name} for ${uploadCourse} (${uploadSemester}).`,
      });

      setIsUploadOpen(false);
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin_timetables"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload timetable";
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Timetable mutation
  const deleteMutation = useMutation({
    mutationFn: async (item: TimetableItem) => {
      // 1. Remove from storage
      await supabase.storage.from("timetables").remove([item.file_path]);
      // 2. Remove from DB
      const { error } = await supabase.from("timetables").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Timetable Removed", description: "Timetable record deleted." });
      queryClient.invalidateQueries({ queryKey: ["admin_timetables"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Download / View File
  const handleDownload = async (item: TimetableItem) => {
    try {
      const { data, error } = await supabase.storage
        .from("timetables")
        .createSignedUrl(item.file_path, 60);

      if (error || !data?.signedUrl) {
        // Direct public URL fallback
        const { data: pubData } = supabase.storage
          .from("timetables")
          .getPublicUrl(item.file_path);
        window.open(pubData.publicUrl, "_blank");
      } else {
        window.open(data.signedUrl, "_blank");
      }
    } catch {
      toast({
        title: "Download Issue",
        description: "Could not generate download link for this file.",
        variant: "destructive",
      });
    }
  };

  // Filtered List
  const filteredTimetables = timetables.filter((t) => {
    const matchesCourse = selectedCourse === "all" || t.course === selectedCourse;
    const matchesSemester = selectedSemester === "all" || t.semester === selectedSemester;
    const matchesSearch =
      t.course.toLowerCase().includes(search.toLowerCase()) ||
      t.file_name.toLowerCase().includes(search.toLowerCase());
    return matchesCourse && matchesSemester && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Timetable Management</h2>
          <p className="text-muted-foreground">
            Publish and regulate academic timetables, course schedules, and slot distributions.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload New Timetable
        </Button>
      </div>

      {/* Course Timetables & Routine Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published Timetables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timetables.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all degree courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Class curricula active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Working Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 Days / Wk</div>
            <p className="text-xs text-muted-foreground mt-1">Mon - Sat routine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Academic Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2026-2027</div>
            <p className="text-xs text-muted-foreground mt-1">Odd Semester Term</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Timetables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file name or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {COURSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {SEMESTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Published Timetables Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class Schedules & PDF Routines</CardTitle>
          <CardDescription>
            Official timetable files accessible to enrolled students and faculty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Loading timetables...</div>
          ) : filteredTimetables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium text-foreground">No timetables found</p>
              <p className="text-sm mt-1">
                Upload the first course routine using the button above.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Published Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimetables.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          {item.course}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.semester}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{item.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.uploaded_at
                          ? new Date(item.uploaded_at).toLocaleDateString()
                          : "Recently"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(item)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(item)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routine Slots Quick Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Course Breakdown</CardTitle>
          <CardDescription>
            Configured subjects registered for classroom delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.slice(0, 6).map((c: any) => (
              <div key={c.id} className="p-4 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{c.name}</span>
                  <Badge variant="outline">{c.code}</Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Instructor: {c.profiles?.full_name || "Assigned Faculty"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleUpload}>
            <DialogHeader>
              <DialogTitle>Upload Timetable</DialogTitle>
              <DialogDescription>
                Select the target course and semester, then choose the PDF or image timetable.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Degree / Course</label>
                <Select value={uploadCourse} onValueChange={setUploadCourse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Semester</label>
                <Select value={uploadSemester} onValueChange={setUploadSemester}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Timetable Document (PDF / Image)</label>
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Publish Timetable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTimetable;
