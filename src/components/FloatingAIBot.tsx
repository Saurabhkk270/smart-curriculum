import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Calendar,
  ClipboardList,
  BookOpen,
  FileText,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    textToCopy: string;
  };
};

export function FloatingAIBot() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const role = profile?.role || "student";
  const userName = profile?.full_name || (role === "admin" ? "Administrator" : role === "teacher" ? "Professor" : "Student");

  // Welcome message customized to role
  const getInitialMessage = (): Message => {
    if (role === "admin") {
      return {
        id: "init-admin",
        sender: "ai",
        text: `Hello ${userName}! I am your Campus Admin AI Copilot. I can draft institutional circulars, analyze attendance defaulters, check exam date sheets, and assist with university regulatory tasks. How may I assist you?`,
        timestamp: "Just now",
      };
    }
    if (role === "teacher") {
      return {
        id: "init-teacher",
        sender: "ai",
        text: `Hello ${userName}! I am your Faculty Teaching Assistant. I can help you draft class announcements, create quiz questions, formulate lecture lesson plans, and compose attendance notices for students. What would you like to prepare today?`,
        timestamp: "Just now",
      };
    }
    return {
      id: "init-student",
      sender: "ai",
      text: `Hi ${userName}! I am your SVSU Academic Assistant. I can calculate how many classes you need to reach 75% attendance, help explain coursework concepts, organize study plans, and guide you on college exam rules. How can I help?`,
      timestamp: "Just now",
    };
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);

  // Update initial message if role updates
  useEffect(() => {
    setMessages([getInitialMessage()]);
  }, [role, userName]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Role-specific quick chips
  const getSuggestions = () => {
    if (role === "admin") {
      return [
        { label: "Draft Exam Notice", prompt: "Draft an urgent campus circular announcing the Midterm Examination schedule commencing next month." },
        { label: "Attendance Audit", prompt: "Summarize the university policy and action steps for students with attendance below the mandatory 75% threshold." },
        { label: "Holiday Circular", prompt: "Write an official university holiday notification for the upcoming national holiday." },
        { label: "Faculty Workload", prompt: "Outline recommended weekly teaching hours and guidelines for engineering department faculty." },
      ];
    }
    if (role === "teacher") {
      return [
        { label: "Draft Assignment Announcement", prompt: "Draft a clear, friendly class announcement asking students to submit their practical lab reports by Friday." },
        { label: "Generate Quiz Questions", prompt: "Create 5 multiple choice conceptual quiz questions with answers on Object-Oriented Programming (OOP)." },
        { label: "Low Attendance Warning", prompt: "Write a polite reminder notice to students who have missed recent lectures advising them to regularize attendance." },
        { label: "Lesson Plan Outline", prompt: "Draft a 1-hour structured lesson plan outline for teaching Database Normalization (1NF, 2NF, 3NF)." },
      ];
    }
    return [
      { label: "Attendance 75% Formula", prompt: "If I attended 28 out of 40 lectures, how many more consecutive classes must I attend to achieve 75% attendance?" },
      { label: "Midterm Study Plan", prompt: "Create a 5-day revision study timetable for my upcoming semester examinations." },
      { label: "Leave Proof Guidelines", prompt: "What are the valid rules and accepted documents for submitting medical leave proofs for missed classes?" },
      { label: "Explain Recursion in Code", prompt: "Can you explain recursion with a simple real-world example and a quick Python snippet?" },
    ];
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copied!", description: "Copied directly to your clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // Context-aware AI logic
    setTimeout(() => {
      let aiText = "";
      const q = query.toLowerCase();

      if (role === "student") {
        if (q.includes("75%") || q.includes("attendance") || q.includes("calculate") || q.includes("classes")) {
          aiText = `📊 **Attendance Target Calculation & Advice**:\n\nTo reach the mandatory **75% criteria**:\n- **Formula:** Total Attended + X / (Total Sessions + X) ≥ 0.75\n- **Example:** If you attended 28 out of 40 classes (currently 70%):\n  You need to attend **8 consecutive lectures** without missing any to reach exactly 75% (36 / 48 = 75%)!\n\n💡 *Tip: Make sure you never miss lab practical sessions as they carry double credit weight in semester evaluations.*`;
        } else if (q.includes("leave") || q.includes("proof") || q.includes("medical")) {
          aiText = `📑 **Medical & Leave Proof Rules at SVSU**:\n\n1. Valid medical certificates from a registered physician (MBBS) must be uploaded within **3 days** of returning to campus.\n2. Upload your certificate image/PDF under **Attendance Records > Upload Leave Proof**.\n3. Once submitted, your subject teacher will review and verify your attendance adjustments.\n4. Remember: University guidelines permit medical condonation for up to 10% attendance shortfall.`;
        } else if (q.includes("exam") || q.includes("study") || q.includes("plan")) {
          aiText = `📅 **Recommended 5-Day Exam Revision Strategy**:\n\n- **Day 1 & 2:** High-weightage theoretical units + core formulas/definitions.\n- **Day 3:** Practical code implementations and numerical problem-solving.\n- **Day 4:** Previous year question papers (PYQs) and mock unit test practice.\n- **Day 5:** Formula sheet revision + rest early before exam day.\n\nCarry your official Student ID card and check your hall allocation in the **Class Timetable** tab!`;
        } else {
          aiText = `Here is helpful guidance on "${query}":\n\nAt SVSU, academic excellence and regular lecture participation go hand in hand. If you need details on specific subject syllabus, faculty contact hours, or campus facilities, feel free to ask! Remember to keep your QR scanner updated for daily attendance check-ins.`;
        }
      } else if (role === "teacher") {
        if (q.includes("assignment") || q.includes("announcement") || q.includes("report")) {
          aiText = `📢 **Drafted Class Announcement** (Ready to copy & post):\n\n**Subject: Submission of Practical Lab Assessment & Reports**\n\nDear Students,\n\nPlease be reminded that your practical lab reports and code implementations for this term must be submitted by **Friday at 5:00 PM**.\n\nEnsure that all diagrams are labeled and code outputs are verified. Late submissions will attract a 10% deduction. Check the Announcements section for any template updates.\n\nBest regards,\nFaculty, Dept. of Applied Sciences`;
        } else if (q.includes("quiz") || q.includes("question") || q.includes("test")) {
          aiText = `📝 **5 Conceptual Assessment Questions on OOP & Programming**:\n\n1. Which OOP principle is demonstrated by hiding internal implementation details and exposing only essential interfaces?\n   a) Polymorphism  b) Encapsulation (Answer)  c) Inheritance  d) Abstraction\n\n2. What is the key difference between compile-time and runtime polymorphism in Java/C++?\n   - *Answer: Overloading (compile-time) vs Overriding with virtual functions (runtime).*\n\n3. Can an abstract class in Python or Java have concrete methods?\n   - *Answer: Yes, abstract classes can contain fully defined methods alongside abstract ones.*\n\n4. What is the purpose of the 'super' keyword?\n   - *Answer: To invoke the parent class constructor or method directly.*\n\n5. Why is multiple inheritance restricted in Java?\n   - *Answer: To avoid the Diamond Problem (ambiguity in method resolution).*`;
        } else if (q.includes("lesson") || q.includes("plan")) {
          aiText = `📋 **Structured 60-Minute Lesson Plan: Database Normalization**:\n\n- **00 - 10 min:** Recap relational schemas, anomalies (Insertion, Deletion, Update).\n- **10 - 25 min:** 1st Normal Form (Atomic values) & 2nd Normal Form (Eliminating partial dependency).\n- **25 - 45 min:** 3rd Normal Form & Boyce-Codd NF (Transitive dependencies with live SQL table examples).\n- **45 - 55 min:** Interactive classroom exercise: Students normalize an unnormalized student-enrollment receipt.\n- **55 - 60 min:** Q&A, summary of BCNF vs 3NF, homework reading assignment.`;
        } else {
          aiText = `👨‍🏫 **Faculty Advisory on "${query}"**:\n\nI have generated helpful notes for your teaching routine. You can post notifications directly through **Teacher Announcements**, conduct dynamic QR attendance from **QR Code Generator**, or mark manual adjustments under **Manual Attendance**. Let me know if you need customized exam questions or lesson materials!`;
        }
      } else {
        // Admin role
        if (q.includes("notice") || q.includes("circular") || q.includes("exam")) {
          aiText = `📜 **Official University Circular** (Ready for Broadcast in Campus Notices):\n\n**REF:** SVSU/ADMIN/EXAM/2026/04\n**SUBJECT:** Conduct of Odd Semester Midterm Examinations 2026\n\nAll Head of Departments, Faculty Members, and Enrolled Students are hereby notified that the Odd Semester Midterm Examinations will commence from **November 15, 2026**.\n\n1. Attendance criteria of minimum 75% remains strictly mandatory for hall ticket issuance.\n2. Seating plans and date sheets have been published under the Examinations Portal.\n3. University invigilators must report 30 minutes prior to session start.\n\nBy Order of Controller of Examinations\nShri Vishwakarma Skill University`;
        } else if (q.includes("attendance") || q.includes("audit") || q.includes("75%")) {
          aiText = `📊 **Institutional Attendance Overview & Shortfall Summary**:\n\n- **Active Course Modules:** All classes are logging QR records routinely.\n- **Compliance Status:** ~91.2% average daily lecture participation.\n- **Action Protocol for <75% Defaulters:**\n  1. Trigger SMS/Email notifications to registered parent contacts.\n  2. Mandate faculty mentor counseling sessions under **Cohorts & Groups**.\n  3. Verify genuine medical applications under **Attendance Audit** before exam roster freezing.`;
        } else if (q.includes("holiday")) {
          aiText = `🏛️ **Official University Holiday Notification**:\n\n**CIRCULAR:** Campus Closure Announcement\n\nThis is to notify all faculty, staff, and students that the university campus and academic departments will remain closed on **Friday** in observance of the scheduled holiday.\n\nRegular academic routine and administrative services will resume on the next working day. Essential maintenance and residential hostel mess services will function as scheduled.`;
        } else {
          aiText = `🏢 **Administrative Analysis for "${query}"**:\n\nYou can regulate campus records across all 16 modules: manage student enrollments in **Students Directory**, publish master date sheets in **Examinations**, or review complaints under **Feedback & Review**. All actions are securely logged in the **Activity Audit Log**.`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedAction: {
            label: "Copy Response",
            textToCopy: aiText,
          },
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const badgeColor =
    role === "admin"
      ? "bg-purple-600 text-white"
      : role === "teacher"
      ? "bg-emerald-600 text-white"
      : "bg-blue-600 text-white";

  const btnGlow =
    role === "admin"
      ? "from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700"
      : role === "teacher"
      ? "from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900"
      : "from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900";

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (Always pinned to bottom-right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-md text-xs font-semibold text-slate-700 gap-1.5 animate-in fade-in slide-in-from-right-4 duration-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
            <span>Campus AI Copilot</span>
          </div>

          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className={`h-13 w-13 rounded-full shadow-xl bg-gradient-to-r ${btnGlow} text-white p-0 relative transition-transform duration-200 hover:scale-105 active:scale-95 border border-white/20`}
            aria-label="Open AI Assistant"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </Button>
        </div>
      )}

      {/* 2. CHAT DRAWER / POPUP */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] shadow-2xl border border-slate-300 flex flex-col bg-white rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <CardHeader className="py-3 px-4 bg-slate-900 text-white border-b border-slate-800 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-white">
                  SVSU AI Copilot
                  <Badge className={`text-[10px] px-1.5 py-0 font-normal uppercase ${badgeColor}`}>
                    {role}
                  </Badge>
                </CardTitle>
                <div className="text-[11px] text-slate-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Ready to assist {userName}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Quick Prompts Chips */}
          <div className="px-3 py-2 bg-muted/30 border-b flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {getSuggestions().map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(s.prompt)}
                className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full bg-card border hover:border-primary hover:text-primary transition-colors shrink-0 shadow-2xs"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 text-xs sm:text-sm">
            {messages.map((m) => {
              const isAI = m.sender === "ai";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}
                >
                  {isAI && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-xs space-y-2 leading-relaxed ${
                      isAI
                        ? "bg-card border text-card-foreground"
                        : "bg-primary text-primary-foreground font-medium"
                    }`}
                  >
                    <div className="whitespace-pre-line text-xs">{m.text}</div>

                    {isAI && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
                        <span>{m.timestamp}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] hover:text-primary"
                          onClick={() => handleCopy(m.id, m.suggestedAction?.textToCopy || m.text)}
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
              <div className="flex gap-2.5 items-center text-xs text-muted-foreground">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-card border rounded-2xl py-2 px-3 shadow-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </CardContent>

          {/* Input Bar */}
          <CardFooter className="p-2.5 border-t bg-muted/20 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 w-full"
            >
              <Input
                placeholder={`Ask AI (${role} assistant)...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="text-xs h-9 flex-1"
                disabled={isTyping}
              />
              <Button type="submit" size="sm" className="h-9 px-3" disabled={isTyping || !input.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
