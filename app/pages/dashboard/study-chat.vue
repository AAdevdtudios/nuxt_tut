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
import { renderChatMarkdown } from "~/utils/chatMarkdown";

definePageMeta({ layout: "newdash" });

const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const intake = useStudyIntakeStore();

const input = ref("");
const isSubmitting = ref(false);
const pendingUploadAction = ref<SuggestedActionItem | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const selectedLink = ref("");

const hasSession = computed(() => intake.messages.length > 0);
const title = computed(() => intake.title || "GapAI study assistant");

function openFilePicker() {
  fileInput.value?.click();
}

function handleFileChange(files: FileList | null) {
  const file = files?.[0];
  if (!file) return;
  selectedFile.value = file;

  if (pendingUploadAction.value) {
    const action = pendingUploadAction.value;
    pendingUploadAction.value = null;
    void submitIntake(action, action.message || input.value || file.name);
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

  if (response?.viewMode === "source-chat") {
    await router.push("/dashboard/source-chat");
  }
}

async function submitIntake(
  itemOrAction?: SuggestedActionItem | IntakeAction | null,
  messageOverride?: string | null,
) {
  const item =
    typeof itemOrAction === "object" && itemOrAction !== null
      ? itemOrAction
      : null;
  const action =
    item?.action ||
    (typeof itemOrAction === "string" ? itemOrAction : "explain");
  const message = (messageOverride ?? input.value).trim();

  if (!message && !selectedFile.value && !selectedLink.value.trim()) {
    toast.add({
      title: "Add a follow-up",
      description: "Type a reply, paste a link, or attach a source.",
      color: "warning",
    });
    return;
  }

  const form = new FormData();
  if (item) {
    appendSuggestedAction(form, item, intake.conversationContext);
  } else {
    form.append("Action", action);
    if (message) form.append("Message", message);
    if (intake.conversationContext) {
      form.append("ConversationContext", intake.conversationContext);
    }
  }
  if (selectedFile.value) form.append("File", selectedFile.value);
  if (selectedLink.value.trim()) form.append("Links", selectedLink.value.trim());

  try {
    isSubmitting.value = true;
    const response = await $api.mutate<NotesIntakeResponse>("/api/notes/intake", {
      method: "POST",
      body: form,
    });
    await routeFromResponse(
      response,
      message || selectedFile.value?.name || selectedLink.value || item?.label || "Continue",
    );
    input.value = "";
    selectedFile.value = null;
    selectedLink.value = "";
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

function handleSuggestedAction(item: SuggestedActionItem) {
  if (item.mode === "upload-material") {
    pendingUploadAction.value = item;
    if (item.message) input.value = item.message;
    openFilePicker();
    return;
  }

  if (item.mode === "needs-material") {
    intake.appendMessage("user", item.label);
    intake.appendMessage(
      "assistant",
      item.description ||
        "This needs a note or source first. Add material or create a note, then try again.",
    );
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

  void submitIntake(item, item.message || item.label);
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col gap-5">
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
            Temporary study chat
          </p>
          <h1 class="ga-heading truncate font-serif text-2xl font-semibold sm:text-4xl">
            {{ title }}
          </h1>
        </div>
      </div>
      <UBadge color="neutral" variant="soft" class="rounded-full">
        No note created yet
      </UBadge>
    </header>

    <section
      v-if="!hasSession"
      class="ga-surface flex flex-1 flex-col items-center justify-center rounded-[2rem] border p-8 text-center"
    >
      <UIcon name="i-lucide-message-circle" class="ga-icon h-10 w-10" />
      <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">
        Start from the dashboard
      </h2>
      <p class="ga-muted mt-2 max-w-md text-sm leading-6">
        Temporary chats are created by the intake flow. Go back and enter a
        topic, source, or question to begin.
      </p>
      <UButton
        label="Back to dashboard"
        icon="i-lucide-arrow-left"
        color="primary"
        class="mt-5 rounded-xl"
        @click="router.push('/dashboard')"
      />
    </section>

    <template v-else>
      <section
        class="ga-surface min-h-0 flex-1 overflow-y-auto rounded-[2rem] border p-4 sm:p-6"
      >
        <div class="mx-auto max-w-3xl space-y-4">
          <div
            v-for="message in intake.messages"
            :key="message.id"
            :class="[
              'rounded-3xl px-4 py-3 text-sm leading-6 sm:px-5',
              message.role === 'user'
                ? 'ml-auto max-w-[86%] bg-[var(--ga-primary)] text-[#fffaf0]'
                : 'mr-auto max-w-[92%] border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] text-[var(--ga-text)]',
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
      </section>

      <section
        v-if="intake.visibleSuggestedActionItems.length"
        class="ga-surface rounded-3xl border p-3"
      >
        <p class="ga-subtle mb-2 px-1 text-xs font-semibold">
          Suggested next actions
        </p>
        <div class="flex gap-2 overflow-x-auto pb-1">
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
      </section>

      <form
        class="ga-surface rounded-[1.75rem] border p-3"
        @submit.prevent="submitIntake()"
      >
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept=".pdf,.docx,.txt,.md,.markdown"
          @change="handleFileChange(($event.target as HTMLInputElement).files)"
        />
        <div class="flex flex-wrap gap-2 pb-2">
          <UBadge v-if="selectedFile" color="neutral" variant="soft">
            {{ selectedFile.name }}
          </UBadge>
          <UBadge v-if="selectedLink" color="neutral" variant="soft">
            {{ selectedLink }}
          </UBadge>
        </div>
        <UTextarea
          v-model="input"
          :rows="2"
          autoresize
          :maxrows="6"
          placeholder="Reply with more detail, ask a question, or tell GapAI what you need next..."
          class="w-full"
          :ui="{
            base: 'border-0 bg-transparent px-2 py-1 text-[16px] shadow-none focus:ring-0 lg:text-sm',
          }"
          @keydown.enter.exact.prevent="submitIntake()"
        />
        <div class="mt-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-paperclip"
              color="neutral"
              variant="ghost"
              class="rounded-xl"
              @click="openFilePicker"
            />
            <UPopover>
              <UButton
                icon="i-lucide-link"
                color="neutral"
                variant="ghost"
                class="rounded-xl"
              />
              <template #content>
                <div class="w-80 p-3">
                  <UInput
                    v-model="selectedLink"
                    placeholder="Paste a source link"
                    icon="i-lucide-link"
                  />
                </div>
              </template>
            </UPopover>
          </div>
          <UButton
            icon="i-lucide-arrow-up"
            type="submit"
            color="primary"
            class="rounded-xl"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          />
        </div>
      </form>
    </template>
  </div>
</template>
