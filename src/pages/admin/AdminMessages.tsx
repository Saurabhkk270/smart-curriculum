import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Send,
  MessageSquare,
  Users,
  GraduationCap,
  CheckCheck,
  Clock,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

const AdminMessages = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "student">("all");
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [messageText, setMessageText] = useState("");

  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Users / Contacts (excluding current user)
  const { data: contacts, isLoading: isContactsLoading } = useQuery({
    queryKey: ["admin-message-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user?.id || "")
        .order("full_name");

      if (error) throw error;
      return data || [];
    },
  });

  // 2. Fetch Conversation Messages between user and selectedContact
  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["admin-conversation", selectedContact?.id],
    enabled: !!selectedContact?.id,
    refetchInterval: 5000, // Poll every 5s for new messages
    queryFn: async () => {
      if (!selectedContact || !user) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        if (error.code === "42P01") {
          setTableMissing(true);
          return [];
        }
        throw error;
      }
      setTableMissing(false);
      return data || [];
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedContact || !user) return;

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedContact.id,
        content: text.trim(),
        is_read: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: ["admin-conversation", selectedContact?.id],
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to send message",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageText);
  };

  const sqlSetup = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Receivers can update messages" ON public.messages FOR UPDATE TO authenticated USING (receiver_id = auth.uid());`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSetup);
    setCopiedSql(true);
    toast({ title: "SQL Copied!", description: "Paste into Supabase SQL editor whenever ready." });
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const filteredContacts = contacts?.filter((c) => {
    const matchesSearch =
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "all" || c.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Direct Messaging</h2>
        <p className="text-muted-foreground">
          Communicate directly with students and faculty members.
        </p>
      </div>

      {/* SQL Setup Banner */}
      {tableMissing && (
        <Card className="border-amber-400 bg-amber-500/10">
          <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Messages Table Setup Required</p>
                <p className="text-xs text-muted-foreground">
                  The `messages` table migration is saved in your project (`supabase/migrations/`).
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

      {/* Messaging Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 border rounded-xl bg-card overflow-hidden h-[620px] shadow-sm">
        {/* Left: Contact List */}
        <div className="md:col-span-4 lg:col-span-4 border-r flex flex-col h-full bg-muted/10">
          {/* Search & Filters */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                className="pl-8 h-9 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={roleFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setRoleFilter("all")}
              >
                All
              </Button>
              <Button
                variant={roleFilter === "teacher" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1 gap-1"
                onClick={() => setRoleFilter("teacher")}
              >
                <GraduationCap className="h-3 w-3" /> Faculty
              </Button>
              <Button
                variant={roleFilter === "student" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1 gap-1"
                onClick={() => setRoleFilter("student")}
              >
                <Users className="h-3 w-3" /> Students
              </Button>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y">
            {isContactsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading contacts...
              </div>
            ) : filteredContacts?.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No users found.
              </div>
            ) : (
              filteredContacts?.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                const isTeacher = contact.role === "teacher";

                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors hover:bg-muted/50 ${
                      isSelected ? "bg-primary/10 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs flex-shrink-0">
                      {contact.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate">
                          {contact.full_name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 font-normal"
                        >
                          {isTeacher ? "Faculty" : "Student"}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {contact.course ? `${contact.course} • ` : ""}
                        {contact.email}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div className="md:col-span-8 lg:col-span-8 flex flex-col h-full bg-background">
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b flex items-center justify-between bg-card/60">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                    {selectedContact.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selectedContact.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedContact.email} • {selectedContact.role.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                {isMessagesLoading ? (
                  <div className="text-center py-16 text-xs text-muted-foreground">
                    Loading conversation...
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs">
                      Send a message to start conversation with {selectedContact.full_name}.
                    </p>
                  </div>
                ) : (
                  messages?.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    const time = new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground px-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{time}</span>
                          {isMine && <CheckCheck className="h-3 w-3 text-primary ml-1" />}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSend} className="p-3 border-t bg-card flex gap-2">
                <Input
                  placeholder={`Message ${selectedContact.full_name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-base font-semibold text-foreground">Select a contact</p>
              <p className="text-xs mt-1">
                Choose a student or faculty member from the list to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
