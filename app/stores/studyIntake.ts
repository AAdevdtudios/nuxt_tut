import { defineStore } from "pinia";

export type IntakeAction =
  | "create-note"
  | "explain"
  | "summarize"
  | "improve"
  | "research-more"
  | "study-guide"
  | "add-material"
  | "diagnostic"
  | (string & {});

export type SuggestedActionMode =
  | "temporary-chat"
  | "create-note"
  | "upload-material"
  | "needs-material"
  | "note-chat"
  | "note-action"
  | "study-guide"
  | (string & {});

export type SuggestedActionItem = {
  label: string;
  action: string;
  mode: string;
  message?: string | null;
  requiresNote: boolean;
  requiresFile: boolean;
  description: string;
  topic?: string | null;
  level?: string | null;
  studyArea?: string | null;
  goal?: string | null;
};

export type NotesIntakeResponse = {
  jobId?: string | null;
  noteId?: string | null;
  sourceLibraryItemId?: string | null;
  action?: string | null;
  status?: string | null;
  message?: string | null;
  shouldCreateNote?: boolean;
  suggestedTitle?: string | null;
  viewMode?: string | null;
  suggestedActions?: string[];
  suggestedActionItems?: SuggestedActionItem[];
};

export type TemporaryChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function createMessageId(role: TemporaryChatMessage["role"], count: number) {
  return `${role}-${Date.now()}-${count}`;
}

export function appendSuggestedAction(
  form: FormData,
  item: SuggestedActionItem,
  conversationContext?: string,
) {
  form.append("Action", item.action);

  if (item.message) form.append("Message", item.message);
  if (item.topic) form.append("Topic", item.topic);
  if (item.level) form.append("Level", item.level);
  if (item.studyArea) form.append("StudyArea", item.studyArea);
  if (item.goal) form.append("Goal", item.goal);
  if (conversationContext) {
    form.append("ConversationContext", conversationContext);
  }
}

export function isSavedNoteViewMode(viewMode?: string | null) {
  return (
    viewMode === "note-editor" ||
    viewMode === "source-backed-note" ||
    viewMode === "document-browser" ||
    viewMode === "study-guide"
  );
}

function normalizeSuggestedActionItem(
  item: Partial<SuggestedActionItem>,
): SuggestedActionItem | null {
  if (!item.label || !item.action || !item.mode) return null;

  return {
    label: item.label,
    action: item.action,
    mode: item.mode,
    message: item.message ?? null,
    requiresNote: Boolean(item.requiresNote),
    requiresFile: Boolean(item.requiresFile),
    description: item.description || item.mode,
    topic: item.topic ?? null,
    level: item.level ?? null,
    studyArea: item.studyArea ?? null,
    goal: item.goal ?? null,
  };
}

export const useStudyIntakeStore = defineStore(
  "study-intake",
  {
    state: () => ({
      title: "GapAI study assistant",
      viewMode: "chat" as string | null,
      jobId: null as string | null,
      noteId: null as string | null,
      sourceLibraryItemId: null as string | null,
      status: null as string | null,
      action: null as string | null,
      messages: [] as TemporaryChatMessage[],
      suggestedActions: [] as string[],
      suggestedActionItems: [] as SuggestedActionItem[],
    }),
    getters: {
      conversationContext(state) {
        return state.messages
          .slice(-8)
          .map((message) => {
            const speaker = message.role === "user" ? "User" : "Assistant";
            return `${speaker}: ${message.content}`;
          })
          .join("\n");
      },
      visibleSuggestedActionItems(state): SuggestedActionItem[] {
        return state.suggestedActionItems;
      },
    },
    actions: {
      reset() {
        this.title = "GapAI study assistant";
        this.viewMode = "chat";
        this.jobId = null;
        this.noteId = null;
        this.sourceLibraryItemId = null;
        this.status = null;
        this.action = null;
        this.messages = [];
        this.suggestedActions = [];
        this.suggestedActionItems = [];
      },
      appendMessage(role: TemporaryChatMessage["role"], content: string) {
        this.messages.push({
          id: createMessageId(role, this.messages.length),
          role,
          content,
        });
      },
      applyResponse(response: NotesIntakeResponse, userMessage?: string | null) {
        this.title =
          response.suggestedTitle ||
          this.title ||
          "GapAI study assistant";
        this.viewMode = response.viewMode || this.viewMode || "chat";
        this.jobId = response.jobId || null;
        this.noteId = response.noteId || null;
        this.sourceLibraryItemId =
          response.sourceLibraryItemId || this.sourceLibraryItemId || null;
        this.status = response.status || null;
        this.action = response.action || null;
        this.suggestedActions = response.suggestedActions || [];
        this.suggestedActionItems = (response.suggestedActionItems || [])
          .map(normalizeSuggestedActionItem)
          .filter((item): item is SuggestedActionItem => Boolean(item));

        if (userMessage) {
          this.appendMessage("user", userMessage);
        }

        if (response.message) {
          this.appendMessage("assistant", response.message);
        }
      },
      start(response: NotesIntakeResponse, userMessage?: string | null) {
        this.reset();
        this.applyResponse(response, userMessage);
      },
    },
    persist: true,
  },
);
