<script setup lang="ts">
import { renderChatMarkdown } from "~/utils/chatMarkdown";

type StudyMode = "study" | "note" | "explain" | "quiz" | "summary" | "research";
type Message = {
  id: number;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
};
definePageMeta({ layout: "newdash" });

const route = useRoute();
const router = useRouter();
const input = ref("");
const isThinking = ref(false);
const isLaunchingWorkspace = ref(false);
const nextMessageId = ref(10);

const validModes: StudyMode[] = ["study", "note", "explain", "quiz", "summary", "research"];
const requestedMode = typeof route.query.mode === "string" ? route.query.mode : "study";
const activeMode = ref<StudyMode>(
  validModes.includes(requestedMode as StudyMode) ? (requestedMode as StudyMode) : "study",
);
const sourceFile = ref(typeof route.query.file === "string" ? route.query.file : "");
const initialPrompt = typeof route.query.prompt === "string" ? route.query.prompt : "";

const modeConfig: Record<StudyMode, { label: string; icon: string; description: string }> = {
  study: {
    label: "Study companion",
    icon: "i-lucide-sparkles",
    description: "An adaptive space for understanding, notes, summaries, and practice.",
  },
  note: {
    label: "Create study note",
    icon: "i-lucide-notebook-pen",
    description: "Shape a clear note through conversation before saving it.",
  },
  explain: {
    label: "Explain a topic",
    icon: "i-lucide-lightbulb",
    description: "Break down a difficult concept at the right level for you.",
  },
  quiz: {
    label: "Quiz me",
    icon: "i-lucide-circle-help",
    description: "Prepare focused practice through a short adaptive conversation.",
  },
  summary: {
    label: "Summarize PDF",
    icon: "i-lucide-file-search",
    description: "Turn a source into a useful summary for your learning goal.",
  },
  research: {
    label: "Research note",
    icon: "i-lucide-telescope",
    description: "Explore a question and organize the result into a useful note.",
  },
};

const mode = computed(() => modeConfig[activeMode.value]);
const hasComposerContext = computed(() => activeMode.value !== "study" || Boolean(sourceFile.value));

function getOpeningReply() {
  const target = sourceFile.value ? `**${sourceFile.value}**` : `**${initialPrompt || "your topic"}**`;

  if (activeMode.value === "quiz") {
    return `I can create practice questions from ${target}. Before we begin, what level should I aim for and do you want a quick knowledge check or exam-style questions?`;
  }
  if (activeMode.value === "summary") {
    return `I have ${target} ready. Should the summary be a quick revision sheet, a detailed walkthrough, or an exam-focused outline?`;
  }
  if (activeMode.value === "note") {
    return `Let us turn ${target} into a useful study note. What should the note help you do: understand the basics, revise for an exam, or connect key concepts?`;
  }
  if (activeMode.value === "research") {
    return `Let us build a research note around ${target}. What question should the note answer, and how detailed should it be?`;
  }
  if (activeMode.value === "explain") {
    return `Let us unpack ${target}. Tell me which part feels unclear, or I can start with a simple explanation and build from there.`;
  }
  return `I am ready to work through **${initialPrompt}** with you. What would you like to understand first?`;
}

const messages = ref<Message[]>(
  initialPrompt
    ? [
        { id: 1, role: "user", content: initialPrompt, timestamp: new Date() },
        { id: 2, role: "assistant", content: getOpeningReply(), timestamp: new Date() },
      ]
    : [],
);

function assistantReply(content: string) {
  const topic = sourceFile.value || initialPrompt || "this topic";

  if (activeMode.value === "quiz") {
    return `That gives me enough direction. I will keep the questions focused on **${topic}** and adapt the difficulty as you answer. Before I generate them, is there any specific area you want included?`;
  }
  if (activeMode.value === "summary") {
    return `I will shape the summary around **${topic}** for ${content.toLowerCase()}. Do you want concise bullet points, a structured revision note, or both?`;
  }
  if (activeMode.value === "note") {
    return `Understood. I will use **${topic}** as the source and keep the note useful for ${content.toLowerCase()}. Are there sections you want me to emphasize before I draft it?`;
  }
  if (activeMode.value === "research") {
    return `That is a useful research direction. I will organize the evidence around your question and keep the reasoning visible. Should I include opposing viewpoints as well?`;
  }
  if (activeMode.value === "explain") {
    return `Let us start simply. **${topic}** is easier to understand when we separate the core idea from the example. Which part should I explain first: the definition, how it works, or a practical example?`;
  }
  return `I can help with that. We can explain it, turn it into a note, summarize a source, or test your understanding. Which outcome would be most useful right now?`;
}

async function sendMessage() {
  const content = input.value.trim();
  if (!content || isThinking.value) return;

  messages.value.push({
    id: nextMessageId.value++,
    role: "user",
    content,
    timestamp: new Date(),
  });
  input.value = "";
  isThinking.value = true;
  await new Promise((resolve) => setTimeout(resolve, 550));
  messages.value.push({
    id: nextMessageId.value++,
    role: "assistant",
    content: assistantReply(content),
    timestamp: new Date(),
  });
  isThinking.value = false;

  if (activeMode.value === "note") {
    await new Promise((resolve) => setTimeout(resolve, 650));
    isLaunchingWorkspace.value = true;
    await new Promise((resolve) => setTimeout(resolve, 850));
    await router.push({
      path: "/dashboard/notes/new",
      query: {
        companion: "note",
        topic: initialPrompt || sourceFile.value || "New study note",
        brief: content,
      },
    });
  }
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  void sendMessage();
}

function startNewChat() {
  router.push("/dashboard");
}

function removeIntent() {
  activeMode.value = "study";
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
</script>

<template>
  <section
    class="ga-surface relative flex h-[calc(100vh-var(--ui-header-height))] min-h-0 min-w-0 flex-col overflow-hidden transition-all duration-700"
    :class="isLaunchingWorkspace ? 'scale-[0.96] opacity-0' : ''"
  >
      <header class="flex items-center justify-between gap-3 border-b border-[var(--ga-border)] px-4 py-3 sm:px-5">
        <div class="flex min-w-0 items-center gap-3">
          <div class="ga-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <p class="ga-heading truncate text-sm font-bold">GapAI Companion</p>
            <p class="ga-subtle truncate text-[11px]">{{ mode.description }}</p>
          </div>
        </div>
        <UButton label="New chat" icon="i-lucide-plus" color="neutral" variant="ghost" size="sm" @click="startNewChat" />
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="!messages.length" class="mx-auto flex h-full max-w-xl flex-col items-center justify-center px-6 text-center">
          <div class="ga-icon-box flex h-14 w-14 items-center justify-center rounded-2xl">
            <UIcon name="i-lucide-sparkles" class="h-6 w-6" />
          </div>
          <h1 class="ga-heading mt-5 font-serif text-3xl font-semibold">How can I help you study?</h1>
          <p class="ga-muted mt-2 text-sm leading-6">
            Ask a question, attach a source, or tell me the outcome you need. I will adapt as we work.
          </p>
        </div>

        <div v-else class="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-8">
          <div v-for="message in messages" :key="message.id" class="flex gap-3" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
            <div v-if="message.role === 'assistant'" class="ga-icon-box flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
            </div>
            <div class="max-w-[85%]">
              <div
                :class="[
                  'rounded-2xl px-4 py-3 text-sm leading-6',
                  message.role === 'user'
                    ? 'bg-[var(--ga-primary)] text-white'
                    : 'ga-surface-soft border border-[var(--ga-border)] text-[var(--ga-text)]',
                ]"
              >
                <div v-if="message.role === 'assistant'" class="prose prose-sm max-w-none [color:inherit]" v-html="renderChatMarkdown(message.content)" />
                <p v-else class="whitespace-pre-wrap">{{ message.content }}</p>
              </div>
              <p class="ga-subtle mt-1 px-1 text-[10px]" :class="message.role === 'user' ? 'text-right' : ''">{{ formatTime(message.timestamp) }}</p>
            </div>
          </div>
          <div v-if="isThinking" class="flex items-center gap-3">
            <div class="ga-icon-box flex h-8 w-8 items-center justify-center rounded-lg">
              <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
            </div>
            <div class="ga-surface-soft ga-muted flex items-center gap-1 rounded-2xl border px-4 py-3">
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            </div>
          </div>
        </div>
      </div>

      <footer class="border-t border-[var(--ga-border)] px-3 py-3 sm:px-5 sm:py-4">
        <div class="mx-auto max-w-3xl">
          <div class="ga-surface-soft rounded-2xl border p-2 shadow-sm">
            <div v-if="hasComposerContext" class="flex flex-wrap gap-2 px-1 pb-2">
              <div v-if="activeMode !== 'study'" class="inline-flex items-center gap-2 rounded-xl border border-[var(--ga-primary-soft-strong)] bg-[var(--ga-primary-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ga-primary)]">
                <UIcon :name="mode.icon" class="h-3.5 w-3.5" />
                <span>{{ mode.label }}</span>
                <button type="button" aria-label="Remove intent" class="rounded-full p-0.5 hover:bg-[var(--ga-primary-soft-strong)]" @click="removeIntent">
                  <UIcon name="i-lucide-x" class="h-3 w-3" />
                </button>
              </div>
              <div v-if="sourceFile" class="inline-flex max-w-full items-center gap-2 rounded-xl border border-[var(--ga-border)] bg-[var(--ga-surface)] px-2.5 py-1.5 text-xs font-semibold">
                <UIcon name="i-lucide-file-text" class="h-3.5 w-3.5 shrink-0 text-[var(--ga-warm)]" />
                <span class="max-w-52 truncate">{{ sourceFile }}</span>
                <button type="button" aria-label="Remove source" class="rounded-full p-0.5 hover:bg-[var(--ga-warm-soft)]" @click="sourceFile = ''">
                  <UIcon name="i-lucide-x" class="h-3 w-3" />
                </button>
              </div>
            </div>
            <div class="flex items-end gap-2">
              <textarea
                v-model="input"
                rows="2"
                placeholder="Message GapAI..."
                class="min-h-12 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none"
                @keydown="handleInputKeydown"
              />
              <UButton icon="i-lucide-arrow-up" aria-label="Send message" class="rounded-xl" :disabled="!input.trim() || isThinking" @click="sendMessage" />
            </div>
          </div>
          <p class="ga-subtle mt-2 text-center text-[11px]">GapAI can make mistakes. Check important information.</p>
        </div>
      </footer>

      <div v-if="isLaunchingWorkspace" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ga-bg)]/85 backdrop-blur-md">
        <div class="text-center">
          <div class="ga-icon-box mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
            <UIcon name="i-lucide-notebook-pen" class="h-7 w-7 animate-pulse" />
          </div>
          <p class="ga-heading mt-5 font-serif text-2xl font-semibold">Opening your note workspace</p>
          <p class="ga-muted mt-2 text-sm">I will stay with you while you shape the draft.</p>
        </div>
      </div>
  </section>
</template>
