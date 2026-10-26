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
  Star,
  MessageSquare,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
} from "lucide-react";

type FeedbackItem = {
  id: string;
  user_id: string | null;
  category: string;
  title: string;
  content: string;
  rating: number | null;
  status: string;
  admin_response: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    student_id: string | null;
    roll_no: string | null;
    role: string;
  } | null;
};

const DEFAULT_FEEDBACK: FeedbackItem[] = [
  {
    id: "f-1",
    user_id: null,
    category: "facilities",
    title: "Need additional charging points in Lab 402",
    content: "During practical programming sessions, several laptop charging ports are occupied or malfunctioning.",
    rating: 4,
    status: "resolved",
    admin_response: "Electrician replaced 8 plug sockets and added extension surge protectors on Oct 20.",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    profiles: {
      full_name: "Rahul Sharma",
      student_id: "23-CSE-042",
      roll_no: "2301042",
      role: "student",
    },
  },
  {
    id: "f-2",
    user_id: null,
    category: "academics",
    title: "Request for Python AI hands-on workshop",
    content: "We would like a 2-day weekend bootcamp focusing on PyTorch deep learning and transformers.",
    rating: 5,
    status: "under_review",
    admin_response: "Coordinating with AI Department HOD to schedule in November.",
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    profiles: {
      full_name: "Pooja Verma",
      student_id: "24-AI-018",
      roll_no: "2402018",
      role: "student",
    },
  },
  {
    id: "f-3",
    user_id: null,
    category: "canteen",
    title: "Hydration stations filter replacement",
    content: "Water cooler filter on 2nd floor academic block needs scheduled maintenance.",
    rating: 3,
    status: "pending",
    admin_response: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    profiles: {
      full_name: "Amit Kumar",
      student_id: "22-MECH-011",
      roll_no: "2205011",
      role: "student",
    },
  },
];

const CATEGORIES = ["all", "academics", "faculty", "facilities", "canteen", "general"];

const AdminFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Review Dialog
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState("under_review");
  const [adminReply, setAdminReply] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch Feedback from Supabase
  const { data: dbFeedback = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["admin_feedback_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          id,
          user_id,
          category,
          title,
          content,
          rating,
          status,
          admin_response,
          created_at,
          profiles:user_id (
            full_name,
            student_id,
            roll_no,
            role
          )
        `)
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as any) || [];
    },
  });

  const feedbackList = dbFeedback.length > 0 ? dbFeedback : DEFAULT_FEEDBACK;

  // Update Feedback Status & Reply
  const handleSaveReview = async () => {
    if (!selectedItem) return;

    try {
      setIsUpdating(true);
      if (selectedItem.id.startsWith("f-")) {
        // Mock update for default preview
        selectedItem.status = reviewStatus;
        selectedItem.admin_response = adminReply;
        toast({ title: "Updated", description: "Feedback status and reply updated." });
        setSelectedItem(null);
        return;
      }

      const { error } = await supabase
        .from("feedback")
        .update({
          status: reviewStatus,
          admin_response: adminReply,
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast({
        title: "Feedback Updated",
        description: `Feedback status changed to ${reviewStatus}.`,
      });

      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["admin_feedback_list"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update feedback";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter feedback
  const filteredFeedback = feedbackList.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.content.toLowerCase().includes(search.toLowerCase()) ||
      (f.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "all" || f.category === selectedCategory;
    const matchesStat = selectedStatus === "all" || f.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStat;
  });

  const avgRating = (
    feedbackList.reduce((acc, f) => acc + (f.rating || 5), 0) /
    (feedbackList.length || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feedback & Grievances</h2>
          <p className="text-muted-foreground">
            Monitor student & faculty suggestions, service ratings, and institutional resolution status.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedbackList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Submissions received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-1.5 text-amber-500">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              {avgRating} <span className="text-sm text-muted-foreground font-normal">/ 5.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Campus satisfaction index</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {feedbackList.filter((f) => f.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting admin review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {feedbackList.filter((f) => f.status === "resolved").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Addressed and closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback or student name..."
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
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submissions Registry</CardTitle>
          <CardDescription>
            Click any row to read full feedback details and respond.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        {item.profiles?.full_name || "Campus User"}
                        <div className="text-xs text-muted-foreground">
                          {item.profiles?.roll_no || item.profiles?.student_id || "Student"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="font-semibold text-sm line-clamp-1">{item.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {item.content}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: item.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.status === "resolved" ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                          Resolved
                        </Badge>
                      ) : item.status === "under_review" ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Under Review
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setReviewStatus(item.status);
                          setAdminReply(item.admin_response || "");
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review & Respond Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedItem && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedItem.category}
                  </Badge>
                  <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
                </div>
                <DialogDescription>
                  Submitted by {selectedItem.profiles?.full_name || "Campus Member"} on{" "}
                  {new Date(selectedItem.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="p-3 bg-muted/40 rounded-lg text-sm text-foreground/90">
                {selectedItem.content}
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Admin Response / Resolution Note</label>
                  <Textarea
                    placeholder="Explain actions taken or next steps to the user..."
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
                <Button onClick={handleSaveReview} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Resolution"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedback;
