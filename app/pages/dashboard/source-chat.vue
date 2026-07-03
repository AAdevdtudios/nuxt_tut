<script setup lang="ts">
import type {
  IntakeAction,
  NotesIntakeResponse,
  SuggestedActionItem,
} from "~/stores/studyIntake";
import {
  appendSuggestedAction,
  isSavedNoteViewMode,
} from "~/stores/studyIntake";
import type { LibraryItem, LibrarySingleResponse } from "~/types";
import { renderChatMarkdown } from "~/utils/chatMarkdown";

definePageMeta({ layout: "newdash" });

const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const intake = useStudyIntakeStore();

const source = ref<LibraryItem | null>(null);
const input = ref("");
const isLoadingSource = ref(false);
const isSubmitting = ref(false);
const jobStatus = ref<string | null>(intake.status);
const jotterText = ref("");
const sourceChatSessionId = ref<string | null>(null);

const sourceId = computed(() => intake.sourceLibraryItemId);
const sourceTitle = computed(
  () => source.value?.title || intake.title || "Source workspace",
);
const sourceKind = computed(() => {
  const fileName = source.value?.fileName || source.value?.fileUrl || "";
  if (/\.pdf($|\?)/i.test(fileName)) return "PDF source";
  if (source.value?.libraryType === "url") return "Web source";
  if (source.value?.libraryType === "note") return "Note source";
  return "Document source";
});
const sourceText = computed(() =>
  (source.value?.content || "").trim() ||
  "GapAI is preparing this source. If extraction is still running, source-grounded answers will improve when processing finishes.",
);
const jotterStorageKey = computed(
  () => `gapai-source-jotter:${sourceId.value || intake.title || "temporary"}`,
);
const initialSourceActionKey = computed(
  () => `gapai-source-initial:${sourceId.value || "unknown"}:${intake.action || "none"}`,
);

type SourceChatResponse = {
  sessionId?: string | null;
  answer?: string | null;
  content?: string | null;
  message?: string | null;
};

const sourceActionMessages: Record<string, { message: string; includeWeb: boolean }> = {
  "explain-source": {
    message: "Explain this source clearly.",
    includeWeb: false,
  },
  explain: {
    message: "Explain this source clearly.",
    includeWeb: false,
  },
  "summarise-source": {
    message: "Summarise this source into key points and what I should remember.",
    includeWeb: false,
  },
  summarize: {
    message: "Summarise this source into key points and what I should remember.",
    includeWeb: false,
  },
  "research-around-it": {
    message: "Research around this source and add useful study context.",
    includeWeb: true,
  },
  "research-more": {
    message: "Research around this source and add useful study context.",
    includeWeb: true,
  },
};
const sourceWorkspaceActions = [
  {
    label: "Explain source",
    icon: "i-lucide-lightbulb",
    action: "explain-source",
  },
  {
    label: "Summarise source",
    icon: "i-lucide-file-search",
    action: "summarise-source",
  },
  {
    label: "Research around it",
    icon: "i-lucide-telescope",
    action: "research-around-it",
  },
  {
    label: "Make study guide",
    icon: "i-lucide-book-open-check",
    action: "make-study-guide",
  },
] as const;

async function fetchSource() {
  if (!sourceId.value) return;

  try {
    isLoadingSource.value = true;
    const response = await $api.fetch<LibrarySingleResponse>(
      `/api/libraries/${sourceId.value}`,
    );
    source.value = response.data;
  } catch {
    source.value = null;
  } finally {
    isLoadingSource.value = false;
  }
}

async function pollJobIfNeeded() {
  if (!intake.jobId) return;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await $api.fetch<{ status?: string | null }>(
      `/api/notes/jobs/${intake.jobId}`,
    );
    jobStatus.value = response?.status || null;

    if (
      response?.status === "completed" ||
      response?.status === "failed" ||
      response?.status === "cancelled"
    ) {
      await fetchSource();
      return;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }
}

async function routeFromResponse(
  response: NotesIntakeResponse,
  submittedMessage: string,
) {
  if (
    (response?.shouldCreateNote === true ||
      isSavedNoteViewMode(response?.viewMode)) &&
    response.noteId
  ) {
    await router.push({
      path: `/dashboard/notes/${response.noteId}`,
      query: {
        ...(response.jobId ? { jobId: response.jobId } : {}),
        ...(response.status ? { status: response.status } : {}),
        ...(response.suggestedTitle
          ? { suggestedTitle: response.suggestedTitle }
          : {}),
        ...(response.viewMode ? { viewMode: response.viewMode } : {}),
      },
    });
    return;
  }

  intake.applyResponse(response, submittedMessage);
  if (response.sourceLibraryItemId) {
    await fetchSource();
  }

  if (response?.viewMode === "chat") {
    await router.push("/dashboard/study-chat");
  }
}

async function callSourceChat(messageOverride?: string, includeWeb = false) {
  const message = (messageOverride ?? input.value).trim();

  if (!sourceId.value) {
    toast.add({
      title: "Source not ready",
      description: "GapAI could not find the source id for this workspace.",
      color: "warning",
    });
    return;
  }

  if (!message) {
    toast.add({
      title: "Ask about the source",
      description: "Type a question or choose a suggested action.",
      color: "warning",
    });
    return;
  }

  try {
    isSubmitting.value = true;
    intake.appendMessage("user", message);
    const response = await $api.mutate<SourceChatResponse>(
      `/api/sources/${sourceId.value}/chat`,
      {
        method: "POST",
        body: {
          sourceLibraryItemId: sourceId.value,
          sessionId: sourceChatSessionId.value,
          message,
          aiTier: "local-basic",
          includeWeb,
        },
      },
    );
    if (response.sessionId) sourceChatSessionId.value = response.sessionId;
    intake.appendMessage(
      "assistant",
      response.answer ||
        response.content ||
        response.message ||
        "I could not generate a source response.",
    );
    input.value = "";
  } catch (error: any) {
    toast.add({
      title: "Could not continue",
      description:
        error?.statusMessage || error?.message || "Please try again shortly.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function createSourceStudyGuide(instruction?: string) {
  if (!sourceId.value) {
    toast.add({
      title: "Source not ready",
      description: "GapAI could not find the source id for this workspace.",
      color: "warning",
    });
    return;
  }

  try {
    isSubmitting.value = true;
    const response = await $api.mutate<NotesIntakeResponse>(
      `/api/sources/${sourceId.value}/study-guide`,
      {
        method: "POST",
        body: {
          sourceLibraryItemId: sourceId.value,
          instruction:
            instruction || "Create a useful study guide from this source.",
        },
      },
    );
    await routeFromResponse(response, instruction || "Make study guide");
  } catch (error: any) {
    toast.add({
      title: "Could not create study guide",
      description:
        error?.statusMessage || error?.message || "Please try again shortly.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

function handleSuggestedAction(item: SuggestedActionItem) {
  if (
    item.action === "make-study-guide" ||
    item.action === "study-guide" ||
    item.mode === "study-guide"
  ) {
    void createSourceStudyGuide(item.message || item.description);
    return;
  }

  if (item.mode === "source-chat" || sourceActionMessages[item.action]) {
    const sourceAction = sourceActionMessages[item.action] || {
      message: item.message || item.label,
      includeWeb: false,
    };
    void callSourceChat(item.message || sourceAction.message, sourceAction.includeWeb);
    return;
  }

  if (
    (item.mode === "note-chat" ||
      item.mode === "note-action" ||
      item.mode === "study-guide") &&
    !intake.noteId
  ) {
    intake.appendMessage("user", item.label);
    intake.appendMessage(
      "assistant",
      item.description ||
        "This action needs a saved note first. Choose a create-note action when GapAI offers one.",
    );
    return;
  }

  if (item.mode === "needs-material") {
    intake.appendMessage("user", item.label);
    intake.appendMessage(
      "assistant",
      item.description ||
        "This action needs more material before GapAI can continue.",
    );
    return;
  }

  if (item.mode === "temporary-chat" || item.mode === "create-note") {
    const form = new FormData();
    appendSuggestedAction(form, item, intake.conversationContext);
    void (async () => {
      try {
        isSubmitting.value = true;
        const response = await $api.mutate<NotesIntakeResponse>(
          "/api/notes/intake",
          {
            method: "POST",
            body: form,
          },
        );
        await routeFromResponse(response, item.message || item.label);
      } catch (error: any) {
        toast.add({
          title: "Could not continue",
          description:
            error?.statusMessage ||
            error?.message ||
            "Please try again shortly.",
          color: "error",
        });
      } finally {
        isSubmitting.value = false;
      }
    })();
    return;
  }

  void callSourceChat(item.message || item.label, false);
}

function handleSourceWorkspaceAction(action: (typeof sourceWorkspaceActions)[number]) {
  if (action.action === "make-study-guide") {
    void createSourceStudyGuide();
    return;
  }

  const sourceAction = sourceActionMessages[action.action];
  if (!sourceAction) return;
  void callSourceChat(sourceAction.message, sourceAction.includeWeb);
}

onMounted(async () => {
  await fetchSource();
  if (import.meta.client) {
    jotterText.value = localStorage.getItem(jotterStorageKey.value) || "";
  }
  const initialAction = intake.action
    ? sourceActionMessages[intake.action]
    : null;
  if (initialAction && sourceId.value && import.meta.client) {
    const hasSentInitial = sessionStorage.getItem(initialSourceActionKey.value);
    if (!hasSentInitial) {
      sessionStorage.setItem(initialSourceActionKey.value, "1");
      void callSourceChat(initialAction.message, initialAction.includeWeb);
    }
  }
  void pollJobIfNeeded();
});

watch(jotterText, (value) => {
  if (!import.meta.client) return;
  localStorage.setItem(jotterStorageKey.value, value);
});
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-7rem)] max-w-7xl flex-col gap-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="rounded-xl"
          @click="router.push('/dashboard')"
        />
        <div class="min-w-0">
          <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">
            Temporary source chat
          </p>
          <h1 class="ga-heading truncate font-serif text-2xl font-semibold sm:text-4xl">
            {{ sourceTitle }}
          </h1>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UBadge color="neutral" variant="soft" class="rounded-full">
          {{ sourceKind }}
        </UBadge>
        <UBadge
          v-if="jobStatus && jobStatus !== 'completed'"
          color="warning"
          variant="soft"
          class="rounded-full"
        >
          {{ jobStatus }}
        </UBadge>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <section class="ga-surface min-h-[420px] overflow-hidden rounded-[2rem] border">
        <div
          class="flex items-center justify-between border-b border-[var(--ga-border)] px-5 py-4"
        >
          <div>
            <p class="ga-heading text-sm font-semibold">
              {{ sourceKind }}
            </p>
            <p class="ga-subtle text-xs">
              Source is kept separate until you explicitly create a note.
            </p>
          </div>
          <UButton
            v-if="source?.fileUrl || source?.url"
            :to="source.fileUrl || source.url || undefined"
            target="_blank"
            icon="i-lucide-external-link"
            label="Open"
            color="neutral"
            variant="ghost"
            class="rounded-xl"
          />
        </div>

        <div v-if="isLoadingSource" class="p-5">
          <USkeleton class="h-8 w-2/3 rounded-xl" />
          <USkeleton class="mt-4 h-64 rounded-2xl" />
        </div>

        <div v-else class="h-full overflow-y-auto p-5">
          <div
            v-if="sourceKind === 'PDF source'"
            class="mb-4 rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ga-warm-soft)] text-[var(--ga-warm)]"
              >
                <UIcon name="i-lucide-file-text" class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <p class="ga-heading truncate text-sm font-semibold">
                  {{ source?.fileName || sourceTitle }}
                </p>
                <p class="ga-subtle text-xs">
                  PDF source attached. Chat can use extracted content when ready.
                </p>
              </div>
            </div>
          </div>

          <article
            class="prose prose-sm max-w-none whitespace-pre-wrap text-[var(--ga-text)] prose-headings:text-[var(--ga-text-strong)] prose-p:leading-7"
          >
            {{ sourceText }}
          </article>

          <div
            class="mt-5 rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-4"
          >
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <p class="ga-heading text-sm font-semibold">
                  AI study jotter
                </p>
                <p class="ga-subtle text-xs">
                  Keep your own working notes while the source stays read-only.
                </p>
              </div>
              <UBadge color="neutral" variant="soft" class="rounded-full">
                Local draft
              </UBadge>
            </div>
            <UTextarea
              v-model="jotterText"
              :rows="8"
              autoresize
              :maxrows="16"
              placeholder="Write key points, questions, examples, or things GapAI should help clarify..."
              class="w-full"
              :ui="{
                base: 'border-0 bg-[var(--ga-surface)] text-[16px] leading-7 shadow-none ring-0 focus:ring-0 lg:text-sm',
              }"
            />
          </div>
        </div>
      </section>

      <section class="ga-surface flex min-h-[520px] flex-col rounded-[2rem] border">
        <div class="border-b border-[var(--ga-border)] px-5 py-4">
          <p class="ga-heading text-sm font-semibold">GapAI source companion</p>
          <p class="ga-subtle text-xs">
            Ask about this source without turning it into a note yet.
          </p>
          <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
            <UButton
              v-for="action in sourceWorkspaceActions"
              :key="action.action"
              :label="action.label"
              :icon="action.icon"
              color="neutral"
              variant="outline"
              size="sm"
              class="shrink-0 rounded-xl"
              :loading="isSubmitting"
              @click="handleSourceWorkspaceAction(action)"
            />
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <div class="space-y-4">
            <div
              v-for="message in intake.messages"
              :key="message.id"
              :class="[
                'rounded-3xl px-4 py-3 text-sm leading-6',
                message.role === 'user'
                  ? 'ml-auto max-w-[88%] bg-[var(--ga-primary)] text-[#fffaf0]'
                  : 'mr-auto max-w-[94%] border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] text-[var(--ga-text)]',
              ]"
            >
              <div
                v-if="message.role === 'assistant'"
                class="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0"
                v-html="renderChatMarkdown(message.content)"
              />
              <p v-else class="whitespace-pre-wrap">{{ message.content }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="intake.visibleSuggestedActionItems.length"
          class="border-t border-[var(--ga-border)] px-4 py-3"
        >
          <div class="flex gap-2 overflow-x-auto">
            <UTooltip
              v-for="suggestion in intake.visibleSuggestedActionItems"
              :key="`${suggestion.mode}-${suggestion.action}-${suggestion.label}`"
              :text="suggestion.description || suggestion.mode"
            >
              <UButton
                :label="suggestion.label"
                color="neutral"
                variant="outline"
                class="shrink-0 rounded-xl"
                @click="handleSuggestedAction(suggestion)"
              />
            </UTooltip>
          </div>
        </div>

        <form
          class="border-t border-[var(--ga-border)] p-3"
          @submit.prevent="callSourceChat()"
        >
          <div class="rounded-[1.5rem] bg-[var(--ga-surface-soft)] p-2">
            <UTextarea
              v-model="input"
              :rows="2"
              autoresize
              :maxrows="6"
              placeholder="Ask about this source..."
              class="w-full"
              :ui="{
                base: 'border-0 bg-transparent px-2 py-1 text-[16px] shadow-none focus:ring-0 lg:text-sm',
              }"
              @keydown.enter.exact.prevent="callSourceChat()"
            />
            <div class="mt-2 flex justify-end">
              <UButton
                icon="i-lucide-arrow-up"
                type="submit"
                color="primary"
                class="rounded-xl"
                :loading="isSubmitting"
                :disabled="isSubmitting || !input.trim()"
              />
            </div>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
