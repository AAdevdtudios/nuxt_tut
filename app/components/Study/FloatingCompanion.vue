<script setup lang="ts">
import { renderChatMarkdown } from "~/utils/chatMarkdown";

type CompanionMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type CompanionContext = {
  id: number;
  text: string;
};

type CompanionAction =
  | "ask"
  | "summarize"
  | "quiz"
  | "research"
  | "explain"
  | "rephrase"
  | "simplify"
  | "expand"
  | "improve";

type NoteAiOperation =
  | "custom"
  | "explain"
  | "summarize"
  | "questions"
  | "rephrase"
  | "simplify"
  | "expand"
  | "improve";

const actionOptions: { label: string; value: CompanionAction }[] = [
  { label: "Ask", value: "ask" },
  { label: "Summarize", value: "summarize" },
  { label: "Quiz me", value: "quiz" },
  { label: "Research", value: "research" },
  { label: "Explain", value: "explain" },
  { label: "Rephrase", value: "rephrase" },
  { label: "Simplify", value: "simplify" },
  { label: "Expand", value: "expand" },
  { label: "Improve", value: "improve" },
];

const actionGuidancePlaceholders: Record<Exclude<CompanionAction, "ask">, string> = {
  summarize: "What should the summary focus on?",
  quiz: "What kind of questions should I create?",
  research: "What should I investigate further?",
  explain: "What part should I explain more clearly?",
  rephrase: "What tone or style should I use?",
  simplify: "Who should the simpler explanation be for?",
  expand: "What should I add more detail about?",
  improve: "What should I improve most?",
};

const props = withDefaults(
  defineProps<{
    noteId?: string | null;
    topic?: string;
    noteTitle?: string;
    noteContent?: string;
  }>(),
  {
    noteId: null,
    topic: "your study note",
    noteTitle: "Untitled note",
    noteContent: "",
  },
);

const input = ref("");
const inputRef = ref<HTMLTextAreaElement | null>(null);
const selectedAction = ref<CompanionAction>("ask");
const actionGuidance = ref("");
const contexts = ref<CompanionContext[]>([]);
const activeContextId = ref<number | null>(null);
const isThinking = ref(false);
const view = ref<"launcher" | "compact" | "expanded">("launcher");
const panel = ref<HTMLElement | null>(null);
const position = reactive({ x: 20, y: 88 });
const drag = reactive({ active: false, offsetX: 0, offsetY: 0 });
const messages = ref<CompanionMessage[]>([
  {
    id: 1,
    role: "assistant",
    content: `Your note workspace is ready. I will stay nearby while you work on **${props.topic}**. You can ask me to improve a section, explain a concept, or suggest what to write next.`,
  },
]);
const { $api } = useNuxtApp();
let nextMessageId = 2;
let nextContextId = 1;

const actionGuidancePlaceholder = computed(() =>
  selectedAction.value === "ask"
    ? ""
    : actionGuidancePlaceholders[selectedAction.value],
);

const activeContext = computed(() =>
  contexts.value.find((context) => context.id === activeContextId.value),
);

function ensureOpen() {
  if (view.value === "launcher") openCompact();
}

function addContext(text: string) {
  const normalized = text.trim();
  if (
    !normalized ||
    contexts.value.some((context) => context.text === normalized)
  ) {
    return;
  }
  if (contexts.value.length >= 3) {
    const removedContext = contexts.value.shift();
    if (removedContext?.id === activeContextId.value) activeContextId.value = null;
  }
  const context = { id: nextContextId++, text: normalized };
  contexts.value.push(context);
  activeContextId.value = context.id;
}

function removeContext(id: number) {
  contexts.value = contexts.value.filter((context) => context.id !== id);
  if (activeContextId.value === id) activeContextId.value = null;
}

function toggleContext(id: number) {
  activeContextId.value = activeContextId.value === id ? null : id;
}

function openForDocument(action: CompanionAction = "ask") {
  selectedAction.value = action;
  ensureOpen();
}

function openForSelection(text: string, action: CompanionAction = "ask") {
  if (!text.trim()) return;
  addContext(text);
  selectedAction.value = action;
  ensureOpen();
}

function clampPosition(x: number, y: number) {
  const width = panel.value?.offsetWidth || 360;
  const height = panel.value?.offsetHeight || 520;
  return {
    x: Math.min(Math.max(12, x), Math.max(12, window.innerWidth - width - 12)),
    y: Math.min(
      Math.max(12, y),
      Math.max(12, window.innerHeight - height - 12),
    ),
  };
}

function setInitialPosition() {
  const height = panel.value?.offsetHeight || 520;
  position.x = 20;
  position.y = Math.max(76, window.innerHeight - height - 20);
}

function keepPanelInViewport() {
  const next = clampPosition(position.x, position.y);
  position.x = next.x;
  position.y = next.y;
}

function startDrag(event: PointerEvent) {
  if (view.value !== "compact") return;
  if ((event.target as HTMLElement).closest("button")) return;
  drag.active = true;
  drag.offsetX = event.clientX - position.x;
  drag.offsetY = event.clientY - position.y;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function moveDrag(event: PointerEvent) {
  if (!drag.active) return;
  const next = clampPosition(
    event.clientX - drag.offsetX,
    event.clientY - drag.offsetY,
  );
  position.x = next.x;
  position.y = next.y;
}

function stopDrag() {
  drag.active = false;
}

function buildContextInstruction(instruction: string, guidance: string) {
  const passageText = contexts.value
    .map((context, index) => `@${index + 1}\n${context.text}`)
    .join("\n\n");
  const actionDetail = guidance ? `\n\nAdditional direction: ${guidance}` : "";

  return passageText
    ? `${instruction}${actionDetail}\n\nUse these selected passages as the primary context:\n\n${passageText}`
    : `${instruction}${actionDetail}`;
}

function getTransformOperation(action: CompanionAction): NoteAiOperation {
  if (action === "quiz") return "questions";
  if (action === "research" || action === "ask") return "custom";
  return action;
}

async function sendMessage() {
  const instruction = input.value.trim();
  const guidance = actionGuidance.value.trim();
  if (
    !instruction ||
    isThinking.value ||
    (selectedAction.value !== "ask" && !guidance)
  ) {
    return;
  }
  const activeAction = selectedAction.value;
  const requestInstruction = buildContextInstruction(instruction, guidance);
  messages.value.push({
    id: nextMessageId++,
    role: "user",
    content:
      activeAction === "ask"
        ? instruction
        : `${instruction}\n\n#${activeAction}: ${guidance}`,
  });
  input.value = "";
  actionGuidance.value = "";
  await nextTick(resizeInput);
  isThinking.value = true;
  try {
    if (!props.noteId) {
      throw new Error("Save the note before asking GapAI to work with it.");
    }

    const primaryContext =
      contexts.value.length === 1 ? contexts.value[0]?.text : undefined;
    const scope = primaryContext ? "selection" : "document";

    if (activeAction === "ask") {
      const response = await $api.mutate<{
        content?: string;
        promptToStudent?: string | null;
        suggestedActions?: string[];
      }>("/api/notes/ai/tutor", {
        method: "POST",
        body: {
          noteId: props.noteId,
          scope,
          selectedText: primaryContext,
          message: requestInstruction,
          phase: "guide",
          studentAnswer: null,
          conversation: messages.value.slice(-8).map(({ role, content }) => ({
            role,
            content,
          })),
          includeWeb: false,
        },
      });
      const prompt = response?.promptToStudent
        ? `\n\n**Think about this:** ${response.promptToStudent}`
        : "";
      const suggestions = response?.suggestedActions?.length
        ? `\n\n${response.suggestedActions.map((item) => `- ${item}`).join("\n")}`
        : "";
      messages.value.push({
        id: nextMessageId++,
        role: "assistant",
        content:
          `${response?.content || "Let us work through it together."}${prompt}${suggestions}`,
      });
    } else {
      const response = await $api.mutate<{ content?: string }>(
        "/api/notes/ai/transform",
        {
          method: "POST",
          body: {
            noteId: props.noteId,
            operation: getTransformOperation(activeAction),
            scope,
            selectedText: primaryContext,
            instruction: requestInstruction,
            applyMode: "return-only",
            includeWeb: activeAction === "research",
          },
        },
      );
      messages.value.push({
        id: nextMessageId++,
        role: "assistant",
        content: response?.content || "GapAI did not return a response.",
      });
    }
    selectedAction.value = "ask";
  } catch (error: any) {
    messages.value.push({
      id: nextMessageId++,
      role: "assistant",
      content: error?.message || "GapAI could not complete that request.",
    });
  } finally {
    isThinking.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  void sendMessage();
}

function openCompact() {
  view.value = "compact";
  nextTick(setInitialPosition);
}

function resizeInput() {
  const element = inputRef.value;
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 176)}px`;
}

watch(input, () => nextTick(resizeInput));
watch(selectedAction, () => {
  actionGuidance.value = "";
});

defineExpose({
  openForDocument,
  openForSelection,
});

onMounted(() => {
  window.addEventListener("resize", keepPanelInViewport);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", keepPanelInViewport);
});
</script>

<template>
  <Teleport to="body">
    <button
      v-if="view === 'launcher'"
      type="button"
      class="ga-companion-launcher fixed bottom-4 ml-10 left-4 z-[100] flex items-center gap-2 rounded-full border border-(--ga-primary-soft-strong) bg-[var(--ga-surface)] p-2 pr-3 text-left shadow-xl transition hover:-translate-y-1 hover:border-[var(--ga-primary)]"
      aria-label="Open GapAI companion"
      @click="openCompact"
    >
      <span
        class="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ga-primary)] text-white shadow-sm"
      >
        <span
          class="absolute inset-0 animate-ping rounded-full bg-(--ga-primary) opacity-20"
        />
        <UIcon name="i-lucide-sparkles" class="relative h-5 w-5" />
      </span>
      <span class="hidden sm:block">
        <span class="ga-heading block text-xs font-bold">Study AI</span>
        <span class="ga-subtle block text-[10px]">Ask for help</span>
      </span>
    </button>

    <section
      v-else
      ref="panel"
      :class="[
        'ga-floating-companion ga-surface fixed z-[100] flex flex-col overflow-hidden border shadow-2xl',
        view === 'expanded'
          ? 'inset-0 h-dvh w-screen border-0 md:inset-y-0 md:left-0 md:right-auto md:w-[min(460px,100vw)] md:border-r'
          : 'h-[min(560px,calc(100dvh-32px))] w-[min(380px,calc(100vw-24px))] rounded-2xl',
      ]"
      :style="
        view === 'compact'
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : undefined
      "
    >
      <header
        class="flex cursor-move touch-none items-center justify-between gap-2 border-b border-[var(--ga-border)] px-3 py-3"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
      >
        <div class="flex min-w-0 items-center gap-2">
          <div
            class="ga-icon-box flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          >
            <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <p class="ga-heading truncate text-xs font-bold">GapAI Companion</p>
            <p class="ga-subtle truncate text-[10px]">
              {{ view === "expanded" ? "Note guide" : "Drag me anywhere" }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <UButton
            v-if="view === 'compact'"
            icon="i-lucide-maximize-2"
            aria-label="Expand companion"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="view = 'expanded'"
          />
          <UButton
            :icon="
              view === 'expanded'
                ? 'i-lucide-panel-left-close'
                : 'i-lucide-minus'
            "
            :aria-label="
              view === 'expanded'
                ? 'Minimize companion panel'
                : 'Close companion'
            "
            color="neutral"
            variant="ghost"
            size="xs"
            @click="view = view === 'expanded' ? 'compact' : 'launcher'"
          />
        </div>
      </header>

      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[88%] rounded-xl px-3 py-2 text-xs leading-5"
            :class="
              message.role === 'user'
                ? 'bg-(--ga-primary) text-white'
                : 'ga-surface-soft border border-(--ga-border)'
            "
          >
            <div
              v-if="message.role === 'assistant'"
              class="prose prose-sm max-w-none text-inherit"
              v-html="renderChatMarkdown(message.content)"
            />
            <p v-else class="whitespace-pre-wrap">{{ message.content }}</p>
          </div>
        </div>
        <div
          v-if="isThinking"
          class="ga-subtle flex items-center gap-2 text-[11px]"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="h-3.5 w-3.5 animate-spin"
          />
          Thinking about the next step...
        </div>
      </div>
      <footer
        class="border-t border-[var(--ga-border)] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3"
      >
        <div class="ga-surface-soft rounded-2xl border p-2 shadow-sm">
          <div v-if="contexts.length" class="mb-1.5 flex flex-wrap gap-1">
            <div
              v-for="(context, index) in contexts"
              :key="context.id"
              class="flex max-w-full items-center gap-1 rounded-full border border-(--ga-primary-soft-strong) bg-(--ga-primary-soft) px-2 py-1 text-[10px] font-bold text-(--ga-primary)"
            >
              <button
                type="button"
                class="flex min-w-0 items-center gap-1"
                :aria-expanded="activeContextId === context.id"
                @click="toggleContext(context.id)"
              >
                <span class="shrink-0">@{{ index + 1 }}</span>
                <span class="max-w-32 truncate">Selected text</span>
              </button>
              <button
                type="button"
                :aria-label="`Remove context ${index + 1}`"
                class="shrink-0 rounded-full hover:bg-(--ga-primary-soft-strong)"
                @click="removeContext(context.id)"
              >
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </button>
            </div>
          </div>
          <div
            v-if="activeContext"
            class="mb-1.5 rounded-xl border border-(--ga-primary-soft-strong) bg-(--ga-primary-soft) px-3 py-2"
          >
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wide text-(--ga-primary)">
                Selected passage
              </span>
              <button
                type="button"
                aria-label="Close selected passage preview"
                class="text-(--ga-primary)"
                @click="activeContextId = null"
              >
                <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
              </button>
            </div>
            <p class="ga-muted max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-5">
              {{ activeContext.text }}
            </p>
          </div>
          <div class="flex items-end gap-2">
            <textarea
              ref="inputRef"
              v-model="input"
              rows="2"
              placeholder="Ask GapAI anything..."
              class="max-h-44 min-h-7 flex-1 resize-none overflow-y-auto bg-transparent px-1.5 py-1 my-2 text-base leading-6 outline-none sm:text-sm"
              @keydown="handleKeydown"
            />
          </div>
          <input
            v-if="selectedAction !== 'ask'"
            v-model="actionGuidance"
            :placeholder="actionGuidancePlaceholder"
            class="mb-2 w-full rounded-xl bg-(--ga-surface) px-3 py-2 text-base outline-none ring-1 ring-(--ga-border) transition focus:ring-(--ga-primary) sm:text-sm"
          />
          <div class="flex justify-between">
            <select
              v-model="selectedAction"
              aria-label="Choose note AI action"
              class="ga-muted max-w-24 shrink-0 bg-transparent px-1 py-1.5 text-xs font-bold outline-none"
            >
              <option
                v-for="option in actionOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <UButton
              icon="i-lucide-arrow-up"
              aria-label="Send message"
              size="md"
              class="shrink-0 rounded-full"
              :disabled="
                !input.trim() ||
                isThinking ||
                (selectedAction !== 'ask' && !actionGuidance.trim())
              "
              @click="sendMessage"
            />
          </div>
        </div>
      </footer>
    </section>
  </Teleport>
</template>

<style scoped>
.ga-floating-companion {
  animation: companion-arrive 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ga-companion-launcher {
  animation: launcher-arrive 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes companion-arrive {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes launcher-arrive {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
