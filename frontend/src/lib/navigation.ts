import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Sparkles,
  ClipboardList,
  Layers,
  CalendarDays,
  TrendingUp,
  GitBranch,
  History,
  Users,
  Mic,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Notes", href: "/notes", icon: FileText },
  { label: "AI Assistant", href: "/assistant", icon: MessageSquare },
  { label: "Summariser", href: "/summariser", icon: Sparkles },
  { label: "Quizzes", href: "/quizzes", icon: ClipboardList },
  { label: "Flashcards", href: "/flashcards", icon: Layers },
  { label: "Study Planner", href: "/planner", icon: CalendarDays },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Recent Activity", href: "/activity", icon: History },
  { label: "Mind Maps", href: "/mind-maps", icon: GitBranch },
  { label: "Study Groups", href: "/groups", icon: Users },
  { label: "Voice Tutor", href: "/voice-tutor", icon: Mic },
  { label: "Settings", href: "/settings", icon: Settings },
];
