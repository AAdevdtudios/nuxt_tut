<script setup lang="ts">
const route = useRoute();

const defaultSeo = {
  title: "GapAI | Active learning workspace",
  description:
    "GapAI helps students turn notes, PDFs, links, and projects into understanding, better study notes, and active practice.",
};

const routeSeo: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Log in | GapAI",
    description:
      "Access your GapAI study workspace to create notes, chat with study materials, and practise with AI.",
  },
  "/about": {
    title: "About | GapAI",
    description:
      "Learn how GapAI helps students study actively with AI-powered notes, summaries, practice, and project workspaces.",
  },
  "/privacy": {
    title: "Privacy Policy | GapAI",
    description:
      "Read how GapAI handles account data, study materials, notes, and privacy across the learning workspace.",
  },
  "/terms": {
    title: "Terms of Service | GapAI",
    description:
      "Review the terms that apply when using GapAI for AI-powered study notes, projects, practice, and learning tools.",
  },
  "/auth/login": {
    title: "Log in | GapAI",
    description:
      "Log in to GapAI to continue studying with your notes, library, projects, and AI companion.",
  },
  "/auth/register": {
    title: "Create account | GapAI",
    description:
      "Create a GapAI account and start turning topics, documents, PDFs, and links into active learning.",
  },
  "/auth/forgot-password": {
    title: "Forgot password | GapAI",
    description:
      "Request a password reset link for your GapAI account.",
  },
  "/auth/recover-account": {
    title: "Recover account | GapAI",
    description:
      "Recover access to your GapAI account and continue your study workspace.",
  },
  "/dashboard": {
    title: "Study command center | GapAI",
    description:
      "Start a study session, create notes, attach documents, and continue recent learning activity in GapAI.",
  },
  "/billing": {
    title: "Billing | GapAI",
    description:
      "Review GapAI subscription status, payment confirmation, checkout cancellation, and current plan usage.",
  },
  "/dashboard/study": {
    title: "Study AI | GapAI",
    description:
      "Use GapAI as an adaptive study companion for notes, explanations, summaries, and practice planning.",
  },
  "/dashboard/study-chat": {
    title: "Temporary study chat | GapAI",
    description:
      "Clarify a topic, answer follow-up questions, and decide the next study action before creating a saved note.",
  },
  "/dashboard/source-chat": {
    title: "Source chat | GapAI",
    description:
      "Chat with an uploaded PDF, document, text file, or link before turning it into a saved GapAI note.",
  },
  "/dashboard/notes": {
    title: "Notes | GapAI",
    description:
      "Browse, search, and manage saved markdown study notes in your GapAI workspace.",
  },
  "/dashboard/library": {
    title: "Library | GapAI",
    description:
      "Manage PDFs, documents, links, notes, and study materials used by GapAI.",
  },
  "/dashboard/projects": {
    title: "Projects | GapAI",
    description:
      "Organise materials, notes, practice, and progress around focused learning projects.",
  },
  "/dashboard/analytics": {
    title: "Analysis | GapAI",
    description:
      "Review study activity, progress signals, and learning insights across your GapAI workspace.",
  },
  "/dashboard/ai_chat": {
    title: "AI chat | GapAI",
    description:
      "Chat with selected project materials and study sources using GapAI's adaptive tutor.",
  },
  "/dashboard/question_generator": {
    title: "Question generator | GapAI",
    description:
      "Generate practice questions from study materials and test your understanding with GapAI.",
  },
  "/dashboard/timetable": {
    title: "Timetable | GapAI",
    description:
      "Generate and manage a calendar-style study timetable based on your learning goals.",
  },
  "/dashboard/explore": {
    title: "Explore | GapAI",
    description:
      "Discover learning prompts, study ideas, and recommended next actions in GapAI.",
  },
  "/dashboard/settings": {
    title: "Settings | GapAI",
    description:
      "Manage your GapAI profile, subscription, display preferences, language, theme, and accent color.",
  },
  "/dashboard/feedback": {
    title: "Feedback | GapAI",
    description:
      "Share feedback, report issues, request features, and vote on improvements for GapAI.",
  },
  "/dashboard/help": {
    title: "Help and support | GapAI",
    description:
      "Find help articles, guides, FAQs, and support options for using GapAI.",
  },
  "/dashboard/coming-soon": {
    title: "Coming soon | GapAI",
    description:
      "Preview upcoming GapAI features, roadmap ideas, and planned learning tools.",
  },
  "/dashboard/features": {
    title: "Features | GapAI",
    description:
      "Explore GapAI features for AI study notes, library materials, projects, practice, and analytics.",
  },
  "/dashboard/editor-demo": {
    title: "Editor demo | GapAI",
    description:
      "Preview GapAI's markdown-style note editor blocks, formatting, and writing tools.",
  },
  "/note-redesign": {
    title: "Note workspace concept | GapAI",
    description:
      "Preview the note-first GapAI study workspace concept and AI companion layout.",
  },
  "/newDash": {
    title: "Dashboard preview | GapAI",
    description:
      "Preview the GapAI dashboard layout and active learning workspace navigation.",
  },
};

const dynamicSeo = computed(() => {
  const path = route.path;

  if (path.startsWith("/dashboard/notes/")) {
    return {
      title: "Note editor | GapAI",
      description:
        "Write, improve, summarise, and study a markdown note with the GapAI note companion.",
    };
  }

  if (path.startsWith("/study/") && path.includes("/test/")) {
    return {
      title: "Adaptive test | GapAI",
      description:
        "Answer diagnostic or path practice questions in GapAI to unlock the next learning stage.",
    };
  }

  if (path.startsWith("/study/")) {
    return {
      title: "Study stream | GapAI",
      description:
        "Follow your GapAI adaptive study stream, complete unlocked paths, and track mastery.",
    };
  }

  if (path.startsWith("/dashboard/projects/") && path.endsWith("/practice")) {
    return {
      title: "Practice session | GapAI",
      description:
        "Answer generated practice questions, review correct answers, and learn from explanations in GapAI.",
    };
  }

  if (path.startsWith("/dashboard/projects/")) {
    return {
      title: "Project workspace | GapAI",
      description:
        "Review project materials, notes, AI chat, practice, progress, and recommended study actions.",
    };
  }

  if (path.startsWith("/profile/")) {
    return {
      title: "Profile | GapAI",
      description:
        "View a GapAI user profile and learning workspace information.",
    };
  }

  if (path.startsWith("/auth/reset-password")) {
    return {
      title: "Reset password | GapAI",
      description:
        "Set a new password for your GapAI account.",
    };
  }

  return routeSeo[path] || defaultSeo;
});

useSeoMeta({
  title: () => dynamicSeo.value.title,
  description: () => dynamicSeo.value.description,
  ogTitle: () => dynamicSeo.value.title,
  ogDescription: () => dynamicSeo.value.description,
  ogSiteName: "GapAI",
  twitterCard: "summary_large_image",
  twitterTitle: () => dynamicSeo.value.title,
  twitterDescription: () => dynamicSeo.value.description,
});

useHead({
  titleTemplate: (title) => title || defaultSeo.title,
  meta: [{ name: "application-name", content: "GapAI" }],
  link: [
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  ],
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
