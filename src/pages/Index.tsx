import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRightLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleEllipsis,
  Clock3,
  Command,
  FileText,
  Filter,
  Gauge,
  Inbox,
  LayoutGrid,
  ListFilter,
  LoaderCircle,
  MessageSquareText,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SquareCheckBig,
  Target,
  TrendingUp,
  Users,
  WandSparkles,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

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
import { cn } from "@/lib/utils";

type Role = "employee" | "manager" | "admin";
type TaskStatus = "emergency" | "in-progress" | "to-do" | "completed" | "blocked";
type Priority = "critical" | "high" | "medium" | "low";
type PageKey =
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

type Meeting = {
  id: string;
  title: string;
  project: string;
  time: string;
  attendees: string[];
  status: "scheduled" | "draft" | "review";
  summary: string;
  actions: string[];
  aiConfidence: number;
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
  { key: "today", title: "Today's Tasks", path: "/", icon: LayoutGrid, roles: ["employee", "manager", "admin"] },
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
    priority: "critical",
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
    priority: "critical",
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
    time: "Today · 15:00",
    attendees: ["Jon", "Maya", "Sara", "Leo"],
    status: "review",
    summary: "AI extracted 6 tasks and flagged 2 low-confidence action owners.",
    actions: ["Approve action owners", "Send summary", "Create follow-up tasks"],
    aiConfidence: 84,
  },
  {
    id: "MOM-37",
    title: "Client recovery call",
    project: "Westbridge",
    time: "Tomorrow · 09:00",
    attendees: ["Maya", "Omar", "Nina"],
    status: "draft",
    summary: "Draft agenda and pre-read attached. Awaiting approval for escalated asks.",
    actions: ["Attach latest blockers", "Confirm attendees"],
    aiConfidence: 72,
  },
  {
    id: "MOM-36",
    title: "Quarterly staffing calibration",
    project: "People Ops",
    time: "Thu · 11:30",
    attendees: ["Sara", "Ivy", "Admin"],
    status: "scheduled",
    summary: "Pending calendar sync connection for room and reminders.",
    actions: ["Enable sync later", "Assign agenda owner"],
    aiConfidence: 93,
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
    priority: "critical",
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
  critical: "bg-metric-red-soft text-metric-red border-transparent",
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

function getPageKey(pathname: string): PageKey {
  const match = navItems.find((item) => item.path === pathname);
  return match?.key ?? "today";
}

function FlowDeskIndex() {
  const [role, setRole] = useState<Role>("manager");
  const [tasks, setTasks] = useState(tasksSeed);
  const [meetings] = useState(meetingsSeed);
  const [approvals] = useState(approvalsSeed);
  const [notifications] = useState(notificationsSeed);
  const [users] = useState(usersSeed);
  const [selectedTaskId, setSelectedTaskId] = useState(tasksSeed[0]?.id ?? "");
  const [selectedMeetingId, setSelectedMeetingId] = useState(meetingsSeed[0]?.id ?? "");
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
    const allowed = availableNav.some((item) => item.path === location.pathname);
    if (!allowed) {
      navigate(availableNav[0]?.path ?? "/", { replace: true });
    }
  }, [availableNav, location.pathname, navigate]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
  const selectedMeeting = meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0];
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
    navigate("/");
  };

  const page = {
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
    meetings: <MeetingsPage meetings={meetings} selectedMeeting={selectedMeeting} onSelectMeeting={setSelectedMeetingId} />,
    approvals: <ApprovalsPage approvals={approvals} role={role} />,
    analytics: <AnalyticsPage role={role} />, 
    users: <UsersPage users={users} />, 
    settings: <SettingsPage role={role} notifications={notifications} />,
  }[currentPage];

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full bg-background text-foreground">
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={availableNav} onNavigate={navigate} />
        <PullFromTotalDialog open={pullOpen} onOpenChange={setPullOpen} tasks={tasks.filter((task) => task.week !== "This week")} onPull={pullToToday} />
        <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} />
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
                <div className="grid h-full grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <section className="min-h-[calc(100vh-5.25rem)] rounded-md border border-border/70 bg-surface-panel shadow-sm">
                    <div className="h-full overflow-auto p-3 md:p-4">{page}</div>
                  </section>
                  <RightRail
                    task={selectedTask}
                    meeting={selectedMeeting}
                    notifications={notifications}
                    isOpen={notificationsOpen}
                    onClose={() => setNotificationsOpen(false)}
                  />
                </div>
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
            Create task placeholder
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
    <button
      type="button"
      onClick={onSelect}
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
    </button>
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
  const groups: Array<{ title: string; status: TaskStatus; helper: string }> = [
    { title: "Emergency", status: "emergency", helper: "Must move first; review states remain visible." },
    { title: "In Progress", status: "in-progress", helper: "Active work with visible ownership and progress." },
    { title: "To Do", status: "to-do", helper: "Ready to start or waiting for today’s pull decision." },
    { title: "Completed", status: "completed", helper: "Finished today, still visible for sign-off and audit." },
  ];

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
          { label: "Completed", value: `${tasks.filter((task) => task.status === "completed").length}`, tone: "green", helper: "Ready for review and reporting." },
          { label: "In progress", value: `${tasks.filter((task) => task.status === "in-progress").length}`, tone: "blue", helper: "Live work currently assigned today." },
          { label: "Emergency", value: `${tasks.filter((task) => task.status === "emergency").length}`, tone: "red", helper: "Escalated items visible at the top." },
          { label: "Review", value: `${tasks.filter((task) => task.requiresReview).length}`, tone: "amber", helper: "Need manager or admin confirmation." },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <SectionBlock key={group.title} title={group.title} helper={group.helper}>
            {tasks.filter((task) => task.status === group.status).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedTask?.id === task.id}
                onSelect={() => onSelectTask(task.id)}
                onToggleTask={() => onToggleTask(task.id)}
              />
            ))}
          </SectionBlock>
        ))}
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
          { label: "High priority", value: `${tasks.filter((task) => ["critical", "high"].includes(task.priority)).length}`, tone: "red", helper: "Need attention during planning." },
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
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          {Object.entries(grouped).map(([week, items]) => (
            <SectionBlock key={week} title={week} helper="Default grouped backlog view with future backend filter slots.">
              {items.map((task) => (
                <TaskCard key={task.id} task={task} selected={selectedTaskId === task.id} onSelect={() => onSelectTask(task.id)} />
              ))}
            </SectionBlock>
          ))}
        </div>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter panel</CardTitle>
            <CardDescription>Backend-ready placeholders for role, project, and date logic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Search task IDs or owners",
              "Filter by project and week",
              "Surface overdue and revise-date requests",
              "Preview project/list views",
            ].map((item) => (
              <div key={item} className="rounded-md border border-dashed border-border/70 bg-surface-soft p-3 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MeetingsPage({
  meetings,
  selectedMeeting,
  onSelectMeeting,
}: {
  meetings: Meeting[];
  selectedMeeting?: Meeting;
  onSelectMeeting: (meetingId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <PageIntro
        pageKey="meetings"
        actions={
          <>
            <Button variant="outline" className="gap-2 bg-card">
              <CalendarClock className="h-4 w-4" />
              Calendar view
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule meeting
            </Button>
          </>
        }
      />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => onSelectMeeting(meeting.id)}
              className={cn(
                "w-full rounded-md border bg-card p-4 text-left transition-colors hover:border-primary/35 hover:bg-surface-soft",
                selectedMeeting?.id === meeting.id ? "border-primary/45 bg-surface-soft" : "border-border/70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{meeting.title}</p>
                    <Badge className={statusTone[meeting.status]}>{meeting.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{meeting.project}</p>
                </div>
                <Badge className="bg-accent text-accent-foreground border-transparent">{meeting.aiConfidence}% AI</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{meeting.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {meeting.time}
                <span>•</span>
                {meeting.attendees.join(", ")}
              </div>
            </button>
          ))}
        </div>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Meeting detail</CardTitle>
            <CardDescription>List-first experience with AI draft review and linked tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMeeting ? (
              <Tabs defaultValue="minutes" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-surface-soft">
                  <TabsTrigger value="minutes">M.O.M</TabsTrigger>
                  <TabsTrigger value="ai">AI Draft</TabsTrigger>
                  <TabsTrigger value="tasks">Linked Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="minutes" className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">{selectedMeeting.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedMeeting.summary}</p>
                  </div>
                  <div className="rounded-md bg-surface-soft p-3 text-sm text-muted-foreground">
                    Manual notes, attendance, and final summary fields would connect here later.
                  </div>
                </TabsContent>
                <TabsContent value="ai" className="space-y-3">
                  <div className="rounded-md border border-border/70 bg-surface-soft p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">AI extracted actions</p>
                      <Badge className="bg-accent text-accent-foreground border-transparent">{selectedMeeting.aiConfidence}% confidence</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedMeeting.actions.map((action) => (
                        <div key={action} className="rounded-md bg-background p-3 text-sm text-foreground">
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="tasks" className="space-y-3">
                  <div className="rounded-md border border-dashed border-border/70 bg-surface-soft p-3 text-sm text-muted-foreground">
                    Linked task preview stays visual for now, ready for future workflow wiring.
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
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

function AddTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>Frontend-only drawer replacement with backend-ready placeholders for fields and ownership.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            "Task title",
            "Owner and role",
            "Priority and due date",
            "Review / sign-off requirement",
          ].map((item) => (
            <div key={item} className="rounded-md border border-dashed border-border/70 bg-surface-soft p-3">
              {item}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save placeholder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FlowDeskIndex;
