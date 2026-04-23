import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlignLeft,
  ArrowRightLeft,
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Clock3,
  Command,
  FileText,
  Filter,
  Gauge,
  Home,
  Inbox,
  LayoutGrid,
  List,
  ListFilter,
  LoaderCircle,
  MessageSquareText,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Repeat,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SquareCheckBig,
  Target,
  TrendingUp,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Role = "employee" | "manager" | "admin";
type TaskStatus = "emergency" | "in-progress" | "to-do" | "completed" | "blocked";
type Priority = "high" | "medium" | "low";
type PageKey =
  | "home"
  | "today"
  | "weekly"
  | "total"
  | "meetings"
  | "approvals"
  | "analytics"
  | "users"
  | "settings";

type AppTask = {
  id: string;
  title: string;
  project: string;
  owner: string;
  ownerInitials: string;
  due: string;
  week: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  emergency?: boolean;
  requiresReview?: boolean;
  blockedReason?: string;
  tags: string[];
};

type RecurrenceFrequency = "daily" | "weekly" | "monthly";

type MeetingRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number;
  count: number;
};

type TaskActionItemDraft = {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  fixed: boolean;
  priority: Priority;
};

type TaskDraft = {
  title: string;
  field: string;
  customField: string;
  fixed: boolean;
  priority: Priority;
  dueDate: string;
  description: string;
  assignee: string;
  weight: string;
  actionItems: TaskActionItemDraft[];
};

type BulkTaskDraft = TaskDraft & {
  key: string;
};

type Meeting = {
  id: string;
  title: string;
  project: string;
  time: string;
  dateTime: string;
  duration: number;
  attendees: string[];
  status: "scheduled" | "draft" | "review";
  summary: string;
  actions: string[];
  aiConfidence: number;
  recurrence?: MeetingRecurrence;
};

type ApprovalItem = {
  id: string;
  type: "task" | "mom" | "delete" | "query";
  title: string;
  owner: string;
  age: string;
  priority: Priority;
  context: string;
};

type NotificationItem = {
  id: string;
  type: "approval" | "meeting" | "task";
  title: string;
  detail: string;
  time: string;
  unread?: boolean;
};

type UserRecord = {
  id: string;
  name: string;
  role: Role;
  team: string;
  utilization: number;
  status: "online" | "away" | "review";
};

type NavItem = {
  key: PageKey;
  title: string;
  path: string;
  icon: typeof LayoutGrid;
  roles: Role[];
  badge?: string;
};

const roleLabels: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin",
};

const pageCopy: Record<PageKey, { title: string; subtitle: string }> = {
  home: {
    title: "Home",
    subtitle: "Overview of your workspace, team, and key task surfaces.",
  },
  today: {
    title: "Today's Tasks",
    subtitle: "Run the day from one dense, review-friendly surface.",
  },
  weekly: {
    title: "Weekly Tasks",
    subtitle: "Shape the week, rebalance priorities, and pull the right work forward.",
  },
  total: {
    title: "Total Tasks",
    subtitle: "Master backlog across projects, weeks, and requested revisions.",
  },
  meetings: {
    title: "M.O.M / Meetings",
    subtitle: "Track meeting outputs, AI drafts, and action alignment before sign-off.",
  },
  approvals: {
    title: "Approvals",
    subtitle: "Review completions, minutes, deletions, and blocker escalations.",
  },
  analytics: {
    title: "Performance Analytics",
    subtitle: "Workload, throughput, and blocked-time signals for managers and admins.",
  },
  users: {
    title: "User Management",
    subtitle: "Preview role-ready staffing, invites, and workload coverage.",
  },
  settings: {
    title: "Settings",
    subtitle: "Prepare preferences, integrations, and control surfaces for backend connection.",
  },
};

const navItems: NavItem[] = [
  { key: "home", title: "Home", path: "/", icon: Home, roles: ["employee", "manager", "admin"] },
  { key: "today", title: "Today's Tasks", path: "/today", icon: LayoutGrid, roles: ["employee", "manager", "admin"] },
  { key: "weekly", title: "Weekly Tasks", path: "/weekly", icon: CalendarClock, roles: ["employee", "manager", "admin"] },
  { key: "total", title: "Total Tasks", path: "/total", icon: Inbox, roles: ["employee", "manager", "admin"] },
  { key: "meetings", title: "M.O.M", path: "/meetings", icon: MessageSquareText, roles: ["employee", "manager", "admin"], badge: "AI" },
  { key: "approvals", title: "Approvals", path: "/approvals", icon: ShieldCheck, roles: ["manager", "admin"], badge: "12" },
  { key: "analytics", title: "Analytics", path: "/analytics", icon: Gauge, roles: ["manager", "admin"] },
  { key: "users", title: "User Management", path: "/users", icon: Users, roles: ["admin"] },
  { key: "settings", title: "Settings", path: "/settings", icon: Settings, roles: ["employee", "manager", "admin"] },
];

const tasksSeed: AppTask[] = [
  {
    id: "TSK-1042",
    title: "Escalation response for Westbridge onboarding blockers",
    project: "Westbridge",
    owner: "Maya Chen",
    ownerInitials: "MC",
    due: "09:30",
    week: "This week",
    status: "emergency",
    priority: "high",
    progress: 46,
    emergency: true,
    requiresReview: true,
    tags: ["Client", "Sign-off"],
  },
  {
    id: "TSK-1031",
    title: "Finalize procurement dashboard acceptance notes",
    project: "FlowDesk Core",
    owner: "Jon Park",
    ownerInitials: "JP",
    due: "11:15",
    week: "This week",
    status: "in-progress",
    priority: "high",
    progress: 72,
    requiresReview: true,
    tags: ["QA", "Dashboard"],
  },
  {
    id: "TSK-1033",
    title: "Prepare weekly staffing rebalance proposal",
    project: "People Ops",
    owner: "Sara Ali",
    ownerInitials: "SA",
    due: "14:00",
    week: "This week",
    status: "to-do",
    priority: "medium",
    progress: 18,
    tags: ["Planning", "Manager"],
  },
  {
    id: "TSK-1025",
    title: "Confirm release checklist with security review attachments",
    project: "Nimbus Release",
    owner: "Leo Grant",
    ownerInitials: "LG",
    due: "16:45",
    week: "This week",
    status: "completed",
    priority: "high",
    progress: 100,
    requiresReview: true,
    tags: ["Release", "Security"],
  },
  {
    id: "TSK-0998",
    title: "Revise CRM import mapping for APAC region",
    project: "Orbit CRM",
    owner: "Nina Roy",
    ownerInitials: "NR",
    due: "Thu",
    week: "Week 17",
    status: "blocked",
    priority: "high",
    progress: 58,
    blockedReason: "Awaiting source field confirmation",
    tags: ["Data", "Revision"],
  },
  {
    id: "TSK-0982",
    title: "Draft M.O.M follow-up tasks from partner review",
    project: "Partnerships",
    owner: "Evan Holt",
    ownerInitials: "EH",
    due: "Fri",
    week: "Week 17",
    status: "to-do",
    priority: "medium",
    progress: 10,
    tags: ["Meeting", "AI Draft"],
  },
  {
    id: "TSK-0974",
    title: "Re-open access audit items for admin handoff",
    project: "Governance",
    owner: "Ivy Stone",
    ownerInitials: "IS",
    due: "Next Mon",
    week: "Week 18",
    status: "to-do",
    priority: "low",
    progress: 4,
    tags: ["Audit", "Admin"],
  },
  {
    id: "TSK-1048",
    title: "Pull overdue customer escalations into today's queue",
    project: "Support Ops",
    owner: "Omar Reed",
    ownerInitials: "OR",
    due: "10:20",
    week: "This week",
    status: "in-progress",
    priority: "high",
    progress: 63,
    emergency: true,
    tags: ["Overdue", "Escalation"],
  },
];

const meetingsSeed: Meeting[] = [
  {
    id: "MOM-38",
    title: "Weekly delivery steering",
    project: "FlowDesk Core",
    time: "Tue, May 31, 06:56 PM",
    dateTime: "2026-05-31T18:56",
    duration: 30,
    attendees: ["Jon", "Maya", "Sara", "Leo"],
    status: "scheduled",
    summary: "AI extracted 6 tasks and flagged 2 low-confidence action owners.",
    actions: ["Approve action owners", "Send summary", "Create follow-up tasks"],
    aiConfidence: 84,
    recurrence: { frequency: "weekly", interval: 1, count: 20 },
  },
  {
    id: "MOM-37",
    title: "Client recovery call",
    project: "Westbridge",
    time: "Tue, May 24, 06:56 PM",
    dateTime: "2026-05-24T18:56",
    duration: 30,
    attendees: ["Maya", "Omar", "Nina", "Leo"],
    status: "scheduled",
    summary: "Draft agenda and pre-read attached. Awaiting approval for escalated asks.",
    actions: ["Attach latest blockers", "Confirm attendees"],
    aiConfidence: 72,
    recurrence: { frequency: "weekly", interval: 1, count: 20 },
  },
  {
    id: "MOM-36",
    title: "Quarterly staffing calibration",
    project: "People Ops",
    time: "Tue, May 17, 06:56 PM",
    dateTime: "2026-05-17T18:56",
    duration: 30,
    attendees: ["Sara", "Ivy", "Admin", "Maya"],
    status: "scheduled",
    summary: "Pending calendar sync connection for room and reminders.",
    actions: ["Enable sync later", "Assign agenda owner"],
    aiConfidence: 93,
    recurrence: { frequency: "weekly", interval: 1, count: 20 },
  },
  {
    id: "MOM-35",
    title: "Daily standup",
    project: "FlowDesk Core",
    time: "Mon, May 16, 09:00 AM",
    dateTime: "2026-05-16T09:00",
    duration: 15,
    attendees: ["Jon", "Maya", "Sara", "Leo"],
    status: "scheduled",
    summary: "Quick daily sync on blockers and progress.",
    actions: ["Review blockers", "Update board"],
    aiConfidence: 90,
    recurrence: { frequency: "daily", interval: 1, count: 4 },
  },
  {
    id: "MOM-34",
    title: "Monthly budget review",
    project: "Finance",
    time: "Fri, May 13, 02:00 PM",
    dateTime: "2026-05-13T14:00",
    duration: 60,
    attendees: ["Ivy", "Admin", "Sara"],
    status: "scheduled",
    summary: "Review monthly spend and forecasts.",
    actions: ["Prepare reports", "Share projections"],
    aiConfidence: 88,
    recurrence: { frequency: "monthly", interval: 1, count: 2 },
  },
  {
    id: "MOM-33",
    title: "Sprint retrospective",
    project: "FlowDesk Core",
    time: "Fri, May 6, 03:00 PM",
    dateTime: "2026-05-06T15:00",
    duration: 45,
    attendees: ["Jon", "Maya", "Omar"],
    status: "review",
    summary: "Reflect on sprint outcomes and process improvements.",
    actions: ["Document improvements", "Update process"],
    aiConfidence: 76,
    recurrence: { frequency: "weekly", interval: 2, count: 12 },
  },
];

const approvalsSeed: ApprovalItem[] = [
  {
    id: "APR-91",
    type: "task",
    title: "Completion review · procurement dashboard acceptance notes",
    owner: "Jon Park",
    age: "12m",
    priority: "high",
    context: "Needs manager sign-off before client share.",
  },
  {
    id: "APR-88",
    type: "mom",
    title: "M.O.M review · weekly delivery steering",
    owner: "Maya Chen",
    age: "35m",
    priority: "high",
    context: "2 AI-drafted tasks have low-confidence owners.",
  },
  {
    id: "APR-85",
    type: "delete",
    title: "Deletion request · duplicate vendor onboarding task",
    owner: "Nina Roy",
    age: "1h",
    priority: "medium",
    context: "Can be approved after verifying mirrored task history.",
  },
  {
    id: "APR-82",
    type: "query",
    title: "Query · revise due date for APAC import mapping",
    owner: "Evan Holt",
    age: "2h",
    priority: "high",
    context: "Blocked by source confirmation from partner systems.",
  },
];

const notificationsSeed: NotificationItem[] = [
  {
    id: "NT-1",
    type: "approval",
    title: "2 approvals waiting on you",
    detail: "Completion review and M.O.M review are both older than 30 minutes.",
    time: "Just now",
    unread: true,
  },
  {
    id: "NT-2",
    type: "meeting",
    title: "AI draft ready for weekly delivery steering",
    detail: "6 extracted actions with 84% confidence.",
    time: "18 min ago",
    unread: true,
  },
  {
    id: "NT-3",
    type: "task",
    title: "Westbridge escalation pulled into Today",
    detail: "Emergency tag added and review required.",
    time: "51 min ago",
  },
];

const usersSeed: UserRecord[] = [
  { id: "USR-1", name: "Maya Chen", role: "manager", team: "Delivery", utilization: 86, status: "online" },
  { id: "USR-2", name: "Jon Park", role: "employee", team: "Product", utilization: 72, status: "review" },
  { id: "USR-3", name: "Sara Ali", role: "manager", team: "People Ops", utilization: 64, status: "away" },
  { id: "USR-4", name: "Ivy Stone", role: "admin", team: "Governance", utilization: 59, status: "online" },
  { id: "USR-5", name: "Omar Reed", role: "employee", team: "Support", utilization: 92, status: "review" },
];

const analyticsWorkload = [
  { name: "Mon", focus: 76, blocked: 8, completed: 11 },
  { name: "Tue", focus: 81, blocked: 10, completed: 13 },
  { name: "Wed", focus: 74, blocked: 14, completed: 10 },
  { name: "Thu", focus: 88, blocked: 7, completed: 16 },
  { name: "Fri", focus: 69, blocked: 9, completed: 12 },
];

const analyticsCompletion = [
  { name: "Delivery", value: 38 },
  { name: "Support", value: 22 },
  { name: "Product", value: 18 },
  { name: "Ops", value: 14 },
];

const statusTone: Record<TaskStatus | ApprovalItem["type"] | Meeting["status"], string> = {
  emergency: "bg-metric-red-soft text-metric-red border-transparent",
  "in-progress": "bg-metric-blue-soft text-metric-blue border-transparent",
  "to-do": "bg-secondary text-secondary-foreground border-transparent",
  completed: "bg-metric-green-soft text-metric-green border-transparent",
  blocked: "bg-metric-amber-soft text-metric-amber border-transparent",
  task: "bg-metric-blue-soft text-metric-blue border-transparent",
  mom: "bg-accent text-accent-foreground border-transparent",
  delete: "bg-metric-red-soft text-metric-red border-transparent",
  query: "bg-metric-amber-soft text-metric-amber border-transparent",
  scheduled: "bg-secondary text-secondary-foreground border-transparent",
  draft: "bg-accent text-accent-foreground border-transparent",
  review: "bg-metric-emerald-soft text-metric-emerald border-transparent",
};

const priorityTone: Record<Priority, string> = {
  high: "bg-metric-amber-soft text-metric-amber border-transparent",
  medium: "bg-metric-blue-soft text-metric-blue border-transparent",
  low: "bg-secondary text-secondary-foreground border-transparent",
};

const metricTone = {
  blue: "bg-metric-blue-soft text-metric-blue border-border/50",
  emerald: "bg-metric-emerald-soft text-metric-emerald border-border/50",
  amber: "bg-metric-amber-soft text-metric-amber border-border/50",
  red: "bg-metric-red-soft text-metric-red border-border/50",
  green: "bg-metric-green-soft text-metric-green border-border/50",
};

function createActionItemDraft(): TaskActionItemDraft {
  return {
    title: "",
    description: "",
    assignee: "Myself",
    dueDate: "",
    fixed: false,
    priority: "medium",
  };
}

function createTaskDraft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: "",
    field: "default",
    customField: "",
    fixed: false,
    priority: "medium",
    dueDate: "",
    description: "",
    assignee: "Myself",
    weight: "10",
    actionItems: [createActionItemDraft()],
    ...overrides,
  };
}

function getOwnerInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTaskDueDate(dueDate: string) {
  if (!dueDate) return "No due date";

  try {
    return format(new Date(`${dueDate}T00:00:00`), "MMM d");
  } catch {
    return "No due date";
  }
}

function getTaskFieldLabel(field: string, customField: string) {
  if (field === "custom") {
    return customField.trim() || "Custom";
  }

  return field.charAt(0).toUpperCase() + field.slice(1);
}

function parseBulkTaskLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function syncBulkTaskDrafts(value: string, current: BulkTaskDraft[], seedDraft: TaskDraft) {
  const titles = parseBulkTaskLines(value);

  return titles.map((title, index) => {
    const existing = current[index];

    if (existing) {
      return { ...existing, title };
    }

    return {
      ...createTaskDraft({
        field: seedDraft.field,
        customField: seedDraft.customField,
        fixed: seedDraft.fixed,
        priority: seedDraft.priority,
        dueDate: seedDraft.dueDate,
        description: seedDraft.description,
        assignee: seedDraft.assignee,
        weight: seedDraft.weight,
        actionItems: seedDraft.actionItems.map((item) => ({ ...item })),
      }),
      key: `bulk-${index}-${title.toLowerCase().replace(/\s+/g, "-")}`,
      title,
    };
  });
}

function getPageKey(pathname: string): PageKey {
  if (pathname.startsWith("/member/")) return "home";
  const match = navItems.find((item) => item.path === pathname);
  return match?.key ?? "home";
}

function FlowDeskIndex() {
  const [role, setRole] = useState<Role>("manager");
  const [tasks, setTasks] = useState(tasksSeed);
  const [meetings, setMeetings] = useState(meetingsSeed);
  const [approvals] = useState(approvalsSeed);
  const [notifications] = useState(notificationsSeed);
  const [users] = useState(usersSeed);
  const [selectedTaskId, setSelectedTaskId] = useState(tasksSeed[0]?.id ?? "");
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pullOpen, setPullOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = getPageKey(location.pathname);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const availableNav = useMemo(
    () => navItems.filter((item) => item.roles.includes(role)),
    [role],
  );

  useEffect(() => {
    const allowed = availableNav.some((item) => item.path === location.pathname) || location.pathname.startsWith("/member/");
    if (!allowed) {
      navigate(availableNav[0]?.path ?? "/", { replace: true });
    }
  }, [availableNav, location.pathname, navigate]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
  const todayTasks = tasks.filter((task) => ["emergency", "in-progress", "to-do", "completed"].includes(task.status));
  const weeklyTasks = tasks.filter((task) => task.week === "This week" || task.week === "Week 17");
  const completionRate = Math.round((tasks.filter((task) => task.status === "completed").length / tasks.length) * 100);

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "completed" ? "to-do" : "completed",
              progress: task.status === "completed" ? 42 : 100,
            }
          : task,
      ),
    );
  };

  const pullToToday = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, week: "This week", status: "in-progress" } : task)),
    );
    setSelectedTaskId(taskId);
    navigate("/today");
  };

  const createTasks = (drafts: TaskDraft[]) => {
    const createdAt = Date.now();
    const nextTasks: AppTask[] = drafts
      .filter((draft) => draft.title.trim())
      .map((draft, index) => ({
        id: `TSK-${String(createdAt + index).slice(-6)}`,
        title: draft.title.trim(),
        project: "Tasks",
        owner: draft.assignee || "Myself",
        ownerInitials: getOwnerInitials(draft.assignee || "Myself"),
        due: formatTaskDueDate(draft.dueDate),
        week: "This week",
        status: "to-do",
        priority: draft.priority,
        progress: 0,
        tags: [getTaskFieldLabel(draft.field, draft.customField), draft.fixed ? "Fixed" : "Unfixed"],
      }));

    if (nextTasks.length === 0) return;

    setTasks((current) => [...nextTasks, ...current]);
    setSelectedTaskId(nextTasks[0].id);
    setAddTaskOpen(false);
    navigate("/today");
  };

  const page = {
    home: (
      <HomePage
        users={users}
        tasks={tasks}
        todayTasks={todayTasks}
        weeklyTasks={weeklyTasks}
        role={role}
      />
    ),
    today: (
      <TodayPage
        tasks={todayTasks}
        selectedTask={selectedTask}
        onSelectTask={setSelectedTaskId}
        onToggleTask={toggleTaskCompletion}
        onPullOpen={() => setPullOpen(true)}
        onAddTask={() => setAddTaskOpen(true)}
      />
    ),
    weekly: (
      <WeeklyPage
        tasks={weeklyTasks}
        selectedTaskId={selectedTaskId}
        onSelectTask={setSelectedTaskId}
        onPullToToday={pullToToday}
        onOpenPull={() => setPullOpen(true)}
      />
    ),
    total: (
      <TotalTasksPage tasks={tasks} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} onOpenPull={() => setPullOpen(true)} />
    ),
    meetings: <MeetingsPage meetings={meetings} users={users} onAddMeeting={(m: Meeting) => setMeetings(prev => [m, ...prev])} />,
    approvals: <ApprovalsPage approvals={approvals} role={role} />,
    analytics: <AnalyticsPage role={role} />, 
    users: <UsersPage users={users} />, 
    settings: <SettingsPage role={role} notifications={notifications} />,
  }[currentPage];

  // If on a /member/:id path, show the member detail page instead
  const memberIdMatch = location.pathname.match(/^\/member\/(.+)$/);
  const activePage = memberIdMatch
    ? <MemberDetailPage userId={memberIdMatch[1]} users={users} tasks={tasks} role={role} />
    : page;

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full bg-background text-foreground">
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={availableNav} onNavigate={navigate} />
        <PullFromTotalDialog open={pullOpen} onOpenChange={setPullOpen} tasks={tasks.filter((task) => task.week !== "This week")} onPull={pullToToday} />
        <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} onCreateTasks={createTasks} />
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar role={role} setRole={setRole} notifications={notifications} />
          <SidebarInset className="bg-surface-strong">
            <div className="flex min-h-screen flex-col">
              <TopBar
                role={role}
                currentPage={currentPage}
                onCommandOpen={() => setCommandOpen(true)}
                onNotificationsOpen={() => setNotificationsOpen(true)}
                unreadNotifications={notifications.filter((item) => item.unread).length}
              />
              <main className="flex-1 overflow-hidden px-3 pb-3 md:px-4 md:pb-4">
                <section className="min-h-[calc(100vh-5.25rem)] rounded-md border border-border/70 bg-surface-panel shadow-sm">
                  <div className="h-full overflow-auto p-3 md:p-4">{activePage}</div>
                </section>
              </main>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({
  role,
  setRole,
  notifications,
}: {
  role: Role;
  setRole: (role: Role) => void;
  notifications: NotificationItem[];
}) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const availableNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border/80">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <SquareCheckBig className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">FlowDesk</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Workplace task manager</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/45">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {availableNav.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={location.pathname === item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-sidebar-foreground/78 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.badge ? (
                            <span className="ml-auto rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-[10px] font-semibold text-sidebar-primary">
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/45">
            Preview role
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid gap-2 px-2">
              {(Object.keys(roleLabels) as Role[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-2.5 py-2 text-left text-sm transition-colors",
                    role === value
                      ? "border-sidebar-primary/40 bg-sidebar-primary/15 text-sidebar-primary"
                      : "border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground/75 hover:bg-sidebar-accent",
                  )}
                >
                  {!collapsed ? <span>{roleLabels[value]}</span> : <span>{roleLabels[value].charAt(0)}</span>}
                  {!collapsed && role === value ? <CheckCircle2 className="h-4 w-4" /> : null}
                </button>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-2.5 py-2 text-xs text-sidebar-foreground/70">
            <Bell className="h-4 w-4" />
            {!collapsed && <span>{notifications.filter((item) => item.unread).length} unread notifications</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
              MC
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Maya Chen</p>
                <p className="truncate text-xs text-sidebar-foreground/55">Operations lead</p>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function TopBar({
  role,
  currentPage,
  onCommandOpen,
  onNotificationsOpen,
  unreadNotifications,
}: {
  role: Role;
  currentPage: PageKey;
  onCommandOpen: () => void;
  onNotificationsOpen: () => void;
  unreadNotifications: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border/70 bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:px-4">
      <SidebarTrigger className="h-9 w-9 rounded-md border border-border/70 bg-card" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{roleLabels[role]} workspace</p>
        <h1 className="truncate text-lg font-semibold text-foreground">{pageCopy[currentPage].title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2 bg-card" onClick={onCommandOpen}>
          <Command className="h-3.5 w-3.5" />
          Search
          <span className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</span>
        </Button>
        <Button variant="outline" size="icon" className="relative bg-card" onClick={onNotificationsOpen}>
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-metric-red" /> : null}
          <span className="sr-only">Open notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-card">
              {roleLabels[role]}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Frontend mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">Backend-connected later</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Role-aware preview shell</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  items,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavItem[];
  onNavigate: (path: string) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to pages, actions, and future integrations…" />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map((item) => (
            <CommandItem
              key={item.key}
              onSelect={() => {
                onNavigate(item.path);
                onOpenChange(false);
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem>
            <Plus className="mr-2 h-4 w-4" />
            Create task
            <CommandShortcut>Demo</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Sparkles className="mr-2 h-4 w-4" />
            Review AI-drafted minutes
            <CommandShortcut>AI</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function RightRail({
  task,
  meeting,
  notifications,
  isOpen,
  onClose,
}: {
  task?: AppTask;
  meeting?: Meeting;
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <aside className={cn("hidden min-h-[calc(100vh-5.25rem)] overflow-hidden rounded-md border border-border/70 bg-card shadow-sm xl:flex xl:flex-col", isOpen ? "xl:flex" : "xl:flex") }>
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inspector</p>
          <h2 className="text-sm font-semibold">Context rail</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          {isOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {task ? (
            <Card className="rounded-md border-border/70 shadow-none">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Task detail</CardTitle>
                  <Badge className={priorityTone[task.priority]}>{task.priority}</Badge>
                </div>
                <CardDescription>{task.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-muted-foreground">{task.project}</p>
                </div>
                <Progress value={task.progress} className="h-2 bg-secondary" />
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-md bg-surface-soft p-2">
                    <p className="uppercase tracking-[0.16em]">Owner</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{task.owner}</p>
                  </div>
                  <div className="rounded-md bg-surface-soft p-2">
                    <p className="uppercase tracking-[0.16em]">Due</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{task.due}</p>
                  </div>
                </div>
                {task.blockedReason ? <div className="rounded-md bg-metric-amber-soft p-3 text-metric-amber">{task.blockedReason}</div> : null}
              </CardContent>
            </Card>
          ) : null}
          {meeting ? (
            <Card className="rounded-md border-border/70 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Meeting focus</CardTitle>
                <CardDescription>{meeting.time}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-muted-foreground">{meeting.project}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.map((attendee) => (
                    <Badge key={attendee} variant="outline" className="rounded-full border-border/70 px-2 py-1 text-xs">
                      {attendee}
                    </Badge>
                  ))}
                </div>
                <div className="rounded-md bg-surface-soft p-3 text-sm text-muted-foreground">{meeting.summary}</div>
              </CardContent>
            </Card>
          ) : null}
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Demo-ready alert stream</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-md border border-border/70 bg-surface-soft p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 h-2.5 w-2.5 rounded-full", notification.unread ? "bg-metric-red" : "bg-border")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{notification.detail}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{notification.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}

function PageIntro({ pageKey, actions }: { pageKey: PageKey; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">FlowDesk workspace</p>
        <h2 className="text-2xl font-semibold text-foreground">{pageCopy[pageKey].title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{pageCopy[pageKey].subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function MetricsRow({ items }: { items: Array<{ label: string; value: string; tone: keyof typeof metricTone; helper: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
              </div>
              <span className={cn("rounded-md border px-2 py-1 text-xs font-medium", metricTone[item.tone])}>{item.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskCard({
  task,
  selected,
  onSelect,
  onToggleTask,
  action,
}: {
  task: AppTask;
  selected?: boolean;
  onSelect?: () => void;
  onToggleTask?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "w-full rounded-md border bg-card p-3 text-left shadow-none transition-colors hover:border-primary/35 hover:bg-surface-soft",
        selected ? "border-primary/45 bg-surface-soft" : "border-border/70",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleTask?.();
          }}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
            task.status === "completed" ? "border-metric-green bg-metric-green text-background" : "border-border bg-background text-transparent",
          )}
          aria-label="Toggle task completion"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{task.title}</p>
            {task.emergency ? <Badge className={statusTone.emergency}>Emergency</Badge> : null}
            {task.requiresReview ? <Badge className="bg-accent text-accent-foreground border-transparent">Review</Badge> : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{task.id}</span>
            <span>•</span>
            <span>{task.project}</span>
            <span>•</span>
            <span>{task.due}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={statusTone[task.status]}>{task.status.replace("-", " ")}</Badge>
            <Badge className={priorityTone[task.priority]}>{task.priority}</Badge>
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full border-border/70 bg-background px-2 py-1 text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-[11px] font-semibold text-foreground">
            {task.ownerInitials}
          </div>
          {action}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={task.progress} className="h-1.5 bg-secondary" />
        <span className="text-xs text-muted-foreground">{task.progress}%</span>
      </div>
    </div>
  );
}

function SectionBlock({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border/70 bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

/* ───────────── Home Page ───────────── */

const statusDot: Record<UserRecord["status"], string> = {
  online: "bg-metric-green",
  away: "bg-metric-amber",
  review: "bg-metric-blue",
};

function HomePage({
  users,
  tasks,
  todayTasks,
  weeklyTasks,
  role,
}: {
  users: UserRecord[];
  tasks: AppTask[];
  todayTasks: AppTask[];
  weeklyTasks: AppTask[];
  role: Role;
}) {
  const navigate = useNavigate();
  const canViewDetails = role === "manager" || role === "admin";

  const todayCompleted = todayTasks.filter((t) => t.status === "completed").length;
  const todayEmergency = todayTasks.filter((t) => t.status === "emergency").length;
  const weeklyHighPriority = weeklyTasks.filter((t) => t.priority === "high").length;

  const surfaceCards = [
    {
      key: "today" as const,
      path: "/today",
      icon: LayoutGrid,
      title: "Today's Tasks",
      subtitle: `${todayTasks.length} tasks · ${todayCompleted} completed${todayEmergency > 0 ? ` · ${todayEmergency} emergency` : ""}`,
      tone: "bg-metric-blue-soft text-metric-blue",
      stat: `${todayTasks.length}`,
    },
    {
      key: "weekly" as const,
      path: "/weekly",
      icon: CalendarClock,
      title: "Weekly Tasks",
      subtitle: `${weeklyTasks.length} tasks · ${weeklyHighPriority} high priority`,
      tone: "bg-metric-amber-soft text-metric-amber",
      stat: `${weeklyTasks.length}`,
    },
    {
      key: "total" as const,
      path: "/total",
      icon: Inbox,
      title: "Total Tasks",
      subtitle: `${tasks.length} tasks across all projects and weeks`,
      tone: "bg-metric-emerald-soft text-metric-emerald",
      stat: `${tasks.length}`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageIntro pageKey="home" />

      {/* Team members card */}
      <Card className="rounded-md border-border/70 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Team Members</CardTitle>
          </div>
          <CardDescription>
            {canViewDetails
              ? "Click on a member to view their projects and tasks."
              : "Hover on a member to see their details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-1">
            {users.map((user, i) => {
              const initials = user.name
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <Tooltip key={user.id} delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        if (canViewDetails) navigate(`/member/${user.id}`);
                      }}
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-card text-sm font-semibold transition-all duration-200",
                        "hover:z-10 hover:scale-110 hover:shadow-lg",
                        canViewDetails ? "cursor-pointer" : "cursor-default",
                        i > 0 ? "-ml-3" : "",
                        user.status === "online"
                          ? "bg-primary/15 text-primary"
                          : user.status === "review"
                            ? "bg-metric-blue-soft text-metric-blue"
                            : "bg-surface-soft text-muted-foreground",
                      )}
                    >
                      {initials}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                          statusDot[user.status],
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="rounded-lg border border-border/70 bg-card p-3 shadow-xl"
                  >
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge className={cn("text-[10px]", statusTone[user.status === "online" ? "completed" : user.status === "review" ? "in-progress" : "to-do"])}>
                          {user.status}
                        </Badge>
                        <span>·</span>
                        <span>{roleLabels[user.role]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.team} · {user.utilization}% utilization</p>
                      {canViewDetails && (
                        <p className="mt-1 text-[11px] font-medium text-primary">Click to view details →</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          {/* Expanded row with names for context */}
          <div className="mt-4 flex flex-wrap gap-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 rounded-full border border-border/70 bg-surface-soft px-3 py-1.5"
              >
                <span className={cn("h-2 w-2 rounded-full", statusDot[user.status])} />
                <span className="text-xs font-medium text-foreground">{user.name}</span>
                <span className="text-[10px] text-muted-foreground">{user.team}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task surfaces */}
      <div className="grid gap-3 md:grid-cols-3">
        {surfaceCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => navigate(card.path)}
            className="group rounded-md border border-border/70 bg-card p-5 text-left shadow-none transition-all duration-200 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.tone)}>
                <card.icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-bold text-foreground">{card.stat}</span>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {card.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View page <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Member Detail Page ───────────── */

function MemberDetailPage({
  userId,
  users,
  tasks,
  role,
}: {
  userId: string;
  users: UserRecord[];
  tasks: AppTask[];
  role: Role;
}) {
  const navigate = useNavigate();
  const user = users.find((u) => u.id === userId);

  // If not manager/admin, redirect home
  useEffect(() => {
    if (role === "employee") {
      navigate("/", { replace: true });
    }
  }, [role, navigate]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Member not found.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  // Assign tasks to users based on owner name matching
  const userTasks = tasks.filter((t) => t.owner === user.name);
  const projects = [...new Set(userTasks.map((t) => t.project))];
  const completedTasks = userTasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = userTasks.filter((t) => t.status === "in-progress").length;
  const pendingTasks = userTasks.filter((t) => t.status !== "completed").length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="hover:text-foreground transition-colors"
        >
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{user.name}</span>
      </div>

      {/* Member header */}
      <Card className="rounded-md border-border/70 shadow-none overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                {initials}
              </div>
              <span className={cn("absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card", statusDot[user.status])} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
                <Badge className={cn("text-[11px]", statusTone[user.status === "online" ? "completed" : user.status === "review" ? "in-progress" : "to-do"])}>
                  {user.status}
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/70 px-2 py-1 text-[11px]">
                  {roleLabels[user.role]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.team} team</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Utilization</span>
                <Progress value={user.utilization} className="h-2 w-32 bg-secondary" />
                <span className="text-xs font-medium text-foreground">{user.utilization}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total tasks", value: `${userTasks.length}`, tone: "blue" as const, helper: "All assigned tasks." },
          { label: "In progress", value: `${inProgressTasks}`, tone: "amber" as const, helper: "Currently active work." },
          { label: "Completed", value: `${completedTasks}`, tone: "green" as const, helper: "Finished tasks." },
          { label: "Projects", value: `${projects.length}`, tone: "emerald" as const, helper: "Active project assignments." },
        ].map((item) => (
          <Card key={item.label} className="rounded-md border-border/70 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
                </div>
                <span className={cn("rounded-md border px-2 py-1 text-xs font-medium", metricTone[item.tone])}>{item.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Projects</CardTitle>
            <CardDescription>Projects {user.name} is currently assigned to.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => {
                const count = userTasks.filter((t) => t.project === project).length;
                return (
                  <div
                    key={project}
                    className="flex items-center gap-2 rounded-full border border-border/70 bg-surface-soft px-4 py-2"
                  >
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{project}</span>
                    <Badge variant="outline" className="rounded-full border-border/70 px-1.5 py-0.5 text-[10px]">
                      {count} {count === 1 ? "task" : "tasks"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks list */}
      <Card className="rounded-md border-border/70 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assigned Tasks</CardTitle>
          <CardDescription>All tasks assigned to {user.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {userTasks.length > 0 ? (
            <div className="space-y-3">
              {userTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-md border border-border/70 bg-surface-soft p-4 transition-colors hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        {task.emergency && <Badge className={statusTone.emergency}>Emergency</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{task.id}</span>
                        <span>·</span>
                        <span>{task.project}</span>
                        <span>·</span>
                        <span>Due {task.due}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusTone[task.status]}>{task.status.replace("-", " ")}</Badge>
                        <Badge className={priorityTone[task.priority]}>{task.priority}</Badge>
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full border-border/70 bg-background px-2 py-1 text-[11px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">{task.progress}%</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={task.progress} className="h-1.5 bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/70 bg-surface-soft p-8 text-center text-sm text-muted-foreground">
              No tasks currently assigned to {user.name}.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TodayPage({
  tasks,
  selectedTask,
  onSelectTask,
  onToggleTask,
  onPullOpen,
  onAddTask,
}: {
  tasks: AppTask[];
  selectedTask?: AppTask;
  onSelectTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onPullOpen: () => void;
  onAddTask: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

  const sortedTasks = useMemo(() => {
    const order: Record<TaskStatus, number> = { emergency: 0, "in-progress": 1, "to-do": 2, blocked: 3, completed: 4 };
    return [...tasks].sort((a, b) => order[a.status] - order[b.status]);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "completed") return sortedTasks.filter((t) => t.status === "completed");
    if (statusFilter === "pending") return sortedTasks.filter((t) => t.status !== "completed");
    return sortedTasks;
  }, [sortedTasks, statusFilter]);

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-4">
      <PageIntro
        pageKey="today"
        actions={
          <>
            <Button variant="outline" className="gap-2 bg-card" onClick={onPullOpen}>
              <ArrowRightLeft className="h-4 w-4" />
              Pull from Weekly
            </Button>
            <Button className="gap-2" onClick={onAddTask}>
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          </>
        }
      />
      <MetricsRow
        items={[
          { label: "Completed", value: `${completedCount}`, tone: "green", helper: "Ready for review and reporting." },
          { label: "In progress", value: `${tasks.filter((task) => task.status === "in-progress").length}`, tone: "blue", helper: "Live work currently assigned today." },
          { label: "Emergency", value: `${tasks.filter((task) => task.status === "emergency").length}`, tone: "red", helper: "Escalated items visible at the top." },
          { label: "Review", value: `${tasks.filter((task) => task.requiresReview).length}`, tone: "amber", helper: "Need manager or admin confirmation." },
        ]}
      />
      {/* Status filter chips */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            statusFilter === "all"
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border/70 bg-card text-muted-foreground hover:bg-surface-soft hover:text-foreground",
          )}
        >
          All ({tasks.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            statusFilter === "pending"
              ? "border-metric-amber bg-metric-amber-soft text-metric-amber shadow-sm"
              : "border-border/70 bg-card text-muted-foreground hover:bg-surface-soft hover:text-foreground",
          )}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            statusFilter === "completed"
              ? "border-metric-green bg-metric-green-soft text-metric-green shadow-sm"
              : "border-border/70 bg-card text-muted-foreground hover:bg-surface-soft hover:text-foreground",
          )}
        >
          Completed ({completedCount})
        </button>
      </div>
      {/* Unified task list */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            selected={selectedTask?.id === task.id}
            onSelect={() => onSelectTask(task.id)}
            onToggleTask={() => onToggleTask(task.id)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="rounded-md border border-dashed border-border/70 bg-surface-soft p-8 text-center text-sm text-muted-foreground">
            No tasks match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklyPage({
  tasks,
  selectedTaskId,
  onSelectTask,
  onPullToToday,
  onOpenPull,
}: {
  tasks: AppTask[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onPullToToday: (taskId: string) => void;
  onOpenPull: () => void;
}) {
  const carried = tasks.filter((task) => task.week === "Week 17");
  const current = tasks.filter((task) => task.week === "This week");
  return (
    <div className="space-y-4">
      <PageIntro
        pageKey="weekly"
        actions={
          <>
            <Button variant="outline" className="gap-2 bg-card" onClick={onOpenPull}>
              <Plus className="h-4 w-4" />
              Pull from Total
            </Button>
            <Button variant="outline" className="gap-2 bg-card">
              <Filter className="h-4 w-4" />
              Priority editor
            </Button>
          </>
        }
      />
      <MetricsRow
        items={[
          { label: "This week", value: `${current.length}`, tone: "blue", helper: "Tasks assigned inside the current frame." },
          { label: "Carried over", value: `${carried.length}`, tone: "amber", helper: "Visible from previous weekly plans." },
          { label: "High priority", value: `${tasks.filter((task) => task.priority === "high").length}`, tone: "red", helper: "Need attention during planning." },
          { label: "Ready today", value: `${current.filter((task) => task.progress > 40).length}`, tone: "emerald", helper: "Good candidates for today’s queue." },
        ]}
      />
      <Card className="rounded-md border-border/70 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Week progress</CardTitle>
          <CardDescription>Keep the current week visible while showing carried-over work just below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacity used</span>
            <span className="font-medium text-foreground">68%</span>
          </div>
          <Progress value={68} className="h-2 bg-secondary" />
        </CardContent>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        <SectionBlock title="This Week" helper="Primary planning lane for current commitments.">
          {current.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selected={selectedTaskId === task.id}
              onSelect={() => onSelectTask(task.id)}
              action={
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onPullToToday(task.id)}>
                  Pull to Today
                </Button>
              }
            />
          ))}
        </SectionBlock>
        <SectionBlock title="Carried Over" helper="Work still relevant from the prior weekly frame.">
          {carried.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selected={selectedTaskId === task.id}
              onSelect={() => onSelectTask(task.id)}
              action={
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onPullToToday(task.id)}>
                  Pull to Today
                </Button>
              }
            />
          ))}
        </SectionBlock>
      </div>
    </div>
  );
}

function TotalTasksPage({
  tasks,
  selectedTaskId,
  onSelectTask,
  onOpenPull,
}: {
  tasks: AppTask[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onOpenPull: () => void;
}) {
  const grouped = tasks.reduce<Record<string, AppTask[]>>((acc, task) => {
    acc[task.week] ??= [];
    acc[task.week].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <PageIntro
        pageKey="total"
        actions={
          <>
            <Button variant="outline" className="gap-2 bg-card">
              <ListFilter className="h-4 w-4" />
              Week view
            </Button>
            <Button variant="outline" className="gap-2 bg-card" onClick={onOpenPull}>
              <ArrowRightLeft className="h-4 w-4" />
              Pull task
            </Button>
          </>
        }
      />
      {/* Filter bar - horizontal, on top of the week cards */}
      <div className="rounded-md border border-border/70 bg-card p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
          </div>
          <div className="h-5 w-px bg-border/70" />
          {[
            "Search task IDs or owners",
            "Project",
            "Week",
            "Overdue",
          ].map((item) => (
            <div
              key={item}
              className="rounded-full border border-dashed border-border/70 bg-surface-soft px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/35 hover:bg-surface-soft hover:text-foreground cursor-pointer"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      {/* Week-grouped backlog */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([week, items]) => (
          <SectionBlock key={week} title={week} helper="Default grouped backlog view with future backend filter slots.">
            {items.map((task) => (
              <TaskCard key={task.id} task={task} selected={selectedTaskId === task.id} onSelect={() => onSelectTask(task.id)} />
            ))}
          </SectionBlock>
        ))}
      </div>
    </div>
  );
}

function MeetingsPage({
  meetings,
  users,
  onAddMeeting,
}: {
  meetings: Meeting[];
  users: UserRecord[];
  onAddMeeting: (meeting: Meeting) => void;
}) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [freqFilter, setFreqFilter] = useState<"all" | "daily" | "weekly" | "monthly">("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const dailyCount = meetings.filter((m) => m.recurrence?.frequency === "daily").length;
  const weeklyCount = meetings.filter((m) => m.recurrence?.frequency === "weekly").length;
  const monthlyCount = meetings.filter((m) => m.recurrence?.frequency === "monthly").length;

  const filtered = freqFilter === "all"
    ? meetings
    : meetings.filter((m) => m.recurrence?.frequency === freqFilter);

  const freqTabs = [
    { key: "all" as const, label: "All", icon: Calendar, count: meetings.length },
    { key: "daily" as const, label: "Daily", icon: Clock3, count: dailyCount },
    { key: "weekly" as const, label: "Weekly", icon: Calendar, count: weeklyCount },
    { key: "monthly" as const, label: "Monthly", icon: LayoutGrid, count: monthlyCount },
  ];

  return (
    <div className="space-y-5">
      <ScheduleMeetingDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        users={users}
        onSubmit={onAddMeeting}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Meetings &amp; MOM</h2>
          <p className="text-sm text-muted-foreground">Manage review meetings and track action items</p>
        </div>
        <div className="flex items-center gap-3">
          {/* List / Calendar toggle */}
          <div className="flex items-center rounded-lg border border-border/70 bg-card p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "calendar"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
          </div>
          {/* Schedule Meeting */}
          <Button className="gap-2" onClick={() => setScheduleOpen(true)}>
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Frequency filter tabs */}
      <div className="flex items-center gap-1 border-b border-border/70 pb-px">
        {freqTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFreqFilter(tab.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              freqFilter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span
              className={cn(
                "ml-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                freqFilter === tab.key
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-soft text-muted-foreground",
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Meeting cards or Calendar View */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {filtered.map((meeting) => (
            <div
              key={meeting.id}
              className="group flex items-center gap-4 rounded-lg border border-border/70 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer"
            >
              {/* Calendar icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-metric-green-soft text-metric-green">
                <Calendar className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{meeting.title}</p>
                  <Badge className={statusTone[meeting.status]}>{meeting.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {meeting.time} • {meeting.duration} min
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {meeting.attendees.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {meeting.actions.length} actions
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 bg-surface-soft p-10 text-center">
              <Calendar className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No meetings match the selected filter.</p>
            </div>
          )}
        </div>
      ) : (
        <MeetingsCalendarView meetings={filtered} />
      )}
    </div>
  );
}

/* ───── Meetings Calendar View ───── */

function MeetingsCalendarView({ meetings }: { meetings: Meeting[] }) {
  // Default to the current month so newly scheduled meetings are visible immediately
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const calendarMeetings = useMemo(() => {
    const instances: Meeting[] = [];
    meetings.forEach((m) => {
      if (!m.dateTime) return;
      const baseDate = new Date(m.dateTime);
      if (isNaN(baseDate.getTime())) return;

      if (m.recurrence) {
        const { frequency, interval, count } = m.recurrence;
        // Generate 'count' instances
        for (let i = 0; i < count; i++) {
          let instanceDate = baseDate;
          if (frequency === "daily") {
            instanceDate = addDays(baseDate, i * interval);
          } else if (frequency === "weekly") {
            instanceDate = addWeeks(baseDate, i * interval);
          } else if (frequency === "monthly") {
            instanceDate = addMonths(baseDate, i * interval);
          }
          instances.push({
            ...m,
            id: `${m.id}-inst-${i}`, // Ensure unique ID for React rendering
            dateTime: instanceDate.toISOString(),
          });
        }
      } else {
        // Not recurring, just push once
        instances.push(m);
      }
    });
    return instances;
  }, [meetings]);

  const getEventColor = (meeting: Meeting) => {
    switch (meeting.recurrence?.frequency) {
      case "daily":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30";
      case "weekly":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30";
      case "monthly":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30";
    }
  };

  const getLegendColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-blue-200 dark:bg-blue-500/40";
      case "weekly":
        return "bg-green-200 dark:bg-green-500/40";
      case "monthly":
        return "bg-purple-200 dark:bg-purple-500/40";
      default:
        return "bg-slate-200 dark:bg-slate-500/40";
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="rounded-lg border border-border/70 bg-card p-4 flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-2">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-surface-soft">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-bold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-surface-soft">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Grid */}
      <div className="border border-border/70 rounded-md overflow-hidden bg-surface-soft">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border/70 bg-card">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {days.map((day, i) => {
            const dayMeetings = calendarMeetings.filter(
              (m) => m.dateTime && isSameDay(new Date(m.dateTime), day)
            );
            
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-r border-b border-border/70 p-1.5 flex flex-col gap-1 bg-card transition-colors hover:bg-surface-soft/40",
                  !isCurrentMonth && "bg-surface-soft/50 text-muted-foreground/50",
                  i % 7 === 6 && "border-r-0", // Remove right border for last column
                  i >= days.length - 7 && "border-b-0" // Remove bottom border for last row
                )}
              >
                <span className={cn(
                  "text-xs font-medium p-1 select-none",
                  !isCurrentMonth ? "text-muted-foreground/50" : "text-muted-foreground"
                )}>
                  {format(day, "d")}
                </span>
                
                <div className="flex flex-col gap-1 overflow-y-auto hide-scrollbar">
                  {dayMeetings.slice(0, 3).map((meeting) => (
                    <div
                      key={meeting.id}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium truncate border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                        getEventColor(meeting)
                      )}
                    >
                      {meeting.recurrence?.frequency === "daily" && <Clock3 className="h-3 w-3 shrink-0 opacity-70" />}
                      {meeting.recurrence?.frequency === "weekly" && <Calendar className="h-3 w-3 shrink-0 opacity-70" />}
                      {meeting.recurrence?.frequency === "monthly" && <LayoutGrid className="h-3 w-3 shrink-0 opacity-70" />}
                      {!meeting.recurrence?.frequency && <CalendarClock className="h-3 w-3 shrink-0 opacity-70" />}
                      <span className="truncate">{meeting.title}</span>
                    </div>
                  ))}
                  {dayMeetings.length > 3 && (
                    <div className="rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 text-center mt-0.5 cursor-pointer hover:opacity-80 transition-opacity">
                      +{dayMeetings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 pb-1">
        <div className="flex items-center gap-2">
          <div className={cn("h-3.5 w-3.5 rounded-sm", getLegendColor("daily"))} />
          <span className="text-xs font-medium text-muted-foreground">Daily</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-3.5 w-3.5 rounded-sm", getLegendColor("weekly"))} />
          <span className="text-xs font-medium text-muted-foreground">Weekly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-3.5 w-3.5 rounded-sm", getLegendColor("monthly"))} />
          <span className="text-xs font-medium text-muted-foreground">Monthly</span>
        </div>
      </div>
    </div>
  );
}

/* ───── Schedule Meeting Dialog ───── */

function ScheduleMeetingDialog({
  open,
  onOpenChange,
  users,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserRecord[];
  onSubmit: (meeting: Meeting) => void;
}) {
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [duration, setDuration] = useState("30");
  const [dateTime, setDateTime] = useState("");
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("weekly");
  const [interval, setInterval] = useState("1");
  const [count, setCount] = useState("10");

  const resetForm = () => {
    setTitle("");
    setAgenda("");
    setDuration("30");
    setDateTime("");
    setAttendeeInput("");
    setAttendees([]);
    setIsRecurring(false);
    setFrequency("weekly");
    setInterval("1");
    setCount("10");
  };

  // Filter user suggestions based on input
  const suggestions = attendeeInput.length > 0
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(attendeeInput.toLowerCase()) &&
          !attendees.includes(u.name),
      )
    : [];

  const addAttendee = (name: string) => {
    if (!attendees.includes(name)) {
      setAttendees((prev) => [...prev, name]);
    }
    setAttendeeInput("");
  };

  const removeAttendee = (name: string) => {
    setAttendees((prev) => prev.filter((a) => a !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && attendeeInput.trim()) {
      e.preventDefault();
      // If there are suggestions, pick the first one; otherwise add as-is
      if (suggestions.length > 0) {
        addAttendee(suggestions[0].name);
      } else if (attendeeInput.trim()) {
        addAttendee(attendeeInput.trim());
      }
    }
    if (e.key === "Backspace" && attendeeInput === "" && attendees.length > 0) {
      removeAttendee(attendees[attendees.length - 1]);
    }
  };

  // Build recurrence summary text
  const recurrenceSummary = useMemo(() => {
    if (!isRecurring) return "";
    const intervalNum = parseInt(interval) || 1;
    const countNum = parseInt(count) || 0;
    const freqLabel =
      frequency === "daily" ? (intervalNum === 1 ? "day" : "days") :
      frequency === "weekly" ? (intervalNum === 1 ? "week" : "weeks") :
      intervalNum === 1 ? "month" : "months";

    let text = intervalNum === 1
      ? `Every ${frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"}`
      : `Every ${intervalNum} ${freqLabel}`;

    if (countNum > 0) {
      text += `, ${countNum} ${countNum === 1 ? "time" : "times"}`;
    }
    return text;
  }, [isRecurring, frequency, interval, count]);

  const handleSubmit = () => {
    let dtStr = "TBD";
    let finalDateTime = dateTime;
    
    // Ensure we have a valid date string
    if (dateTime) {
      const parsed = new Date(dateTime);
      if (!isNaN(parsed.getTime())) {
        dtStr = parsed.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // Fallback if browser passed an invalid string
        finalDateTime = new Date().toISOString();
        dtStr = "Invalid Date - Defaulting to Today";
      }
    } else {
      // Fallback if somehow submitted without date
      finalDateTime = new Date().toISOString();
    }

    const newMeeting: Meeting = {
      id: `MOM-${Date.now().toString(36)}`,
      title: title || "Untitled Meeting",
      project: "General",
      time: dtStr,
      dateTime: finalDateTime,
      duration: parseInt(duration) || 30,
      attendees,
      status: "scheduled",
      summary: agenda || "No agenda provided.",
      actions: [],
      aiConfidence: 0,
      ...(isRecurring
        ? {
            recurrence: {
              frequency,
              interval: parseInt(interval) || 1,
              count: parseInt(count) || 1,
            },
          }
        : {}),
    };
    onSubmit(newMeeting);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg rounded-lg border-border/70 bg-card p-0 overflow-hidden">
        <div className="border-b border-border/70 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Schedule Meeting</DialogTitle>
            <DialogDescription>Create a new meeting and invite attendees.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="meeting-title" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Title
            </Label>
            <Input
              id="meeting-title"
              placeholder="e.g. Weekly standup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <Label htmlFor="meeting-agenda" className="text-sm font-medium flex items-center gap-2">
              <AlignLeft className="h-4 w-4 text-muted-foreground" />
              Agenda
            </Label>
            <Textarea
              id="meeting-agenda"
              placeholder="What will be discussed?"
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Duration + Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-duration" className="text-sm font-medium flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                Duration (min)
              </Label>
              <Input
                id="meeting-duration"
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-datetime" className="text-sm font-medium flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Date &amp; Time
              </Label>
              <Input
                id="meeting-datetime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Attendees
            </Label>
            <div className="rounded-md border border-input bg-background p-2">
              {/* Chips */}
              {attendees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {attendees.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeAttendee(name)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                        aria-label={`Remove ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Input */}
              <input
                type="text"
                placeholder="Type a name…"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="rounded-md border border-border/70 bg-card shadow-lg overflow-hidden">
                {suggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addAttendee(user.name)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-soft"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.team}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recurring toggle */}
          <div className="rounded-lg border border-border/70 bg-surface-soft p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="recurring-toggle" className="text-sm font-medium cursor-pointer">
                  Recurring meeting
                </Label>
              </div>
              <Switch
                id="recurring-toggle"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Frequency</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Interval</Label>
                    <Input
                      type="number"
                      min={1}
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Occurrences</Label>
                    <Input
                      type="number"
                      min={1}
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                {/* Dynamic recurrence summary */}
                <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/15 px-3 py-2">
                  <Repeat className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-medium text-primary">{recurrenceSummary}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/70 px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !dateTime}>
            Schedule Meeting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalsPage({ approvals, role }: { approvals: ApprovalItem[]; role: Role }) {
  return (
    <div className="space-y-4">
      <PageIntro
        pageKey="approvals"
        actions={
          <Badge variant="outline" className="rounded-full border-border/70 bg-card px-3 py-1 text-xs">
            Visible to {roleLabels[role]}
          </Badge>
        }
      />
      <MetricsRow
        items={[
          { label: "Open approvals", value: `${approvals.length}`, tone: "red", helper: "All waiting items across task and M.O.M review." },
          { label: "Task reviews", value: `${approvals.filter((item) => item.type === "task").length}`, tone: "blue", helper: "Completion confirmations pending." },
          { label: "M.O.M reviews", value: `${approvals.filter((item) => item.type === "mom").length}`, tone: "emerald", helper: "Minutes and AI task extraction checks." },
          { label: "Queries", value: `${approvals.filter((item) => item.type === "query").length}`, tone: "amber", helper: "Date revisions and clarifications." },
        ]}
      />
      <div className="space-y-3">
        {approvals.map((item) => (
          <Card key={item.id} className="rounded-md border-border/70 shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <Badge className={statusTone[item.type]}>{item.type}</Badge>
                  <Badge className={priorityTone[item.priority]}>{item.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.context}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.owner} · {item.age}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="bg-card">Request context</Button>
                <Button size="sm">Approve</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage({ role }: { role: Role }) {
  return (
    <div className="space-y-4">
      <PageIntro
        pageKey="analytics"
        actions={<Badge className="bg-accent text-accent-foreground border-transparent">{roleLabels[role]} view</Badge>}
      />
      <MetricsRow
        items={[
          { label: "Completion rate", value: "82%", tone: "green", helper: "Trailing seven-day completion health." },
          { label: "Blocked time", value: "6.2h", tone: "amber", helper: "Time waiting on dependencies this week." },
          { label: "Workload risk", value: "3 teams", tone: "red", helper: "Teams trending above 85% utilization." },
          { label: "Throughput", value: "104", tone: "blue", helper: "Tasks resolved in the current reporting window." },
        ]}
      />
      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Focus vs blocked time</CardTitle>
            <CardDescription>Area view of deep work, blocked hours, and completions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsWorkload}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Area type="monotone" dataKey="focus" stackId="1" stroke="hsl(var(--metric-blue))" fill="hsl(var(--metric-blue-soft))" />
                <Area type="monotone" dataKey="blocked" stackId="1" stroke="hsl(var(--metric-amber))" fill="hsl(var(--metric-amber-soft))" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Completed tasks by team</CardTitle>
            <CardDescription>High-density overview for manager/admin staffing decisions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsCompletion}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersPage({ users }: { users: UserRecord[] }) {
  return (
    <div className="space-y-4">
      <PageIntro
        pageKey="users"
        actions={
          <>
            <Button variant="outline" className="gap-2 bg-card">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite user
            </Button>
          </>
        }
      />
      <Card className="rounded-md border-border/70 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team directory</CardTitle>
          <CardDescription>Demo admin controls with role-aware staffing indicators.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{roleLabels[user.role]}</TableCell>
                  <TableCell>{user.team}</TableCell>
                  <TableCell>{user.utilization}%</TableCell>
                  <TableCell>
                    <Badge className={user.status === "online" ? statusTone.review : user.status === "review" ? statusTone.query : "bg-secondary text-secondary-foreground border-transparent"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsPage({ role, notifications }: { role: Role; notifications: NotificationItem[] }) {
  const settingsCards = [
    {
      title: "Notification routing",
      description: "Prepare inbox, toast, email, and escalation rules once backend events are available.",
      icon: Bell,
    },
    {
      title: "Calendar sync",
      description: "Meeting scheduling and room availability are visually ready, but intentionally not connected yet.",
      icon: CalendarClock,
    },
    {
      title: "Permissions",
      description: `Current preview is using a ${roleLabels[role]} role switcher; future backend roles can slot into the same surfaces.`,
      icon: ShieldCheck,
    },
    {
      title: "AI operations",
      description: `There are ${notifications.length} live-looking demo signals supporting future draft and extraction flows.`,
      icon: WandSparkles,
    },
  ];

  return (
    <div className="space-y-4">
      <PageIntro pageKey="settings" />
      <div className="grid gap-3 md:grid-cols-2">
        {settingsCards.map((item) => (
          <Card key={item.title} className="rounded-md border-border/70 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-soft text-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PullFromTotalDialog({
  open,
  onOpenChange,
  tasks,
  onPull,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: AppTask[];
  onPull: (taskId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Pull from Total Tasks</DialogTitle>
          <DialogDescription>Select backlog items to move into the current weekly or daily view.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {tasks.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-surface-soft p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.project} · {task.week}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onPull(task.id);
                  onOpenChange(false);
                }}
              >
                Pull to Today
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({
  open,
  onOpenChange,
  onCreateTasks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTasks: (drafts: TaskDraft[]) => void;
}) {
  const [bulkMode, setBulkMode] = useState(false);
  const [singleDraft, setSingleDraft] = useState<TaskDraft>(() => createTaskDraft());
  const [bulkInput, setBulkInput] = useState("");
  const [bulkDrafts, setBulkDrafts] = useState<BulkTaskDraft[]>([]);

  useEffect(() => {
    if (!open) {
      setBulkMode(false);
      setSingleDraft(createTaskDraft());
      setBulkInput("");
      setBulkDrafts([]);
    }
  }, [open]);

  const handleBulkInputChange = (value: string) => {
    setBulkInput(value);
    setBulkDrafts((current) => syncBulkTaskDrafts(value, current, singleDraft));
  };

  const updateBulkDraft = (key: string, nextDraft: TaskDraft) => {
    setBulkDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...nextDraft, key: draft.key } : draft)),
    );
  };

  const handleSubmit = () => {
    const draftsToCreate = bulkMode
      ? bulkDrafts.map(({ key: _key, ...draft }) => draft).filter((draft) => draft.title.trim())
      : singleDraft.title.trim()
        ? [singleDraft]
        : [];

    if (draftsToCreate.length === 0) return;

    onCreateTasks(draftsToCreate);
  };

  const bulkCount = bulkDrafts.length;
  const canSubmit = bulkMode ? bulkCount > 0 : Boolean(singleDraft.title.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden rounded-[22px] border-border/70 bg-card p-0 shadow-2xl">
        <div className="border-b border-border/70 px-6 py-4">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <DialogTitle className="text-xl font-semibold">New Task</DialogTitle>
                </div>
                <DialogDescription>Create a single task or switch into bulk mode to draft several tasks at once.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(92vh-152px)] space-y-5 overflow-y-auto px-6 py-5">
          <Button
            type="button"
            variant={bulkMode ? "default" : "outline"}
            className="gap-2 rounded-xl"
            onClick={() => setBulkMode((current) => !current)}
          >
            <List className="h-4 w-4" />
            {bulkMode ? "Bulk Mode ON" : "Create Multiple"}
          </Button>

          {bulkMode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="bulk-task-input" className="text-sm font-medium text-foreground">
                    Enter one task per line
                  </Label>
                  <span className="text-sm text-muted-foreground">{bulkCount} {bulkCount === 1 ? "task" : "tasks"} detected</span>
                </div>
                <Textarea
                  id="bulk-task-input"
                  value={bulkInput}
                  onChange={(event) => handleBulkInputChange(event.target.value)}
                  placeholder={"help the customer\nprepare the report\nreview open blockers"}
                  className="min-h-[140px] resize-none rounded-2xl border-border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15"
                />
              </div>

              {bulkDrafts.length > 0 ? (
                <div className="rounded-2xl border border-border/70 bg-surface-soft/70 p-4">
                  <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Editable Preview</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Each generated task keeps its own fields, due date, assignee, and action items.
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-border/70 bg-card px-3 py-1 text-xs">
                      {bulkCount} {bulkCount === 1 ? "task" : "tasks"}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-4">
                    {bulkDrafts.map((draft, index) => (
                      <TaskDraftEditor
                        key={draft.key}
                        draft={draft}
                        index={index}
                        onChange={(nextDraft) => updateBulkDraft(draft.key, nextDraft)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <TaskDraftEditor draft={singleDraft} onChange={setSingleDraft} />
          )}
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDraftEditor({
  draft,
  onChange,
  index,
}: {
  draft: TaskDraft;
  onChange: (draft: TaskDraft) => void;
  index?: number;
}) {
  const [descriptionOpen, setDescriptionOpen] = useState(Boolean(draft.description));
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [actionItemsOpen, setActionItemsOpen] = useState(false);
  const inputClassName =
    "rounded-xl border-border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15";
  const triggerClassName =
    "rounded-xl border-border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:ring-2 focus:ring-primary/15";

  const updateActionItem = (itemIndex: number, nextItem: TaskActionItemDraft) => {
    onChange({
      ...draft,
      actionItems: draft.actionItems.map((item, currentIndex) => (currentIndex === itemIndex ? nextItem : item)),
    });
  };

  const addActionItem = () => {
    onChange({
      ...draft,
      actionItems: [...draft.actionItems, createActionItemDraft()],
    });
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      {typeof index === "number" ? (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="rounded-full border-border/70 bg-background px-3 py-1 text-[11px]">
            Task {index + 1}
          </Badge>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-medium text-muted-foreground">Task title...</Label>
          <Input
            value={draft.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            placeholder="Enter task title"
            className={cn("h-12", inputClassName)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Field</Label>
            <Select value={draft.field} onValueChange={(value) => onChange({ ...draft, field: value, customField: value === "custom" ? draft.customField : "" })}>
              <SelectTrigger className={cn("h-12", triggerClassName)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Priority</Label>
            <Select value={draft.priority} onValueChange={(value) => onChange({ ...draft, priority: value as Priority })}>
              <SelectTrigger className={cn("h-12", triggerClassName)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Due date</Label>
            <Input
              type="date"
              value={draft.dueDate}
              onChange={(event) => onChange({ ...draft, dueDate: event.target.value })}
              className={cn("h-12", inputClassName)}
            />
          </div>

          <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Task type</Label>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className={cn("text-sm font-medium transition-colors", draft.fixed ? "text-foreground" : "text-muted-foreground")}>Fixed</span>
              <Switch
                checked={draft.fixed}
                onCheckedChange={(checked) => onChange({ ...draft, fixed: checked })}
                aria-label="Toggle task fixed state"
              />
              <span className={cn("text-sm font-medium transition-colors", !draft.fixed ? "text-foreground" : "text-muted-foreground")}>Unfixed</span>
            </div>
          </div>
        </div>

        {draft.field === "custom" ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Custom field</Label>
            <Input
              value={draft.customField}
              onChange={(event) => onChange({ ...draft, customField: event.target.value })}
              placeholder="Enter a custom field"
              className={cn("h-12", inputClassName)}
            />
          </div>
        ) : null}

        <div className="space-y-3 border-t border-border/70 pt-3">
          <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left transition-colors hover:text-foreground">
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlignLeft className="h-4 w-4" />
                  Add description
                </span>
                <Plus className={cn("h-4 w-4 text-muted-foreground transition-transform", descriptionOpen && "rotate-45")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="rounded-2xl border border-border/70 bg-surface-soft/60 p-4">
                <Textarea
                  value={draft.description}
                  onChange={(event) => onChange({ ...draft, description: event.target.value })}
                  placeholder="Describe the objective..."
                  className={cn("min-h-[120px] resize-none", inputClassName)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={assignmentOpen} onOpenChange={setAssignmentOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left transition-colors hover:text-foreground">
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ArrowRightLeft className="h-4 w-4" />
                  Change assignment &amp; weight
                </span>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", assignmentOpen && "rotate-90")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-soft/60 p-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Assign to</Label>
                  <Select value={draft.assignee} onValueChange={(value) => onChange({ ...draft, assignee: value })}>
                    <SelectTrigger className={cn("h-11", triggerClassName)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Myself">Myself</SelectItem>
                      <SelectItem value="Maya Chen">Maya Chen</SelectItem>
                      <SelectItem value="Jon Park">Jon Park</SelectItem>
                      <SelectItem value="Sara Ali">Sara Ali</SelectItem>
                      <SelectItem value="Leo Grant">Leo Grant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Weight (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.weight}
                    onChange={(event) => onChange({ ...draft, weight: event.target.value })}
                    className={cn("h-11", inputClassName)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={actionItemsOpen} onOpenChange={setActionItemsOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left transition-colors hover:text-foreground">
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckSquare className="h-4 w-4" />
                  Add action items
                </span>
                <Plus className={cn("h-4 w-4 text-muted-foreground transition-transform", actionItemsOpen && "rotate-45")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="rounded-2xl border border-border/70 bg-surface-soft/60 p-4">
                <div className="space-y-4">
                  {draft.actionItems.map((item, itemIndex) => (
                    <div key={`${itemIndex}-${item.title}`} className="space-y-3 rounded-xl border border-border/70 bg-background p-3">
                      <Input
                        value={item.title}
                        onChange={(event) => updateActionItem(itemIndex, { ...item, title: event.target.value })}
                        placeholder="Action item description"
                        className={cn("h-10", inputClassName)}
                      />
                      <Textarea
                        value={item.description}
                        onChange={(event) => updateActionItem(itemIndex, { ...item, description: event.target.value })}
                        placeholder="Description (optional)"
                        className={cn("min-h-[88px] resize-none", inputClassName)}
                      />
                      <div className="grid gap-3 md:grid-cols-2">
                        <Select value={item.assignee} onValueChange={(value) => updateActionItem(itemIndex, { ...item, assignee: value })}>
                          <SelectTrigger className={cn("h-10", triggerClassName)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Myself">Myself</SelectItem>
                            <SelectItem value="Maya Chen">Maya Chen</SelectItem>
                            <SelectItem value="Jon Park">Jon Park</SelectItem>
                            <SelectItem value="Sara Ali">Sara Ali</SelectItem>
                            <SelectItem value="Leo Grant">Leo Grant</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(event) => updateActionItem(itemIndex, { ...item, dueDate: event.target.value })}
                          className={cn("h-10", inputClassName)}
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
                        <div className="rounded-xl border border-border/70 bg-surface-soft/70 px-3 py-2.5">
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Task type</span>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className={cn("text-sm font-medium transition-colors", item.fixed ? "text-foreground" : "text-muted-foreground")}>Fixed</span>
                            <Switch
                              checked={item.fixed}
                              onCheckedChange={(checked) => updateActionItem(itemIndex, { ...item, fixed: checked })}
                              aria-label="Toggle action item fixed state"
                            />
                            <span className={cn("text-sm font-medium transition-colors", !item.fixed ? "text-foreground" : "text-muted-foreground")}>Unfixed</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                          <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Priority</Label>
                          <Select value={item.priority} onValueChange={(value) => updateActionItem(itemIndex, { ...item, priority: value as Priority })}>
                            <SelectTrigger className={cn("mt-3 h-11", triggerClassName)}>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" className="rounded-xl" onClick={addActionItem}>
                    Add
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

export default FlowDeskIndex;
