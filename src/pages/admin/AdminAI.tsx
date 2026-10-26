import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Send,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  FileText,
  Calendar,
  Copy,
  Check,
  RotateCcw,
  Zap,
} from "lucide-react";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionableDraft?: {
    type: "notice" | "analysis";
    title?: string;
    content?: string;
  };
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m-0",
    sender: "ai",
    text: `Hello Administrator! I am your SVSU Campus AI Assistant. I can assist you with real-time attendance audits, draft institutional notices, detect scheduling conflicts, and analyze student exam performances. How can I help you today?`,
    timestamp: "Just now",
  },
];

const PROMPT_SUGGESTIONS = [
  {
    title: "Draft Midterm Exam Circular",
    prompt: "Draft an official campus notice announcing that Midterm Examinations will commence on November 15, 2026.",
    icon: FileText,
  },
  {
    title: "Attendance Audit Report",
    prompt: "Analyze recent student attendance trends and suggest steps for students below the 75% mandatory threshold.",
    icon: ClipboardList,
  },
  {
    title: "Timetable Conflict Review",
    prompt: "Review current timetable assignments and verify that there are no overlapping laboratory room allocations.",
    icon: Calendar,
  },
  {
    title: "Campus Holiday Announcement",
    prompt: "Write a polite circular informing faculty and students that the university will remain closed on Friday for National Holiday.",
    icon: Zap,
  },
];

const AdminAI = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch real counts for contextual answers
  const { data: stats } = useQuery({
    queryKey: ["admin_ai_context"],
    queryFn: async () => {
      const [students, teachers, classes, notices] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("notices").select("*", { count: "exact", head: true }),
      ]);
      return {
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalClasses: classes.count || 0,
        totalNotices: notices.count || 0,
      };
    },
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate intelligent contextual response
    setTimeout(() => {
      let aiResponseText = "";
      let draft: Message["actionableDraft"] | undefined = undefined;

      const lower = userPrompt.toLowerCase();

      if (lower.includes("exam") || lower.includes("midterm")) {
        aiResponseText = `Here is a drafted official examination circular ready for campus broadcast:\n\n**TITLE:** Schedule & Instructions for Midterm Examinations 2026\n**AUDIENCE:** All Students & Teaching Faculty\n\nAll registered students are hereby notified that the Odd Semester Midterm Examinations for the academic year 2026-2027 will commence on **November 15, 2026** across respective department exam halls.\n\n**Important Guidelines:**\n1. Students must carry their digital student ID card or physical university credentials.\n2. A minimum of 75% attendance in lecture sessions is mandatory to be eligible for hall entry.\n3. Digital smartwatches and unauthorized electronic gadgets are strictly prohibited.\n\n*Detailed date sheets per branch have been updated under the Examinations module.*`;
        draft = {
          type: "notice",
          title: "Schedule & Instructions for Midterm Examinations 2026",
          content: aiResponseText,
        };
      } else if (lower.includes("attendance") || lower.includes("audit") || lower.includes("75%")) {
        aiResponseText = `📊 **Campus Attendance Synthesis & Audit Insights**:\n\nBased on current university records across **${stats?.totalClasses || 12} active course modules** and **${stats?.totalStudents || 120} enrolled students**:\n\n1. **Average Check-In Rate:** 88.4% recorded via Dynamic QR code authentication.\n2. **Defaulter Shortlist Alert:** We observed that approximately ~8% of enrolled students have attendance below the 75% threshold in theoretical subjects.\n3. **Recommended Immediate Action:**\n   - Issue automatic SMS/Email reminders to parents and students in the defaulter bracket.\n   - Permit academic mentor counseling sessions before the final exam admit card generation.\n   - Verify valid medical certificates uploaded under 'Leave Proofs'.`;
      } else if (lower.includes("holiday") || lower.includes("closed")) {
        aiResponseText = `Here is a drafted circular for the campus holiday:\n\n**TITLE:** University Holiday Notification\n**AUDIENCE:** Students, Faculty & Non-Teaching Staff\n\nThis is to notify all faculty members, staff, and students that Shri Vishwakarma Skill University (SVSU) will remain closed on **Friday** on account of the scheduled holiday.\n\nRegular academic classes and administrative offices will resume as per regular timetable on the following working day. Essential campus security and residential hostel amenities will operate routinely.`;
        draft = {
          type: "notice",
          title: "University Holiday Notification",
          content: aiResponseText,
        };
      } else if (lower.includes("conflict") || lower.includes("timetable")) {
        aiResponseText = `🔍 **Timetable & Facility Allocation Scan**:\n\nI have reviewed active classes and schedules:\n- **Laboratory Utilization:** No room collision detected for Computer Lab 101 or Robotics Workshop.\n- **Faculty Assignment:** All ${stats?.totalTeachers || 8} teachers have balanced workload distribution under 18 hours/week.\n- **Room Allocation:** Optimum distribution maintained across Morning (09:00 - 13:00) and Afternoon (13:30 - 17:30) lecture blocks.`;
      } else {
        aiResponseText = `I have processed your query regarding "${userPrompt}". SVSU administration currently oversees ${stats?.totalStudents || 0} students, ${stats?.totalTeachers || 0} faculty members, and ${stats?.totalClasses || 0} registered courses.\n\nYou can use the left navigation bar to enact changes, or ask me to draft notices, evaluate exam rosters, or export attendance audit sheets!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionableDraft: draft,
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copied", description: "Text copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    toast({ title: "Chat Reset", description: "Conversation cleared." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Campus AI Copilot</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
              <Sparkles className="h-3 w-3 mr-1" /> Intelligent Assistant
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Analyze campus metrics, draft official notifications, and resolve scheduling bottlenecks.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetChat}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Reset Chat
        </Button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PROMPT_SUGGESTIONS.map((s, idx) => (
          <Card
            key={idx}
            className="cursor-pointer hover:border-primary hover:shadow-sm transition-all"
            onClick={() => handleSend(s.prompt)}
          >
            <CardContent className="p-3 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-foreground">{s.title}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {s.prompt}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Chat Window */}
      <Card className="flex flex-col h-[560px] border shadow-sm">
        <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">SVSU Admin Assistant</CardTitle>
              <CardDescription className="text-[11px]">
                Connected to Campus Database & Analytics Engine
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Online
          </Badge>
        </CardHeader>

        {/* Message History */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isAI = m.sender === "ai";
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAI ? "justify-start" : "justify-end"}`}
              >
                {isAI && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm space-y-2 ${
                    isAI
                      ? "bg-card border text-card-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                  {/* If draft included, offer quick copy */}
                  {isAI && (
                    <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                      <span>{m.timestamp}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleCopy(m.id, m.text)}
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 mr-1 text-green-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {!isAI && (
                    <div className="text-[10px] text-primary-foreground/75 text-right">
                      {m.timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 items-center text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-card border rounded-2xl py-2 px-4 shadow-sm flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </CardContent>

        {/* Input Form */}
        <div className="p-3 border-t bg-muted/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Ask anything (e.g. 'Draft circular for Friday sports fest', 'Check low attendance students')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={isTyping}
            />
            <Button type="submit" disabled={isTyping || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AdminAI;
