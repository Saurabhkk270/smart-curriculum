import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  BellRing,
  Pin,
  AlertTriangle,
  Flame,
  Users,
  GraduationCap,
  Building,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Notice = Database["public"]["Tables"]["notices"]["Row"];

const AdminNotices = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteNoticeItem, setDeleteNoticeItem] = useState<Notice | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    target_audience: "all",
    department: "",
    is_pinned: false,
  });

  // Table setup SQL state
  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Fetch Notices
  const { data: notices, isLoading } = useQuery({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          // Table does not exist yet
          setTableMissing(true);
          return [];
        }
        throw error;
      }
      setTableMissing(false);
      return data || [];
    },
  });

  // Mutations
  const createNoticeMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const { error } = await supabase.from("notices").insert({
        title: payload.title.trim(),
        content: payload.content.trim(),
        priority: payload.priority,
        target_audience: payload.target_audience,
        department: payload.department.trim() || null,
        is_pinned: payload.is_pinned,
        author_id: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      setIsAddOpen(false);
      setFormData({
        title: "",
        content: "",
        priority: "normal",
        target_audience: "all",
        department: "",
        is_pinned: false,
      });
      toast({ title: "Published", description: "Notice published to bulletin board." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateNoticeMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Notice> }) => {
      const { error } = await supabase
        .from("notices")
        .update({
          ...payload.data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      setIsEditOpen(false);
      toast({ title: "Updated", description: "Notice was updated." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from("notices")
        .update({ is_pinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      toast({ title: "Pin Status Updated" });
    },
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      setDeleteNoticeItem(null);
      toast({ title: "Deleted", description: "Notice removed." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (n: Notice) => {
    setEditingNotice(n);
    setFormData({
      title: n.title,
      content: n.content,
      priority: n.priority,
      target_audience: n.target_audience,
      department: n.department || "",
      is_pinned: n.is_pinned,
    });
    setIsEditOpen(true);
  };

  const sqlSetup = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  priority text not null default 'normal',
  target_audience text not null default 'all',
  department text default null,
  author_id uuid references public.profiles(id) on delete set null,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view notices" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and teachers can manage notices" ON public.notices FOR ALL TO authenticated USING (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSetup);
    setCopiedSql(true);
    toast({ title: "SQL Copied!", description: "Paste into Supabase SQL editor whenever ready." });
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Filter
  const filteredNotices = notices?.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority =
      priorityFilter === "all" || n.priority === priorityFilter;

    const matchesAudience =
      audienceFilter === "all" || n.target_audience === audienceFilter;

    return matchesSearch && matchesPriority && matchesAudience;
  });

  // Metrics
  const totalNotices = notices?.length || 0;
  const pinnedCount = notices?.filter((n) => n.is_pinned).length || 0;
  const urgentCount =
    notices?.filter((n) => n.priority === "urgent" || n.priority === "high").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campus Notices & Bulletin</h2>
          <p className="text-muted-foreground">
            Publish official announcements, academic advisories, and campus alerts.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Create New Notice
        </Button>
      </div>

      {/* Database Setup Banner (if table not created yet) */}
      {tableMissing && (
        <Card className="border-amber-400 bg-amber-500/10">
          <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Notices Table Setup Required</p>
                <p className="text-xs text-muted-foreground">
                  The `notices` table migration is saved in your project (`supabase/migrations/`).
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

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bulletins</CardTitle>
            <BellRing className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotices}</div>
            <p className="text-xs text-muted-foreground mt-1">Broadcast announcements published</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pinned to Top</CardTitle>
            <Pin className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pinnedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Featured at top of student portal</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High / Urgent Alerts</CardTitle>
            <Flame className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">High-priority action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notices..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={audienceFilter} onValueChange={setAudienceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audiences</SelectItem>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="students">Students Only</SelectItem>
              <SelectItem value="teachers">Faculty Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading campus notices...
          </div>
        ) : filteredNotices?.length === 0 ? (
          <div className="text-center py-16 border rounded-xl bg-card text-muted-foreground">
            <BellRing className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-foreground">No notices found</p>
            <p className="text-xs mt-1">Click "Create New Notice" to post an announcement.</p>
          </div>
        ) : (
          filteredNotices?.map((notice) => {
            const isUrgent = notice.priority === "urgent";
            const isHigh = notice.priority === "high";

            return (
              <Card
                key={notice.id}
                className={`transition-all hover:shadow-md ${
                  notice.is_pinned ? "border-primary/50 bg-primary/[0.02]" : ""
                } ${isUrgent ? "border-rose-400 dark:border-rose-800" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.is_pinned && (
                        <Badge variant="secondary" className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                          <Pin className="h-3 w-3" /> Pinned
                        </Badge>
                      )}

                      {isUrgent ? (
                        <Badge variant="destructive" className="gap-1 font-bold text-xs uppercase tracking-wider">
                          <Flame className="h-3 w-3" /> Urgent
                        </Badge>
                      ) : isHigh ? (
                        <Badge variant="secondary" className="gap-1 bg-amber-500/15 text-amber-600 font-semibold text-xs">
                          <AlertTriangle className="h-3 w-3" /> High Priority
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Normal
                        </Badge>
                      )}

                      <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                        {notice.target_audience === "students" ? (
                          <>
                            <GraduationCap className="h-3 w-3" /> Students Only
                          </>
                        ) : notice.target_audience === "teachers" ? (
                          <>
                            <Users className="h-3 w-3" /> Faculty Only
                          </>
                        ) : (
                          <>
                            <Building className="h-3 w-3" /> Entire Campus
                          </>
                        )}
                      </Badge>

                      {notice.department && (
                        <Badge variant="secondary" className="text-xs">
                          {notice.department}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          togglePinMutation.mutate({
                            id: notice.id,
                            is_pinned: !notice.is_pinned,
                          })
                        }
                        title={notice.is_pinned ? "Unpin notice" : "Pin notice"}
                      >
                        <Pin
                          className={`h-4 w-4 ${
                            notice.is_pinned ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                          }`}
                        />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(notice)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Notice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteNoticeItem(notice)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Notice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold mt-2">{notice.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Posted on {new Date(notice.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                    {notice.content}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE NOTICE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Publish Campus Notice
            </DialogTitle>
            <DialogDescription>
              Create an announcement for students, faculty, or the entire institution.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Notice Title *</Label>
              <Input
                placeholder="e.g. Midterm Examination Schedule Released"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Announcement Content *</Label>
              <Textarea
                rows={5}
                placeholder="Write the full announcement details here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(val) => setFormData({ ...formData, target_audience: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Campus</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="teachers">Faculty Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Department Tag (Optional)</Label>
              <Input
                placeholder="e.g. Computer Science, Mechanical (or leave blank for all)"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Pin to Top</Label>
                <p className="text-xs text-muted-foreground">
                  Keep this announcement pinned at the top of the feed.
                </p>
              </div>
              <Switch
                checked={formData.is_pinned}
                onCheckedChange={(val) => setFormData({ ...formData, is_pinned: val })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!formData.title || !formData.content) {
                  toast({
                    title: "Missing Fields",
                    description: "Please enter both title and content.",
                    variant: "destructive",
                  });
                  return;
                }
                createNoticeMutation.mutate(formData);
              }}
              disabled={createNoticeMutation.isPending}
            >
              {createNoticeMutation.isPending ? "Publishing..." : "Publish Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT NOTICE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>Update announcement details and priority.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Notice Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Announcement Content</Label>
              <Textarea
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(val) => setFormData({ ...formData, target_audience: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Campus</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="teachers">Faculty Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Pin to Top</Label>
                <p className="text-xs text-muted-foreground">Keep pinned at top of feed</p>
              </div>
              <Switch
                checked={formData.is_pinned}
                onCheckedChange={(val) => setFormData({ ...formData, is_pinned: val })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingNotice) {
                  updateNoticeMutation.mutate({
                    id: editingNotice.id,
                    data: formData,
                  });
                }
              }}
              disabled={updateNoticeMutation.isPending}
            >
              {updateNoticeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog
        open={!!deleteNoticeItem}
        onOpenChange={(open) => !open && setDeleteNoticeItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Notice?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                "{deleteNoticeItem?.title}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteNoticeItem) {
                  deleteNoticeMutation.mutate(deleteNoticeItem.id);
                }
              }}
            >
              Delete Notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotices;
