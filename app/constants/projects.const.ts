import {
  ProjectAITutorTab,
  ProjectMaterialsTab,
  ProjectNotesTab,
  ProjectOverviewTab,
  ProjectPracticeTab,
  ProjectSettingsTab,
} from "#components";
import type { ProjectIcon } from "~/types/project.types";

export const PROJECT_TABS = [
  {
    label: "Overview",
    icon: "i-lucide-home",
    component: ProjectOverviewTab,
    value: "overview",
  },
  {
    label: "Materials",
    icon: "i-lucide-book",
    component: ProjectMaterialsTab,
    value: "materials",
  },
  {
    label: "Notes",
    icon: "i-lucide-file-text",
    component: ProjectNotesTab,
    value: "notes",
  },
  {
    label: "Practice",
    icon: "i-lucide-bar-chart-2",
    component: ProjectPracticeTab,
    value: "practice",
  },
  {
    label: "AI Tutor",
    icon: "i-lucide-message-circle",
    component: ProjectAITutorTab,
    value: "ai_tutor",
  },
  {
    label: "Settings",
    icon: "i-lucide-settings",
    component: ProjectSettingsTab,
    value: "settings",
  },
];

export const ICONS: Record<ProjectIcon, string> = {
  "graduation-cap": "i-lucide-graduation-cap",
  "file-text": "i-lucide-file-text",
  atom: "i-lucide-atom",
  presentation: "i-lucide-presentation",
  "book-open": "i-lucide-book-open",
  folder: "i-lucide-folder",
  target: "i-lucide-target",
  sparkles: "i-lucide-sparkles",
};
