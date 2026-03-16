import type { GuideItem, SupportTab } from "~/types/support.types";

export const SUPPORT_TABS: Array<{
  label: string;
  value: SupportTab;
  icon: string;
}> = [
  { label: "FAQ", value: "faq", icon: "i-lucide-circle-help" },
  { label: "Guides", value: "guides", icon: "i-lucide-book-open" },
  { label: "Contact Us", value: "contact", icon: "i-lucide-mail" },
];

export const SUPPORT_GUIDE_ITEMS: GuideItem[] = [
  {
    id: "1",
    title: "Getting Started",
    description:
      "Learn the basics of navigating LearnHub and setting up your first project.",
    icon: "i-lucide-layout-dashboard",
    category: "Basics",
  },
  {
    id: "2",
    title: "Managing Your Library",
    description:
      "Upload, organise, and manage all your study materials in one place.",
    icon: "i-lucide-library-big",
    category: "Library",
  },
  {
    id: "3",
    title: "AI Chat Deep Dive",
    description:
      "Get the most out of AI-powered conversations with your study materials.",
    icon: "i-lucide-message-circle",
    category: "AI Chat",
  },
  {
    id: "4",
    title: "Building Effective Projects",
    description:
      "Organise your studies around goals with projects, milestones, and tracking.",
    icon: "i-lucide-folder-kanban",
    category: "Projects",
  },
  {
    id: "5",
    title: "Generating Practice Questions",
    description:
      "Create objective, theory, or mixed question sets from your materials.",
    icon: "i-lucide-circle-help",
    category: "Questions",
  },
  {
    id: "6",
    title: "Study Timetable Mastery",
    description:
      "Generate and customise study schedules that work with your lifestyle.",
    icon: "i-lucide-calendar",
    category: "Timetable",
  },
  {
    id: "7",
    title: "Exploring New Content",
    description:
      "Discover trending topics, recommended resources, and community picks.",
    icon: "i-lucide-compass",
    category: "Explore",
  },
  {
    id: "8",
    title: "Keyboard Shortcuts",
    description:
      "Speed up your workflow with built-in keyboard shortcuts and tips.",
    icon: "i-lucide-zap",
    category: "Tips",
  },
];

export const SUPPORT_CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  library: "Library",
  "ai-chat": "AI Chat",
  questions: "Questions",
  projects: "Projects",
  timetable: "Timetable",
  account: "Account",
  general: "General",
};
