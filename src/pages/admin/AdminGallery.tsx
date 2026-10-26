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
  Image as ImageIcon,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ExternalLink,
} from "lucide-react";

type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string;
  event_date: string | null;
  created_at: string;
};

const CATEGORIES = [
  "All Categories",
  "Events",
  "Sports",
  "Cultural",
  "Academic",
  "Campus",
];

const DEFAULT_SAMPLES = [
  {
    id: "sample-1",
    title: "Annual Tech Fest 2026",
    description: "Students showcasing innovative IoT and AI projects at SVSU auditorium.",
    category: "Events",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    event_date: "2026-10-15",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    title: "National Robotics Championship",
    description: "SVSU Robotics team winning runner-up medal in the national autonomous bot contest.",
    category: "Academic",
    image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60",
    event_date: "2026-09-28",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-3",
    title: "Inter-College Cricket Tournament",
    description: "Highlights from the championship final match held on university grounds.",
    category: "Sports",
    image_url: "https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=800&auto=format&fit=crop&q=60",
    event_date: "2026-08-14",
    created_at: new Date().toISOString(),
  },
];

const AdminGallery = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Events");
  const [imageUrl, setImageUrl] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview dialog
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  // 1. Fetch gallery items
  const { data: dbItems = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["admin_gallery_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as GalleryItem[]) || [];
    },
  });

  const allItems = dbItems.length > 0 ? dbItems : DEFAULT_SAMPLES;

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("gallery_items").insert({
        title,
        description,
        category,
        image_url: imageUrl,
        event_date: eventDate,
      });

      if (error) throw error;

      toast({
        title: "Photo Added",
        description: `"${title}" has been published to campus gallery.`,
      });

      setTitle("");
      setDescription("");
      setImageUrl("");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin_gallery_items"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add image";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (id.startsWith("sample-")) {
      toast({ title: "Sample Item", description: "Default samples cannot be removed." });
      return;
    }

    try {
      const { error } = await supabase.from("gallery_items").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Photo removed from gallery." });
      queryClient.invalidateQueries({ queryKey: ["admin_gallery_items"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // Filter items
  const filteredItems = allItems.filter(
    (item) =>
      selectedCategory === "All Categories" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campus Gallery & Media</h2>
          <p className="text-muted-foreground">
            Visual archive of university activities, cultural fests, conferences, and sports milestones.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Photo / Highlight
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold">No Photos Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add campus media to display in this category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden group hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div
                className="relative aspect-video overflow-hidden bg-muted cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60";
                  }}
                />
                <Badge className="absolute top-2.5 left-2.5 shadow-sm capitalize">
                  {item.category}
                </Badge>
              </div>

              <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-semibold text-base leading-snug line-clamp-1">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.event_date ? new Date(item.event_date).toLocaleDateString() : "Recent"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setPreviewItem(item)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Photo Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleAddItem}>
            <DialogHeader>
              <DialogTitle>Add Campus Photo</DialogTitle>
              <DialogDescription>
                Publish a high-resolution image link and details to the gallery.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Event Title</label>
                <Input
                  placeholder="e.g. 5th Annual Convocation 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Event Date</label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief context about this highlight..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Publish Photo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          {previewItem && (
            <div>
              <div className="relative aspect-video w-full bg-black">
                <img
                  src={previewItem.image_url}
                  alt={previewItem.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{previewItem.title}</h3>
                  <Badge>{previewItem.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{previewItem.description}</p>
                <div className="text-xs text-muted-foreground pt-2">
                  Event Date: {previewItem.event_date || "N/A"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGallery;
