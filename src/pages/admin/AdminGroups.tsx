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
import { Textarea } from "@/components/ui/textarea";
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
  UsersRound,
  Plus,
  Search,
  Trash2,
  GraduationCap,
  Users,
  Layers,
  UserPlus,
} from "lucide-react";

type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  mentor_id: string | null;
  created_at: string;
  mentor?: {
    full_name: string;
  } | null;
  group_members?: {
    id: string;
    student_id: string;
    profiles?: {
      full_name: string;
      student_id: string | null;
      roll_no: string | null;
    } | null;
  }[];
};

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Artificial Intelligence & Data Science",
  "Robotics & Automation",
  "Automotive Engineering",
  "Applied Sciences",
  "Management & Business Studies",
];

const AdminGroups = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  // Create Group Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [mentorId, setMentorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group Details & Add Member Dialog
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState("");

  // 1. Fetch Teachers for Mentor selection
  const { data: teachers = [] } = useQuery({
    queryKey: ["admin_groups_teachers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "teacher");
      return data || [];
    },
  });

  // 2. Fetch Students for Adding to Group
  const { data: students = [] } = useQuery({
    queryKey: ["admin_groups_students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, roll_no, student_id")
        .eq("role", "student");
      return data || [];
    },
  });

  // 3. Fetch Groups with Mentors & Members
  const { data: groups = [], isLoading } = useQuery<GroupItem[]>({
    queryKey: ["admin_groups_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          id,
          name,
          description,
          department,
          mentor_id,
          created_at,
          mentor:mentor_id (
            full_name
          ),
          group_members (
            id,
            student_id,
            profiles:student_id (
              full_name,
              student_id,
              roll_no
            )
          )
        `)
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as any) || [];
    },
  });

  // Create Group Handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("groups").insert({
        name,
        description,
        department,
        mentor_id: mentorId ? mentorId : null,
      });

      if (error) throw error;

      toast({
        title: "Group Formed",
        description: `Group "${name}" successfully registered.`,
      });

      setName("");
      setDescription("");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin_groups_list"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create group";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Member Handler
  const handleAddMember = async () => {
    if (!selectedGroup || !addStudentId) return;

    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: selectedGroup.id,
        student_id: addStudentId,
      });

      if (error) throw error;

      toast({
        title: "Student Added",
        description: "Student enrolled in group.",
      });

      setAddStudentId("");
      queryClient.invalidateQueries({ queryKey: ["admin_groups_list"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add member";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;

      toast({ title: "Removed", description: "Student removed from group." });
      queryClient.invalidateQueries({ queryKey: ["admin_groups_list"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;

      toast({ title: "Deleted", description: "Group deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin_groups_list"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === "all" || g.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Groups & Cohorts</h2>
          <p className="text-muted-foreground">
            Manage academic batches, project teams, student clubs, and faculty mentorship.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Group
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups by name or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger>
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold">No Groups Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create student cohorts, research groups, or societies using the button above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => {
            const memberCount = group.group_members?.length || 0;
            return (
              <Card key={group.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {group.department || "General"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {group.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5 text-xs text-muted-foreground border-t pt-3">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>Mentor: {group.mentor?.full_name || "Unassigned"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-emerald-500" />
                      <span>{memberCount} Enrolled Students</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsMembersOpen(true);
                    }}
                  >
                    Manage Members
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleCreateGroup}>
            <DialogHeader>
              <DialogTitle>Form New Group</DialogTitle>
              <DialogDescription>
                Define cohort details and assign a faculty advisor or mentor.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  placeholder="e.g. CSE Final Year Projects / Robotics Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Department</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Faculty Mentor</label>
                <Select value={mentorId} onValueChange={setMentorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Goals, agenda, or prerequisites for this cohort..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name} - Members</DialogTitle>
            <DialogDescription>
              Assign and view students currently part of this group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Add Member Row */}
            <div className="flex gap-2">
              <Select value={addStudentId} onValueChange={setAddStudentId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select student to add..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((stu: any) => (
                    <SelectItem key={stu.id} value={stu.id}>
                      {stu.full_name} ({stu.roll_no || stu.student_id || "ID"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!addStudentId}>
                <UserPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {/* Current Members List */}
            <div className="max-h-60 overflow-y-auto rounded-md border p-2 space-y-2">
              {(!selectedGroup?.group_members || selectedGroup.group_members.length === 0) ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No students in this group yet.
                </div>
              ) : (
                selectedGroup.group_members.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/40 text-sm"
                  >
                    <div>
                      <span className="font-medium">{m.profiles?.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Roll: {m.profiles?.roll_no || m.profiles?.student_id || "N/A"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7 w-7 p-0"
                      onClick={() => handleRemoveMember(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMembersOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGroups;
