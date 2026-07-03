<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
// import { useDebounceFn } from "@vueuse/core";
import type { LibraryItem, LibrarySingleResponse } from "~/types";
import { renderChatMarkdown } from "~/utils/chatMarkdown";

definePageMeta({
  layout: "newdash",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const TABLE_FEATURES_ENABLED = false;
const MAX_CONTENT_LENGTH = 10000;
const MAX_NOTE_IMAGES = 6;

const noteId = computed(() => String(route.params.id || "new"));
const isNewNote = computed(() => noteId.value === "new");
const currentBackendNoteId = ref<string | null>(null);
const companionEnabled = computed(() => route.query.companion === "note");
const companionTopic = computed(() => {
  if (typeof route.query.topic === "string" && route.query.topic.trim()) {
    return route.query.topic.trim();
  }

  return title.value.trim() && title.value !== "Untitled"
    ? title.value
    : "your study note";
});
const routeSuggestedTitle = computed(() =>
  typeof route.query.suggestedTitle === "string"
    ? route.query.suggestedTitle.trim()
    : "",
);

const buildCompanionDraft = () => {
  if (!companionEnabled.value) return "";
  const topic = companionTopic.value;
  const brief =
    typeof route.query.brief === "string" && route.query.brief.trim()
      ? route.query.brief.trim()
      : "Build a clear note that supports understanding and revision.";

  return `# ${topic}

## Learning Goal
${brief}

## Core Idea
Start by explaining the topic in your own words. Keep the definition short enough to revise quickly, but clear enough that it still makes sense later.

## Key Concepts
- Add the first important idea here.
- Connect it to a useful example.
- Record anything that still feels unclear.

## Check My Understanding
1. Can I explain the main idea without looking at the source?
2. Which example makes the concept easier to remember?
3. What should I ask GapAI to clarify next?`;
};

type NoteAiOperation =
  | "explain"
  | "rephrase"
  | "summarize"
  | "expand"
  | "simplify"
  | "improve"
  | "fix-grammar"
  | "questions"
  | "custom";
type NoteAiScope = "selection" | "document";
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
type NoteAiApplyMode =
  | "return-only"
  | "replace-selection"
  | "replace-document"
  | "append";

interface NoteAiTransformResponse {
  noteId?: string;
  title?: string;
  operation?: NoteAiOperation;
  scope?: NoteAiScope;
  applyMode?: NoteAiApplyMode;
  applied?: boolean;
  content?: string;
  updatedNoteContent?: string | null;
  sources?: Array<Record<string, unknown>>;
  toolsUsed?: Array<Record<string, unknown>>;
}

interface NoteAiDraftResponse {
  noteId?: string;
  title?: string;
  content?: string;
  saved?: boolean;
  sources?: Array<Record<string, unknown>>;
  toolsUsed?: Array<Record<string, unknown>>;
}

type NoteTab = "work-note" | "study-guide" | "sources";
type SourceStatus = "ready" | "processing" | "partial" | "failed" | "needs-ocr";

interface NoteSource {
  id?: string;
  type?: string;
  title?: string;
  url?: string;
  status?: SourceStatus | string;
  processedPageCount?: number;
  pageCount?: number;
  error?: string | null;
}

interface NoteWorkspaceResponse {
  id?: string;
  title?: string;
  markdown?: string;
  noteKind?: "work-note" | "study-guide" | string;
  parentNoteId?: string | null;
  sourceLibraryItemId?: string | null;
  studyGuideNoteId?: string | null;
  ingestionStatus?: SourceStatus | string | null;
  ingestionError?: string | null;
  sources?: NoteSource[];
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

interface NoteJobResponse {
  jobId?: string;
  noteId?: string;
  resultNoteId?: string | null;
  action?: string;
  status?: "pending" | "running" | "completed" | "failed" | string;
  progress?: number;
  message?: string;
  note?: NoteWorkspaceResponse;
  resultNote?: NoteWorkspaceResponse;
}

interface NoteChatResponse {
  sessionId?: string;
  answer?: string;
  citations?: unknown[];
  sources?: unknown[];
  toolsUsed?: unknown[];
}

interface NoteChatSession {
  sessionId?: string;
  id?: string;
  title?: string;
  name?: string;
  messageCount?: number;
  count?: number;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

interface NoteChatMessage {
  messageId?: string;
  id?: string;
  role?: "user" | "assistant" | string;
  content?: string;
  createdAtUtc?: string;
}

interface NoteChatMessagesResponse {
  noteId?: string;
  sessionId?: string;
  count?: number;
  items?: NoteChatMessage[];
}

interface NoteChatUiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  selectedText?: string;
  expandedSelectedText?: boolean;
}

const title = ref("");
const titleDraft = ref("");
const content = ref("");
const activeNoteTab = ref<NoteTab>("work-note");
const noteApiMode = ref(false);
const noteKind = ref<"work-note" | "study-guide" | string>("work-note");
const studyGuideNoteId = ref<string | null>(null);
const studyGuideMarkdown = ref("");
const sourceLibraryItemId = ref<string | null>(null);
const ingestionStatus = ref<SourceStatus | string | null>(null);
const ingestionError = ref<string | null>(null);
const noteSources = ref<NoteSource[]>([]);
const activeNoteJobId = ref<string | null>(null);
const noteJobStatus = ref<string | null>(null);
const noteJobProgress = ref(0);
const noteJobMessage = ref("");
const isStudyGuideGenerating = ref(false);
const noteChatSessionId = ref<string | null>(null);
const noteChatInput = ref("");
const noteChatSelectedText = ref("");
const noteChatInputRef = ref<any>(null);
type NoteCompanionAction =
  | "ask"
  | "explain"
  | "improve"
  | "research-more"
  | "study-guide";
type AutoNoteAction = "explain" | "summarize" | "research-more";
const selectedNoteCompanionAction = ref<NoteCompanionAction>("ask");
const hasRunAutoNoteAction = ref(false);
const routeAutoNoteAction = computed<AutoNoteAction | null>(() => {
  const action = route.query.autoNoteAction;
  if (
    action === "explain" ||
    action === "summarize" ||
    action === "research-more"
  ) {
    return action;
  }

  return null;
});
const isNoteChatSending = ref(false);
const noteChatMessages = ref<NoteChatUiMessage[]>([
  {
    id: "intro",
    role: "assistant",
    content:
      "I can explain this note, improve it, summarise it, or help you build a study guide.",
  },
]);
const noteContentType = ref<"html" | "markdown">("markdown");
const isLoading = ref(false);
const isSaving = ref(false);
const isWorkspaceHeaderCollapsed = ref(false);
const hasPendingSave = ref(false);
const saveSequence = ref(0);
const isEditingTitle = ref(false);
const saveState = ref<"idle" | "saving" | "saved" | "error">("idle");
const lastSavedAt = ref<string | null>(null);
const hasInitialized = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const editorSurfaceRef = ref<HTMLElement | null>(null);
const editorInstance = shallowRef<any>(null);
const lastSelection = shallowRef<{ from: number; to: number } | null>(null);
const selectionActions = ref({
  visible: false,
  left: 0,
  top: 0,
  text: "",
});
type SelectionActionId = "summary" | "rephrase" | "ask";

const selectionActionItems: Array<{ id: SelectionActionId; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "rephrase", label: "Rephrase" },
  { id: "ask", label: "Ask" },
];
const transformOperationOptions: Array<{
  label: string;
  value: NoteAiOperation;
  instruction: string;
  emptyLabel: string;
  applyLabel: string;
}> = [
  {
    label: "Rephrase",
    value: "rephrase",
    instruction: "Provide one clear replacement for this text.",
    emptyLabel: "No rephrase option returned.",
    applyLabel: "Use rewrite",
  },
  {
    label: "Improve writing",
    value: "improve",
    instruction:
      "Improve clarity, flow, and academic tone while preserving the meaning.",
    emptyLabel: "No improvement returned.",
    applyLabel: "Use improved text",
  },
  {
    label: "Simplify",
    value: "simplify",
    instruction:
      "Simplify this text so it is easier for a student to understand.",
    emptyLabel: "No simplified version returned.",
    applyLabel: "Use simplified text",
  },
  {
    label: "Expand",
    value: "expand",
    instruction:
      "Expand this text with useful explanation, context, and examples.",
    emptyLabel: "No expanded version returned.",
    applyLabel: "Use expanded text",
  },
  {
    label: "Fix grammar",
    value: "fix-grammar",
    instruction:
      "Fix grammar, spelling, punctuation, and sentence structure only.",
    emptyLabel: "No grammar fix returned.",
    applyLabel: "Use corrected text",
  },
  {
    label: "Generate questions",
    value: "questions",
    instruction:
      "Generate useful study questions from this text with concise answers.",
    emptyLabel: "No questions returned.",
    applyLabel: "Add questions",
  },
];
const selectedTransformConfig = computed(
  () =>
    transformOperationOptions.find(
      (item) => item.value === selectedTransformOperation.value,
    ) || transformOperationOptions[0]!,
);
const aiPanelTitle = computed(() => {
  if (aiPanelMode.value === "summary") {
    return aiPanelScope.value === "document" ? "Note summary" : "Summary";
  }

  if (aiPanelMode.value === "rephrase") {
    return selectedTransformConfig.value.label;
  }

  return "Ask AI";
});
const aiPanelDescription = computed(() => {
  if (aiPanelMode.value === "summary") {
    return aiPanelScope.value === "document"
      ? "Generated summary for the full note."
      : "Generated summary for your selected text.";
  }

  if (aiPanelMode.value === "rephrase") {
    return aiPanelScope.value === "document"
      ? "Preview an AI change for the full note before applying it."
      : "Preview an AI change for your selected text before applying it.";
  }

  return "Chat using your highlighted text as context.";
});
const emojiMenuItems = [
  {
    name: "Grinning face",
    emoji: "😀",
    shortcodes: ["grinning"],
    tags: ["smile", "happy", "face"],
  },
  {
    name: "Smiling face with open mouth",
    emoji: "😄",
    shortcodes: ["smile"],
    tags: ["happy", "joy"],
  },
  {
    name: "Face with tears of joy",
    emoji: "😂",
    shortcodes: ["joy"],
    tags: ["laugh", "funny"],
  },
  {
    name: "Smiling face with hearts",
    emoji: "🥰",
    shortcodes: ["smiling_face_with_hearts"],
    tags: ["love", "heart"],
  },
  {
    name: "Thumbs up",
    emoji: "👍",
    shortcodes: ["thumbsup", "thumbs_up"],
    tags: ["ok", "yes", "good"],
  },
  {
    name: "Clapping hands",
    emoji: "👏",
    shortcodes: ["clap"],
    tags: ["applause"],
  },
  {
    name: "Raised hands",
    emoji: "🙌",
    shortcodes: ["raised_hands"],
    tags: ["celebrate", "hooray"],
  },
  {
    name: "Folded hands",
    emoji: "🙏",
    shortcodes: ["pray"],
    tags: ["thanks", "please"],
  },
  { name: "Fire", emoji: "🔥", shortcodes: ["fire"], tags: ["lit", "hot"] },
  {
    name: "Sparkles",
    emoji: "✨",
    shortcodes: ["sparkles"],
    tags: ["shine", "star"],
  },
  {
    name: "Rocket",
    emoji: "🚀",
    shortcodes: ["rocket"],
    tags: ["launch", "ship"],
  },
  {
    name: "Light bulb",
    emoji: "💡",
    shortcodes: ["bulb", "idea"],
    tags: ["idea", "think"],
  },
  {
    name: "Check mark",
    emoji: "✅",
    shortcodes: ["check"],
    tags: ["done", "success"],
  },
  {
    name: "Cross mark",
    emoji: "❌",
    shortcodes: ["x"],
    tags: ["cancel", "no"],
  },
  {
    name: "Warning",
    emoji: "⚠️",
    shortcodes: ["warning"],
    tags: ["alert", "caution"],
  },
  {
    name: "Calendar",
    emoji: "📅",
    shortcodes: ["calendar"],
    tags: ["date", "schedule"],
  },
  { name: "Memo", emoji: "📝", shortcodes: ["memo"], tags: ["note", "write"] },
  {
    name: "Books",
    emoji: "📚",
    shortcodes: ["books"],
    tags: ["study", "read"],
  },
  { name: "Link", emoji: "🔗", shortcodes: ["link"], tags: ["url", "connect"] },
  {
    name: "Globe",
    emoji: "🌍",
    shortcodes: ["earth"],
    tags: ["world", "global"],
  },
];

const activeSelectionAction = ref<SelectionActionId | null>(null);
const isAiPanelOpen = ref(false);
const aiPanelMode = ref<SelectionActionId | null>(null);
const aiPanelScope = ref<NoteAiScope>("selection");
const aiPanelSourceText = ref("");
const aiPanelSourceSelection = shallowRef<{ from: number; to: number } | null>(
  null,
);
const isSummaryLoading = ref(false);
const summaryResult = ref("");
const isRephraseLoading = ref(false);
const rephraseOptions = ref<string[]>([]);
const selectedRephraseText = ref<string | null>(null);
const selectedTransformOperation = ref<NoteAiOperation>("rephrase");
const isAskLoading = ref(false);
const askInput = ref("");
const tutorMode = ref(false);
const isModelsLoading = ref(false);
const selectedAskModel = ref("");
const askModels = ref<Array<{ label: string; value: string }>>([]);
const askMessages = ref<
  Array<{ id: string; role: "user" | "assistant"; content: string }>
>([]);
const isDraftModalOpen = ref(false);
const isDraftingNote = ref(false);
const draftForm = reactive({
  title: "",
  prompt: "",
  context: "",
  urls: "",
  includeWeb: false,
});
const isTableMenuOpen = ref(false);
const isTextColorMenuOpen = ref(false);
const selectedTextColor = ref("#2563eb");
const tableConfig = reactive({
  rows: 3,
  columns: 3,
  withHeaderRow: true,
});
const tableInlineControls = reactive({
  visible: false,
  left: 0,
  top: 0,
  isHeader: false,
});
const tableEndAddControl = reactive({
  visible: false,
  left: 0,
  top: 0,
});
const activeTableColumnIndex = ref<number | null>(null);
const isInlineTableMoreOpen = ref(false);
const highlightedTableElement = ref<HTMLTableElement | null>(null);
const highlightedTableColumnIndex = ref<number | null>(null);
const dragHandleNodePos = ref<number | null>(null);
const lastTableSelectionPos = ref<number | null>(null);
const isInsertBlockMenuOpen = ref(false);
const isMoreBlockMenuOpen = ref(false);
const slashCommandItems = [
  [
    {
      type: "label" as const,
      label: "Basic blocks",
    },
    {
      label: "Paragraph",
      description: "Start writing plain text",
      icon: "i-lucide-pilcrow",
      kind: "paragraph",
    },
    {
      label: "Heading 1",
      description: "Large section heading",
      icon: "i-lucide-heading-1",
      kind: "heading",
      level: 1,
    },
    {
      label: "Heading 2",
      description: "Medium section heading",
      icon: "i-lucide-heading-2",
      kind: "heading",
      level: 2,
    },
    {
      label: "Heading 3",
      description: "Small section heading",
      icon: "i-lucide-heading-3",
      kind: "heading",
      level: 3,
    },
  ],
  [
    {
      type: "label" as const,
      label: "Structure",
    },
    {
      label: "Bullet list",
      description: "Create a bullet list",
      icon: "i-lucide-list",
      kind: "bulletList",
    },
    {
      label: "Numbered list",
      description: "Create a numbered list",
      icon: "i-lucide-list-ordered",
      kind: "orderedList",
    },
    {
      label: "Quote",
      description: "Insert a blockquote",
      icon: "i-lucide-text-quote",
      kind: "blockquote",
    },
    {
      label: "Code block",
      description: "Insert a code block",
      icon: "i-lucide-square-code",
      kind: "codeBlock",
    },
    {
      label: "Divider",
      description: "Insert a horizontal divider",
      icon: "i-lucide-minus",
      kind: "horizontalRule",
    },
  ],
];
const bubbleToolbarItems = [
  {
    icon: "i-lucide-bold",
    kind: "mark",
    mark: "bold",
    tooltip: { text: "Bold" },
  },
  {
    icon: "i-lucide-italic",
    kind: "mark",
    mark: "italic",
    tooltip: { text: "Italic" },
  },
  {
    icon: "i-lucide-strikethrough",
    kind: "mark",
    mark: "strike",
    tooltip: { text: "Strike" },
  },
  {
    icon: "i-lucide-code",
    kind: "mark",
    mark: "code",
    tooltip: { text: "Inline code" },
  },
  { icon: "i-lucide-link", kind: "link", tooltip: { text: "Link" } },
  {
    icon: "i-lucide-sparkles",
    kind: "summaryAi",
    tooltip: { text: "Add passage and summarize" },
  },
  {
    icon: "i-lucide-refresh-cw",
    kind: "rephraseAi",
    tooltip: { text: "Rephrase" },
  },
  { icon: "i-lucide-message-circle", kind: "askAi", tooltip: { text: "Ask" } },
  {
    icon: "i-lucide-eraser",
    kind: "clearFormatting",
    tooltip: { text: "Clear formatting" },
  },
];
const dragHandleInsertItems = computed(() => [
  {
    label: "Text",
    icon: "i-lucide-pilcrow",
    onSelect: () => setParagraphFromHandle(),
  },
  {
    label: "Heading 1",
    icon: "i-lucide-heading-1",
    onSelect: () => setHeadingFromHandle(1),
  },
  {
    label: "Heading 2",
    icon: "i-lucide-heading-2",
    onSelect: () => setHeadingFromHandle(2),
  },
  {
    label: "Bullet list",
    icon: "i-lucide-list",
    onSelect: () => setBulletListFromHandle(),
  },
  {
    label: "Code block",
    icon: "i-lucide-square-code",
    onSelect: () => setCodeBlockFromHandle(),
  },
  ...(TABLE_FEATURES_ENABLED
    ? [
        {
          label: "Insert table",
          icon: "i-lucide-table-2",
          onSelect: () => insertTable(),
        },
      ]
    : []),
]);
const isDragHandleOnTable = computed(() => {
  const editor = editorInstance.value;
  const pos = dragHandleNodePos.value;
  if (!editor || pos === null || pos === undefined) return false;
  return editor.state.doc.nodeAt(pos)?.type?.name === "table";
});
const dragHandleMoreItems = computed(() => {
  const items: any[] = [
    { type: "label" as const, label: "Block" },
    {
      label: "Move up",
      icon: "i-lucide-arrow-up",
      onSelect: () => moveDragHandleNode("up"),
    },
    {
      label: "Move down",
      icon: "i-lucide-arrow-down",
      onSelect: () => moveDragHandleNode("down"),
    },
    {
      label: "Duplicate block",
      icon: "i-lucide-copy",
      onSelect: () => duplicateDragHandleNode(),
    },
  ];

  if (TABLE_FEATURES_ENABLED && isDragHandleOnTable.value) {
    items.push(
      { type: "separator" as const },
      { type: "label" as const, label: "Table" },
      {
        label: "Add row",
        icon: "i-lucide-rows-3",
        onSelect: () => addTableRow(),
      },
      {
        label: "Remove row",
        icon: "i-lucide-minus",
        onSelect: () => removeTableRow(),
      },
      {
        label: "Add column",
        icon: "i-lucide-columns-2",
        onSelect: () => addTableColumn(),
      },
      {
        label: "Remove column",
        icon: "i-lucide-columns-3",
        onSelect: () => removeTableColumn(),
      },
      {
        label: "Toggle header row",
        icon: "i-lucide-heading-1",
        onSelect: () => toggleTableHeader(),
      },
      {
        label: "Delete table",
        icon: "i-lucide-table-2",
        color: "error",
        onSelect: () => deleteTable(),
      },
    );
  }

  items.push(
    { type: "separator" as const },
    {
      label: "Delete block",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => deleteDragHandleNode(),
    },
  );

  return items;
});
const inlineTableMoreItems = computed<any[]>(() => [
  { type: "label" as const, label: "Table" },
  { label: "Add row", icon: "i-lucide-rows-3", onSelect: () => addTableRow() },
  {
    label: "Remove row",
    icon: "i-lucide-minus",
    onSelect: () => removeTableRow(),
  },
  {
    label: "Add column before",
    icon: "i-lucide-columns-2",
    onSelect: () => addTableColumnBefore(),
  },
  {
    label: "Add column after",
    icon: "i-lucide-columns-3",
    onSelect: () => addTableColumnAfter(),
  },
  {
    label: "Remove column",
    icon: "i-lucide-columns-4",
    onSelect: () => removeTableColumn(),
  },
  {
    label: "Toggle header row",
    icon: "i-lucide-heading-1",
    onSelect: () => toggleTableHeader(),
  },
  { type: "separator" as const },
  {
    label: "Delete table",
    icon: "i-lucide-table-2",
    color: "error",
    onSelect: () => deleteTable(),
  },
]);
const editorExtensions = [
  TextStyle,
  Color,
  ...(TABLE_FEATURES_ENABLED
    ? [
        Table.configure({
          resizable: true,
          allowTableNodeSelection: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ]
    : []),
];

const openAiPanelForSelection = (
  action: SelectionActionId,
  editor?: any,
  operation: NoteAiOperation = "rephrase",
) => {
  const selectedText = editor
    ? getSelectedText(editor)
    : selectionActions.value.text;
  if (!selectedText) {
    toast.add({
      title: "Select text first",
      description: "Highlight text before using AI actions.",
      color: "warning",
    });
    return;
  }

  noteChatSelectedText.value = selectedText;
  selectedNoteCompanionAction.value = action === "ask" ? "explain" : "improve";
  noteChatInput.value =
    action === "summary"
      ? "Summarise this selected passage."
      : action === "ask"
        ? "Explain this selected passage."
        : operation === "improve"
          ? "Improve this selected passage."
          : operation === "fix-grammar"
            ? "Improve the grammar and clarity of this selected passage."
            : "Improve this selected passage.";
  nextTick(() => {
    noteChatInputRef.value?.focus();
  });
  hideSelectionActions();
};

const openAiPanelForDocument = (operation: NoteAiOperation) => {
  const noteText = content.value.trim();
  if (!noteText) {
    toast.add({
      title: "Empty note",
      description: "Write or draft note content before using document AI.",
      color: "warning",
    });
    return;
  }

  selectedNoteCompanionAction.value =
    operation === "custom" ? "explain" : "improve";
  noteChatInput.value =
    operation === "summarize"
      ? "Summarise this note."
      : operation === "improve" || operation === "fix-grammar"
        ? "Improve this note."
        : "Explain this note.";
  nextTick(() => {
    noteChatInputRef.value?.focus();
  });
};

const canReopenAiPanel = computed(
  () =>
    !isAiPanelOpen.value &&
    Boolean(aiPanelMode.value) &&
    Boolean(aiPanelSourceText.value.trim()),
);

const reopenAiPanel = () => {
  if (!aiPanelMode.value) return;
  isAiPanelOpen.value = true;
};

const aiBubbleHandlers = {
  summaryAi: {
    canExecute: (editor: any) => Boolean(getSelectedText(editor)),
    execute: (editor: any) => {
      openAiPanelForSelection("summary", editor);
      return editor.chain().focus();
    },
    isActive: () => aiPanelMode.value === "summary" && isAiPanelOpen.value,
  },
  rephraseAi: {
    canExecute: (editor: any) => Boolean(getSelectedText(editor)),
    execute: (editor: any) => {
      openAiPanelForSelection("rephrase", editor);
      return editor.chain().focus();
    },
    isActive: () => aiPanelMode.value === "rephrase" && isAiPanelOpen.value,
  },
  askAi: {
    canExecute: (editor: any) => Boolean(getSelectedText(editor)),
    execute: (editor: any) => {
      openAiPanelForSelection("ask", editor);
      return editor.chain().focus();
    },
    isActive: () => aiPanelMode.value === "ask" && isAiPanelOpen.value,
  },
};

const documentAiItems = computed(() => [
  [
    {
      label: "Summarize note",
      icon: "i-lucide-file-text",
      onSelect: () => openAiPanelForDocument("summarize"),
    },
    {
      label: "Improve whole note",
      icon: "i-lucide-sparkles",
      onSelect: () => openAiPanelForDocument("improve"),
    },
    {
      label: "Simplify whole note",
      icon: "i-lucide-wand-sparkles",
      onSelect: () => openAiPanelForDocument("simplify"),
    },
    {
      label: "Generate questions",
      icon: "i-lucide-circle-help",
      onSelect: () => openAiPanelForDocument("questions"),
    },
  ],
]);

const openDraftModal = () => {
  draftForm.title =
    draftForm.title || (title.value === "Untitled" ? "" : title.value);
  isDraftModalOpen.value = true;
};

const openSelectedTransform = (operation: NoteAiOperation, editor: any) => {
  openAiPanelForSelection("rephrase", editor, operation);
};

const buildSelectionAiItems = (editor: any) => [
  [
    {
      label: "Summarize selection",
      icon: "i-lucide-file-text",
      onSelect: () => openAiPanelForSelection("summary", editor),
    },
    {
      label: "Rephrase",
      icon: "i-lucide-refresh-cw",
      onSelect: () => openSelectedTransform("rephrase", editor),
    },
    {
      label: "Improve writing",
      icon: "i-lucide-sparkles",
      onSelect: () => openSelectedTransform("improve", editor),
    },
    {
      label: "Simplify",
      icon: "i-lucide-wand-sparkles",
      onSelect: () => openSelectedTransform("simplify", editor),
    },
    {
      label: "Fix grammar",
      icon: "i-lucide-spell-check",
      onSelect: () => openSelectedTransform("fix-grammar", editor),
    },
    {
      label: "Generate questions",
      icon: "i-lucide-circle-help",
      onSelect: () => openSelectedTransform("questions", editor),
    },
  ],
  [
    {
      label: "Ask AI about selection",
      icon: "i-lucide-message-circle",
      onSelect: () => openAiPanelForSelection("ask", editor),
    },
  ],
];

const aiStudioActions = computed(() => [
  {
    title: "Draft a study note",
    description: "Turn a short prompt, context, or URLs into a saved note.",
    icon: "i-lucide-file-plus-2",
    color: "from-emerald-500/20 to-teal-500/10",
    actionLabel: "Create draft",
    disabled: false,
    onSelect: () => openDraftModal(),
  },
  {
    title: "Summarize this note",
    description: "Condense the full note into a clean study summary.",
    icon: "i-lucide-file-text",
    color: "from-sky-500/20 to-cyan-500/10",
    actionLabel: "Summarize",
    disabled: !content.value.trim(),
    onSelect: () =>
      runNoteAction(
        "summarize",
        "Summarize the note into a concise, useful revision summary.",
      ),
  },
  {
    title: "Improve writing",
    description: "Rewrite the whole note with better clarity and flow.",
    icon: "i-lucide-sparkles",
    color: "from-amber-500/20 to-orange-500/10",
    actionLabel: "Improve",
    disabled: !content.value.trim(),
    onSelect: () =>
      runNoteAction(
        "improve",
        "Improve the whole note structure, clarity, and study usefulness.",
      ),
  },
  {
    title: "Generate practice questions",
    description: "Create questions and answers from your note content.",
    icon: "i-lucide-circle-help",
    color: "from-rose-500/20 to-pink-500/10",
    actionLabel: "Generate",
    disabled: !content.value.trim(),
    onSelect: () => openAiPanelForDocument("questions"),
  },
]);

async function deleteUploadedImage(url: string) {
  await $api.mutate(`/api/uploads?url=${encodeURIComponent(url)}`, {
    method: "DELETE",
  });
}

function removeFirstImageMarkdown(markdown: string, url: string) {
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imageRegex = new RegExp(`\\n?!\\[[^\\]]*\\]\\(${escapedUrl}\\)\\n?`);

  if (imageRegex.test(markdown)) {
    return markdown.replace(imageRegex, "\n");
  }

  return markdown;
}

async function handleImageTap(url: string) {
  const shouldDelete = window.confirm("Delete this image from the note?");

  if (!shouldDelete) {
    return true;
  }

  try {
    await deleteUploadedImage(url);
    content.value = removeFirstImageMarkdown(content.value, url);
    await persistNote();
    toast.add({
      title: "Image deleted",
      description: "The image was removed from this note.",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Delete failed",
      description: "The image could not be deleted.",
      color: "error",
    });
  }

  return true;
}

const editorProps = {
  handlePaste(view: any, event: ClipboardEvent) {
    const text = event.clipboardData?.getData("text/plain");

    if (!text) return false;

    event.preventDefault();
    const { from, to } = view.state.selection;
    const currentText = view.state.doc.textContent || "";
    const selectionLength = Math.max(0, to - from);
    const remaining =
      MAX_CONTENT_LENGTH - (currentText.length - selectionLength);
    const nextText = remaining > 0 ? text.slice(0, remaining) : "";

    if (!nextText) {
      return true;
    }

    view.dispatch(view.state.tr.insertText(nextText, from, to));
    return true;
  },
  handleClickOn(_view: any, _pos: number, node: any) {
    const src = node?.attrs?.src;

    if (!src) return false;

    void handleImageTap(src);
    return true;
  },
};

const pageTitle = computed(() => title.value.trim() || "Untitled");
const contentCharacterCount = computed(() => content.value.length);
const imageCount = computed(() => {
  const matches = content.value.match(/!\[[^\]]*]\(([^)]+)\)/g);
  return matches ? matches.length : 0;
});

const saveLabel = computed(() => {
  switch (saveState.value) {
    case "saving":
      return "Saving...";
    case "saved":
      return lastSavedAt.value ? `Saved ${lastSavedAt.value}` : "Saved";
    case "error":
      return "Save failed";
    default:
      return "Draft";
  }
});

const noteTabs = [
  {
    label: "Work Note",
    value: "work-note" as const,
    icon: "i-lucide-pen-line",
  },
  {
    label: "Study Guide",
    value: "study-guide" as const,
    icon: "i-lucide-book-open-check",
  },
  { label: "Sources", value: "sources" as const, icon: "i-lucide-files" },
];

const noteStatusLabel = computed(() => {
  if (activeNoteJobId.value && noteJobStatus.value !== "completed") {
    return noteJobMessage.value || "Analysing source...";
  }

  if (ingestionStatus.value === "processing") return "Analysing source...";
  if (ingestionStatus.value === "partial") return "Partially processed";
  if (ingestionStatus.value === "failed") return "Source failed";
  if (ingestionStatus.value === "needs-ocr") return "Needs OCR";
  return saveLabel.value;
});

const isSourceProcessing = computed(
  () =>
    Boolean(activeNoteJobId.value && noteJobStatus.value !== "completed") ||
    ingestionStatus.value === "processing",
);

const sourceIssue = computed(() => {
  if (ingestionStatus.value === "failed") {
    return ingestionError.value || "GapAI could not extract this source.";
  }

  if (ingestionStatus.value === "needs-ocr") {
    return "This source looks scanned or image-based. OCR is needed before source-grounded answers are reliable.";
  }

  if (ingestionStatus.value === "partial") {
    return (
      ingestionError.value || "Only part of this source could be extracted."
    );
  }

  return "";
});

const primarySource = computed(() => noteSources.value[0] || null);
const primarySourceType = computed(() =>
  String(
    primarySource.value?.type ||
      (sourceLibraryItemId.value ? "document" : "markdown"),
  )
    .toLowerCase()
    .replace("markdown", "md"),
);

const sourceBadge = computed(() => {
  const type = primarySourceType.value;
  if (type === "pdf") return "PDF source attached";
  if (["docx", "txt", "md"].includes(type)) return "Converted to editable note";
  if (primarySource.value?.url) return "Link source attached";
  return "Editable note";
});

const sourceStatusColor = (status?: string | null) => {
  switch (status) {
    case "ready":
      return "success";
    case "processing":
      return "warning";
    case "partial":
      return "warning";
    case "failed":
    case "needs-ocr":
      return "error";
    default:
      return "neutral";
  }
};

const studyGuideSections = computed(() => {
  if (studyGuideMarkdown.value.trim()) return studyGuideMarkdown.value;

  return `## Key Points
- Your generated study guide will organise the most important ideas here.

## Definitions
- Important terms and concise meanings will appear here.

## Examples
- GapAI will add examples that make the note easier to apply.

## Common Mistakes
- Misconceptions and traps will be called out clearly.

## Exam Angles
- Likely question angles and revision focus areas will appear here.

## Quick Recap
- A short final review will appear here.`;
});

const noteChatPlaceholder = computed(() =>
  isSourceProcessing.value
    ? "Ask generally while source analysis finishes..."
    : "Ask about this note...",
);

const noteCompanionActionOptions: Array<{
  label: string;
  value: NoteCompanionAction;
  icon: string;
  tip: string;
  pendingLabel: string;
}> = [
  {
    label: "Ask",
    value: "ask",
    icon: "i-lucide-message-circle",
    tip: "Ask a normal question. This goes to the sticky note companion chat.",
    pendingLabel: "Thinking...",
  },
  {
    label: "Explain",
    value: "explain",
    icon: "i-lucide-lightbulb",
    tip: "Get an explanation through the note companion chat.",
    pendingLabel: "Thinking...",
  },
  {
    label: "Improve",
    value: "improve",
    icon: "i-lucide-sparkles",
    tip: "Preview improvement suggestions as markdown. Apply changes only after you confirm.",
    pendingLabel: "Improving note...",
  },
  {
    label: "Research",
    value: "research-more",
    icon: "i-lucide-telescope",
    tip: "Research further and return markdown context without changing the note automatically.",
    pendingLabel: "Researching...",
  },
  {
    label: "Study guide",
    value: "study-guide",
    icon: "i-lucide-book-open-check",
    tip: "Creates a linked study guide from this note.",
    pendingLabel: "Creating study guide...",
  },
];

const selectedNoteCompanionOption = computed(
  () =>
    noteCompanionActionOptions.find(
      (option) => option.value === selectedNoteCompanionAction.value,
    ) || noteCompanionActionOptions[0]!,
);

const noteChatPendingLabel = computed(() =>
  activeNoteJobId.value && noteJobStatus.value !== "completed"
    ? selectedNoteCompanionOption.value.pendingLabel
    : "Thinking...",
);

const buildFormData = () => {
  const formData = new FormData();
  formData.append("title", title.value.trim() || "Untitled");
  formData.append("libraryType", "note");
  formData.append("content", normalizeNoteMarkdown(content.value));
  return formData;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

const htmlToMarkdown = (value: string) => {
  let markdown = value;

  markdown = markdown
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>$/i, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "_$1_")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "_$1_")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(
      /<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi,
      "![$1]($2)",
    )
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, "![]($1)")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n> $1\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(markdown)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const normalizeNoteMarkdown = (value: string | null | undefined) => {
  const raw = String(value || "");
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw) || /&[a-z]+;/.test(raw);
  const markdown = looksLikeHtml ? htmlToMarkdown(raw) : raw;

  return markdown.replace(/\r\n/g, "\n").trim();
};

const resolveLibraryItemId = (item: Partial<LibraryItem> | null | undefined) =>
  item?.id || item?.documentId || null;

const applyNoteWorkspace = (note: NoteWorkspaceResponse) => {
  noteApiMode.value = true;
  title.value = note.title || routeSuggestedTitle.value || "Untitled";
  titleDraft.value = title.value === "Untitled" ? "" : title.value;
  noteContentType.value = "markdown";
  content.value = normalizeNoteMarkdown(note.markdown);
  currentBackendNoteId.value = note.id || currentBackendNoteId.value;
  noteKind.value = note.noteKind || "work-note";
  studyGuideNoteId.value = note.studyGuideNoteId || studyGuideNoteId.value;
  sourceLibraryItemId.value = note.sourceLibraryItemId || null;
  ingestionStatus.value = note.ingestionStatus || null;
  ingestionError.value = note.ingestionError || null;
  noteSources.value = Array.isArray(note.sources) ? note.sources : [];
};

const refreshNoteWorkspace = async () => {
  if (isNewNote.value) return;

  const note = await $api.fetch<NoteWorkspaceResponse>(
    `/api/notes/${noteId.value}`,
    {
      method: "GET",
    },
  );
  applyNoteWorkspace(note);
};

const pollNoteJob = async (jobId: string) => {
  activeNoteJobId.value = jobId;
  noteJobStatus.value = "pending";
  noteJobProgress.value = 8;
  noteJobMessage.value = "Analysing source...";

  for (let attempt = 0; attempt < 90; attempt += 1) {
    const job = await $api.fetch<NoteJobResponse>(`/api/notes/jobs/${jobId}`, {
      method: "GET",
    });

    noteJobStatus.value = job.status || noteJobStatus.value;
    noteJobProgress.value = Number(job.progress ?? noteJobProgress.value ?? 0);
    noteJobMessage.value = job.message || noteJobMessage.value;

    if (job.status === "completed") {
      const result = await $api.fetch<NoteJobResponse>(
        `/api/notes/jobs/${jobId}/result`,
        { method: "GET" },
      );

      if (result.note) applyNoteWorkspace(result.note);
      if (result.resultNote?.id) {
        studyGuideNoteId.value = result.resultNote.id;
        studyGuideMarkdown.value = normalizeNoteMarkdown(
          result.resultNote.markdown,
        );
      }

      await refreshNoteWorkspace().catch(() => undefined);
      activeNoteJobId.value = null;
      noteJobStatus.value = "completed";
      noteJobProgress.value = 100;
      noteJobMessage.value = result.message || "Ready";
      isStudyGuideGenerating.value = false;
      return;
    }

    if (job.status === "failed") {
      activeNoteJobId.value = null;
      isStudyGuideGenerating.value = false;
      ingestionStatus.value = "failed";
      ingestionError.value =
        job.message || "The source could not be processed.";
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
};

const loadNote = async () => {
  if (isNewNote.value) {
    currentBackendNoteId.value = null;
    title.value = companionEnabled.value ? companionTopic.value : "Untitled";
    titleDraft.value = companionEnabled.value ? companionTopic.value : "";
    content.value = buildCompanionDraft();
    noteContentType.value = "markdown";
    hasInitialized.value = true;
    return;
  }

  try {
    isLoading.value = true;
    try {
      const note = await $api.fetch<NoteWorkspaceResponse>(
        `/api/notes/${noteId.value}`,
        { method: "GET" },
      );

      if (note?.id) {
        applyNoteWorkspace(note);
        hasInitialized.value = true;
        return;
      }
    } catch {
      noteApiMode.value = false;
    }

    const response = await $api.fetch<LibrarySingleResponse>(
      `/api/libraries/${noteId.value}`,
      { method: "GET" },
    );

    if (!response?.data) {
      throw new Error("Note not found");
    }

    if (response.data.libraryType && response.data.libraryType !== "note") {
      throw new Error("Library item is not a note");
    }

    title.value = response.data.title || routeSuggestedTitle.value || "Untitled";
    titleDraft.value = title.value === "Untitled" ? "" : title.value;
    noteContentType.value = "markdown";
    content.value = normalizeNoteMarkdown(response.data.content);
    currentBackendNoteId.value = resolveLibraryItemId(response.data);
    noteSources.value = [];
    ingestionStatus.value = null;
    ingestionError.value = null;
    hasInitialized.value = true;
  } catch {
    toast.add({
      title: "Error",
      description: "Failed to load note",
      color: "error",
    });
    router.push("/dashboard/library");
  } finally {
    isLoading.value = false;
  }
};

const persistNote = async (): Promise<
  LibraryItem | NoteWorkspaceResponse | null
> => {
  if (isLoading.value || !hasInitialized.value) return null;
  if (isSaving.value) {
    hasPendingSave.value = true;
    return null;
  }
  if (!title.value.trim() && !content.value.trim()) return null;

  const currentSaveId = ++saveSequence.value;
  const submittedTitle = title.value;
  isSaving.value = true;
  saveState.value = "saving";

  try {
    const response =
      noteApiMode.value || isNewNote.value
        ? await $api.mutate<NoteWorkspaceResponse>(
            isNewNote.value ? "/api/notes" : `/api/notes/${noteId.value}`,
            {
              method: isNewNote.value ? "POST" : "PATCH",
              body: {
                title: title.value.trim() || "Untitled",
                markdown: normalizeNoteMarkdown(content.value),
                noteKind: "work-note",
                parentNoteId: null,
                sourceLibraryItemId: sourceLibraryItemId.value,
              },
            },
          )
        : await $api.mutate<LibrarySingleResponse>(
            `/api/libraries/${noteId.value}`,
            {
              method: "PUT",
              body: buildFormData(),
            },
          );

    const savedNote =
      noteApiMode.value || isNewNote.value
        ? (response as NoteWorkspaceResponse)
        : (response as LibrarySingleResponse)?.data;
    if (!savedNote) {
      throw new Error("Invalid note response");
    }

    if (noteApiMode.value || isNewNote.value) {
      applyNoteWorkspace(savedNote as NoteWorkspaceResponse);
    } else {
      currentBackendNoteId.value = resolveLibraryItemId(
        savedNote as LibraryItem,
      );
    }

    if (isNewNote.value) {
      const routeId =
        "documentId" in savedNote
          ? savedNote.documentId || savedNote.id
          : savedNote.id;
      if (routeId) {
        await router.replace({
          path: `/dashboard/notes/${routeId}`,
          query: route.query,
        });
      }
    }

    if (title.value === submittedTitle) {
      title.value = savedNote.title || submittedTitle || "Untitled";
      titleDraft.value = title.value === "Untitled" ? "" : title.value;
    }

    lastSavedAt.value = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    if (currentSaveId === saveSequence.value) {
      saveState.value = "saved";
    }
    return savedNote;
  } catch {
    if (currentSaveId === saveSequence.value) {
      saveState.value = "error";
    }
    toast.add({
      title: "Save failed",
      description: "The note could not be saved.",
      color: "error",
    });
    return null;
  } finally {
    isSaving.value = false;
    if (hasPendingSave.value) {
      hasPendingSave.value = false;
      void persistNote();
    }
  }
};

const waitForSaveToSettle = async () => {
  for (let attempt = 0; attempt < 40 && isSaving.value; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

const ensureSavedNoteForAi = async () => {
  if (!title.value.trim() && !content.value.trim()) {
    toast.add({
      title: "Write something first",
      description: "Add a title or note content before using note AI.",
      color: "warning",
    });
    return null;
  }

  if (isSaving.value) {
    await waitForSaveToSettle();
  }

  if (isNewNote.value || saveState.value !== "saved") {
    const savedNote = await persistNote();
    if (savedNote) {
      currentBackendNoteId.value = resolveLibraryItemId(savedNote);
    }
  }

  if (!currentBackendNoteId.value && !isNewNote.value) {
    currentBackendNoteId.value = noteId.value;
  }

  if (!currentBackendNoteId.value) {
    toast.add({
      title: "Save required",
      description: "Save the note before using AI actions.",
      color: "warning",
    });
    return null;
  }

  return currentBackendNoteId.value;
};

const createStudyGuide = async () => {
  const savedNoteId = await ensureSavedNoteForAi();
  if (!savedNoteId) return;

  try {
    activeNoteTab.value = "study-guide";
    isStudyGuideGenerating.value = true;
    const response = await $api.mutate<NoteJobResponse>(
      `/api/notes/${savedNoteId}/study-guide`,
      {
        method: "POST",
        body: {
          noteId: savedNoteId,
          instruction:
            "Create a structured study guide with key points, definitions, examples, common mistakes, exam angles, and a quick recap.",
        },
      },
    );

    if (response.jobId) {
      await pollNoteJob(response.jobId);
      return;
    }

    isStudyGuideGenerating.value = false;
  } catch (error: any) {
    isStudyGuideGenerating.value = false;
    toast.add({
      title: "Study guide failed",
      description:
        error?.statusMessage || error?.message || "Could not create the guide.",
      color: "error",
    });
  }
};

const runNoteAction = async (
  action: "explain" | "summarize" | "improve" | "research-more" | "study-guide",
  instruction: string,
) => {
  const savedNoteId = await ensureSavedNoteForAi();
  if (!savedNoteId) return;

  try {
    if (action === "study-guide") {
      await createStudyGuide();
      return;
    }

    const displayInstruction = normalizeNoteChatDisplayMessage(instruction);
    noteChatMessages.value.push(
      makeNoteChatUiMessage({
        id: `user-action-${Date.now()}`,
        role: "user",
        content: `#${action} ${displayInstruction.content}`,
        selectedText: displayInstruction.selectedText,
      }),
    );

    const operation: NoteAiOperation =
      action === "research-more" ? "custom" : action;
    const response = await callNoteAiTransform({
      action:
        action === "research-more"
          ? "research-more"
          : action === "summarize"
            ? "summarize"
            : action === "explain"
              ? "explain"
              : "improve",
      operation,
      scope: displayInstruction.selectedText ? "selection" : "document",
      selectedText: displayInstruction.selectedText,
      instruction:
        action === "research-more"
          ? `Research this further and return useful study context as markdown.\n\n${displayInstruction.content}`
          : displayInstruction.content,
      applyMode: "return-only",
      includeWeb: action === "research-more",
    });

    noteChatMessages.value.push({
      id: `assistant-action-${Date.now()}`,
      role: "assistant",
      content:
        response?.content ||
        "I could not generate a useful response for that action.",
    });
  } catch (error: any) {
    noteChatMessages.value.push({
      id: `assistant-action-error-${Date.now()}`,
      role: "assistant",
      content:
        error?.statusMessage ||
        error?.message ||
        "I could not run that note action. Please try again.",
    });
  }
};

const buildCompanionPayloadText = (message: string) => {
  const selected = noteChatSelectedText.value.trim();
  if (!selected) return message;

  return `${message}\n\nSelected text:\n"""${selected}"""`;
};

const normalizeNoteChatDisplayMessage = (
  content: string,
  selectedText?: string,
) => {
  const parsed = content.match(/\n\nSelected text:\n"""([\s\S]*?)"""\s*$/);
  return {
    content: parsed ? content.slice(0, parsed.index).trim() : content,
    selectedText: selectedText || parsed?.[1]?.trim() || undefined,
  };
};

const makeNoteChatUiMessage = (
  message: NoteChatUiMessage,
): NoteChatUiMessage => {
  const normalized = normalizeNoteChatDisplayMessage(
    message.content,
    message.selectedText,
  );
  return {
    ...message,
    content: normalized.content,
    selectedText: normalized.selectedText,
    expandedSelectedText: message.expandedSelectedText || false,
  };
};

const getNoteChatSessionId = (session?: NoteChatSession | null) =>
  session?.sessionId || session?.id || "";

const getNoteChatSessionTime = (session?: NoteChatSession | null) => {
  const value = session?.updatedAtUtc || session?.createdAtUtc || "";
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

const pickNoteCompanionSession = (sessions: NoteChatSession[]) => {
  if (!sessions.length) return null;

  const currentSession = sessions.find(
    (session) => getNoteChatSessionId(session) === noteChatSessionId.value,
  );
  if (currentSession) return currentSession;

  const defaultSession = sessions.find((session) => {
    const label = `${session.title || ""} ${session.name || ""}`.toLowerCase();
    return label.includes("note companion") || label.includes("default");
  });
  if (defaultSession) return defaultSession;

  return (
    [...sessions].sort(
      (a, b) => getNoteChatSessionTime(b) - getNoteChatSessionTime(a),
    )[0] || null
  );
};

const getNoteChatCacheKey = (targetNoteId?: string | null) => {
  const savedNoteId =
    targetNoteId ||
    currentBackendNoteId.value ||
    (!isNewNote.value ? noteId.value : null);
  return savedNoteId ? `gapai:note-chat:${savedNoteId}` : null;
};

const hydrateCachedNoteChat = (targetNoteId?: string | null) => {
  if (!import.meta.client) return;
  const cacheKey = getNoteChatCacheKey(targetNoteId);
  if (!cacheKey) return;

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    if (!Array.isArray(cached) || !cached.length) return;

    const messages = cached
      .filter(
        (message) =>
          message?.content &&
          (message.role === "user" || message.role === "assistant"),
      )
      .map((message, index) => ({
        id: String(message.id || `cached-${index}`),
        role: message.role as "user" | "assistant",
        content: String(message.content || ""),
        selectedText: message.selectedText
          ? String(message.selectedText)
          : undefined,
        expandedSelectedText: Boolean(message.expandedSelectedText),
      }))
      .map(makeNoteChatUiMessage);

    if (messages.length) {
      noteChatMessages.value = messages;
    }
  } catch {
    localStorage.removeItem(cacheKey);
  }
};

const persistCachedNoteChat = () => {
  if (!import.meta.client) return;
  const cacheKey = getNoteChatCacheKey();
  if (!cacheKey) return;

  const messages = noteChatMessages.value.filter(
    (message) => message.id !== "intro" && message.content.trim(),
  );
  if (!messages.length) {
    localStorage.removeItem(cacheKey);
    return;
  }

  localStorage.setItem(cacheKey, JSON.stringify(messages.slice(-60)));
};

const loadNoteChatHistory = async (targetNoteId?: string | null) => {
  const savedNoteId =
    targetNoteId ||
    currentBackendNoteId.value ||
    (!isNewNote.value ? noteId.value : null);
  if (!savedNoteId) return;

  try {
    const sessionsResponse = await $api.fetch<
      { items?: NoteChatSession[] } | NoteChatSession[]
    >(`/api/notes/${savedNoteId}/chat/sessions`, {
      method: "GET",
    });

    const sessions = Array.isArray(sessionsResponse)
      ? sessionsResponse
      : sessionsResponse?.items || [];
    const session = pickNoteCompanionSession(sessions);
    const sessionId = getNoteChatSessionId(session);

    if (!sessionId) return;

    const messagesResponse = await $api.fetch<NoteChatMessagesResponse>(
      `/api/notes/${savedNoteId}/chat/sessions/${sessionId}/messages`,
      { method: "GET" },
    );

    const messages = (messagesResponse.items || [])
      .filter(
        (message) =>
          message.content &&
          (message.role === "user" || message.role === "assistant"),
      )
      .map((message, index) => ({
        id: message.messageId || message.id || `${sessionId}-${index}`,
        role: message.role as "user" | "assistant",
        content: message.content || "",
      }))
      .map(makeNoteChatUiMessage);

    if (messages.length) {
      noteChatSessionId.value = sessionId;
      noteChatMessages.value = messages;
    }
  } catch {
    // The default intro remains useful if the note has no session yet.
  }
};

const sendNoteChatMessage = async (messageOverride?: string) => {
  const message = (messageOverride || noteChatInput.value).trim();
  if (!message || isNoteChatSending.value) return;

  const savedNoteId = await ensureSavedNoteForAi();
  if (!savedNoteId) return;

  const activeAction = selectedNoteCompanionAction.value;
  const selectedContext = noteChatSelectedText.value.trim();
  const payloadMessage = buildCompanionPayloadText(message);

  if (activeAction === "improve" || activeAction === "research-more") {
    noteChatInput.value = "";
    isNoteChatSending.value = true;
    await runNoteAction(activeAction, payloadMessage);
    noteChatSelectedText.value = "";
    isNoteChatSending.value = false;
    return;
  }

  if (activeAction === "study-guide") {
    noteChatInput.value = "";
    isNoteChatSending.value = true;
    await createStudyGuide();
    noteChatSelectedText.value = "";
    isNoteChatSending.value = false;
    return;
  }

  const userMessage = {
    id: `user-${Date.now()}`,
    role: "user" as const,
    content: message,
    selectedText: selectedContext || undefined,
    expandedSelectedText: false,
  };

  noteChatMessages.value.push(makeNoteChatUiMessage(userMessage));
  noteChatInput.value = "";
  isNoteChatSending.value = true;

  try {
    const response = await $api.mutate<NoteChatResponse>(
      `/api/notes/${savedNoteId}/chat`,
      {
        method: "POST",
        body: {
          noteId: savedNoteId,
          sessionId: null,
          message:
            activeAction === "explain"
              ? `Explain this clearly.\n\n${payloadMessage}`
              : payloadMessage,
          aiTier: selectedAskModel.value || "google-standard",
          includeWeb: false,
        },
      },
    );

    if (response.sessionId) noteChatSessionId.value = response.sessionId;
    noteChatMessages.value.push({
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response.answer || "I could not generate a response.",
    });
    noteChatSelectedText.value = "";
    await loadNoteChatHistory(savedNoteId);
  } catch (error: any) {
    noteChatMessages.value.push({
      id: `assistant-error-${Date.now()}`,
      role: "assistant",
      content:
        error?.statusMessage ||
        error?.message ||
        "I could not reach the note companion. Please try again.",
    });
  } finally {
    isNoteChatSending.value = false;
  }
};

const runAutoNoteCompanionAction = async () => {
  if (hasRunAutoNoteAction.value || !routeAutoNoteAction.value || isNewNote.value) {
    return;
  }

  hasRunAutoNoteAction.value = true;
  const action = routeAutoNoteAction.value;
  const message =
    action === "summarize"
      ? "Summarise this note into key themes and revision points."
      : action === "research-more"
        ? "Research around this note and add useful study context."
        : "Explain this note clearly.";

  selectedNoteCompanionAction.value =
    action === "research-more" ? "research-more" : action === "explain" ? "explain" : "ask";
  await sendNoteChatMessage(message);

  const nextQuery = { ...route.query };
  delete nextQuery.autoNoteAction;
  await router.replace({ query: nextQuery });
};

const openSourceUrl = (source?: NoteSource | null) => {
  if (!source?.url || !import.meta.client) return;
  window.open(source.url, "_blank", "noopener,noreferrer");
};

const callNoteAiTransform = async (payload: {
  action?: "explain" | "summarize" | "improve" | "research-more";
  operation: NoteAiOperation;
  scope: NoteAiScope;
  selectedText?: string;
  instruction?: string;
  applyMode?: NoteAiApplyMode;
  includeWeb?: boolean;
}) => {
  const savedNoteId = await ensureSavedNoteForAi();
  if (!savedNoteId) return null;

  const compatibilityAction =
    payload.action ||
    (payload.operation === "summarize"
      ? "summarize"
      : payload.operation === "explain"
        ? "explain"
        : payload.includeWeb
          ? "research-more"
          : "improve");
  const body: Record<string, unknown> = {
    action: compatibilityAction,
    operation: payload.operation,
    scope: payload.scope,
    applyMode: payload.applyMode || "return-only",
    aiTier: selectedAskModel.value || "google-standard",
    includeWeb: payload.includeWeb ?? false,
  };

  if (payload.scope === "selection") {
    body.selectedText = payload.selectedText || aiPanelSourceText.value;
  }

  if (payload.instruction) {
    body.instruction = payload.instruction;
  }

  const response = await $api.mutate<NoteAiTransformResponse>(
    `/api/notes/${savedNoteId}/actions`,
    {
      method: "POST",
      body,
    },
  );

  if (response?.noteId) {
    currentBackendNoteId.value = response.noteId;
  }

  if (response?.updatedNoteContent) {
    content.value = normalizeNoteMarkdown(response.updatedNoteContent);
    noteContentType.value = "markdown";
  }

  return response;
};

const debouncedSave = useDebounceFn(() => {
  persistNote();
}, 1200);

watch(content, () => {
  if (!hasInitialized.value) return;
  saveState.value = "idle";
  debouncedSave();
});

watch(content, (value) => {
  if (value.length <= MAX_CONTENT_LENGTH) return;

  content.value = value.slice(0, MAX_CONTENT_LENGTH);
  toast.add({
    title: "Content limit reached",
    description: "Notes are limited to 10,000 characters.",
    color: "warning",
  });
});

watch(isAiPanelOpen, (isOpen) => {
  if (isOpen) return;
  activeSelectionAction.value = null;
});

watch(selectedTransformOperation, (operation) => {
  if (!isAiPanelOpen.value || aiPanelMode.value !== "rephrase") return;
  void generateRephraseOptions(operation);
});

watch(noteChatMessages, persistCachedNoteChat, { deep: true });

watch(
  [isInsertBlockMenuOpen, isMoreBlockMenuOpen],
  ([insertOpen, moreOpen]) => {
    if (insertOpen || moreOpen) {
      hideSelectionActions();
    }

    if (!moreOpen) return;

    const editor = editorInstance.value;
    if (!editor) return;

    if (editor.isActive("table")) return;

    const dragPos = dragHandleNodePos.value;
    if (dragPos !== null && dragPos !== undefined) {
      const node = editor.state.doc.nodeAt(dragPos);
      if (node?.type?.name === "table") {
        focusTableAtPos(editor, dragPos);
        const tableCellPos = getTableCellTextPos(editor);
        if (tableCellPos !== null) {
          lastTableSelectionPos.value = tableCellPos;
        }
        return;
      }
    }

    restoreTableFocus(editor);
  },
);

const beginTitleEdit = () => {
  isEditingTitle.value = true;
  titleDraft.value = title.value === "Untitled" ? "" : title.value;
};

const commitTitleChange = async () => {
  const nextTitle = titleDraft.value.trim();

  if (nextTitle && nextTitle.length < 3) {
    toast.add({
      title: "Invalid title",
      description: "Title must be at least 3 characters.",
      color: "error",
    });
    return;
  }

  const resolvedTitle = nextTitle || "Untitled";
  const hasChanged = resolvedTitle !== title.value;

  title.value = resolvedTitle;
  isEditingTitle.value = false;

  if (hasChanged && hasInitialized.value) {
    saveState.value = "idle";
    await persistNote();
  }
};

const cancelTitleEdit = () => {
  titleDraft.value = title.value === "Untitled" ? "" : title.value;
  isEditingTitle.value = false;
};

const handleTitleKeydown = async (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    event.preventDefault();
    await commitTitleChange();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    cancelTitleEdit();
  }
};

const handleSaveShortcut = async (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    await persistNote();
  }
};

const saveCurrentNote = async () => {
  await persistNote();
};

const openImagePicker = (editor: any) => {
  editorInstance.value = editor;
  fileInput.value?.click();
};

const attachImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (imageCount.value >= MAX_NOTE_IMAGES) {
    toast.add({
      title: "Image limit reached",
      description: `A note can contain up to ${MAX_NOTE_IMAGES} images.`,
      color: "warning",
    });
    input.value = "";
    return;
  }

  try {
    const formData = new FormData();
    formData.append("purpose", "note-image");
    formData.append("File", file);

    const response = await $api.mutate<{ url: string }>("/api/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response?.url) {
      throw new Error("No uploaded image URL returned");
    }

    const markdown = `![${file.name}](${response.url})`;
    if (editorInstance.value?.commands?.insertContent) {
      restoreSelection(editorInstance.value)?.insertContent(markdown).run();
    } else {
      content.value = `${content.value}\n\n${markdown}\n`;
    }
  } catch {
    toast.add({
      title: "Image upload failed",
      description: "The image could not be uploaded.",
      color: "error",
    });
  } finally {
    input.value = "";
  }
};

const triggerImagePicker = () => {
  fileInput.value?.click();
};

const restoreSelection = (editor: any) => {
  if (!editor || !lastSelection.value) return editor?.chain?.().focus();

  return editor.chain().focus().setTextSelection({
    from: lastSelection.value.from,
    to: lastSelection.value.to,
  });
};

const hideSelectionActions = () => {
  selectionActions.value.visible = false;
  activeSelectionAction.value = null;
};

const getSelectedText = (editor: any) => {
  const selection = editor?.state?.selection;
  if (!selection || selection.empty) return "";
  return String(
    editor.state.doc.textBetween(selection.from, selection.to, " "),
  ).trim();
};

const clearHighlightedTableColumn = () => {
  const tableElement = highlightedTableElement.value;
  if (tableElement) {
    tableElement
      .querySelectorAll(".ga-table-col-highlight")
      .forEach((cell) => cell.classList.remove("ga-table-col-highlight"));
  }
  highlightedTableElement.value = null;
  highlightedTableColumnIndex.value = null;
  activeTableColumnIndex.value = null;
};

const highlightTableColumn = (
  tableElement: HTMLTableElement,
  columnIndex: number,
) => {
  clearHighlightedTableColumn();
  highlightedTableElement.value = tableElement;
  highlightedTableColumnIndex.value = columnIndex;
  activeTableColumnIndex.value = columnIndex;

  tableElement.querySelectorAll("tr").forEach((row) => {
    const cell = row.children.item(columnIndex) as HTMLElement | null;
    if (cell) {
      cell.classList.add("ga-table-col-highlight");
    }
  });
};

const getTableSelectionContext = (editor: any) => {
  const selection = editor?.state?.selection;
  if (!selection) return null;

  const domAtPos = editor?.view?.domAtPos?.(selection.from);
  const node = domAtPos?.node as Node | null;
  const element =
    (node instanceof Element ? node : node?.parentElement)?.closest?.(
      "th,td",
    ) || null;
  if (!element) return null;

  const rowElement = element.parentElement as HTMLTableRowElement | null;
  const tableElement = element.closest("table") as HTMLTableElement | null;
  if (!rowElement || !tableElement) return null;

  const columnIndex = Array.from(rowElement.children).indexOf(element);
  if (columnIndex < 0) return null;

  const coords = editor.view.coordsAtPos(selection.from);
  return {
    tableElement,
    columnIndex,
    isHeader: element.tagName === "TH",
    coords,
  };
};

const getActiveTableColumnCount = () => {
  const tableElement = highlightedTableElement.value;
  if (!tableElement) return 0;

  let max = 0;
  tableElement.querySelectorAll("tr").forEach((row) => {
    max = Math.max(max, row.children.length);
  });
  return max;
};

const focusTableColumnByIndex = (columnIndex: number) => {
  const editor = editorInstance.value;
  const tableElement = highlightedTableElement.value;
  if (!editor || !tableElement || columnIndex < 0) return false;

  const rows = Array.from(tableElement.querySelectorAll("tr"));
  for (const row of rows) {
    const cell = row.children.item(columnIndex) as HTMLElement | null;
    if (!cell) continue;

    const pos = editor.view.posAtDOM(cell, 0);
    const textPos = Math.max(1, pos + 1);
    editor.chain().focus().setTextSelection(textPos).run();
    lastTableSelectionPos.value = textPos;
    activeTableColumnIndex.value = columnIndex;
    return true;
  }

  return false;
};

const updateTableInlineControls = (editor: any) => {
  if (!TABLE_FEATURES_ENABLED) {
    tableInlineControls.visible = false;
    tableEndAddControl.visible = false;
    clearHighlightedTableColumn();
    return;
  }

  const root = editorSurfaceRef.value;
  if (!editor || !root) {
    tableInlineControls.visible = false;
    tableEndAddControl.visible = false;
    clearHighlightedTableColumn();
    return;
  }

  const context = getTableSelectionContext(editor);
  if (!context) {
    tableInlineControls.visible = false;
    tableEndAddControl.visible = false;
    clearHighlightedTableColumn();
    return;
  }

  const rootRect = root.getBoundingClientRect();
  const tableRect = context.tableElement.getBoundingClientRect();
  tableInlineControls.visible = true;
  tableInlineControls.left = Math.max(
    8,
    context.coords.left - rootRect.left + 10,
  );
  tableInlineControls.top = Math.max(8, context.coords.top - rootRect.top - 42);
  tableInlineControls.isHeader = context.isHeader;
  tableEndAddControl.visible = true;
  tableEndAddControl.left = Math.max(
    8,
    Math.min(tableRect.right - rootRect.left - 14, rootRect.width - 24),
  );
  tableEndAddControl.top = Math.max(
    8,
    Math.min(tableRect.bottom - rootRect.top + 8, rootRect.height - 24),
  );

  if (context.isHeader) {
    highlightTableColumn(context.tableElement, context.columnIndex);
    return;
  }

  clearHighlightedTableColumn();
};

const updateSelectionActions = (editor: any) => {
  const root = editorSurfaceRef.value;
  if (!editor || !root) {
    hideSelectionActions();
    return;
  }

  if (isInsertBlockMenuOpen.value || isMoreBlockMenuOpen.value) {
    hideSelectionActions();
    return;
  }

  const selection = editor.state.selection;
  if (selection?.constructor?.name !== "TextSelection") {
    hideSelectionActions();
    return;
  }

  if (!selection || selection.empty) {
    hideSelectionActions();
    return;
  }

  const selectedText = getSelectedText(editor);
  if (!selectedText) {
    hideSelectionActions();
    return;
  }

  const cursorCoords = editor.view.coordsAtPos(selection.to);
  const rootRect = root.getBoundingClientRect();
  const horizontalPadding = 20;
  const localLeft = cursorCoords.left - rootRect.left;
  const clampedLeft = Math.max(
    horizontalPadding,
    Math.min(localLeft, rootRect.width - horizontalPadding),
  );
  const localTop = Math.max(8, cursorCoords.top - rootRect.top - 12);

  selectionActions.value = {
    visible: true,
    left: clampedLeft,
    top: localTop,
    text: selectedText,
  };
};

const runSelectionAction = (action: SelectionActionId) => {
  openAiPanelForSelection(action);
};

const initializeAiPanel = async (mode: SelectionActionId) => {
  if (mode === "summary") {
    await generateSummary();
    return;
  }

  if (mode === "rephrase") {
    await generateRephraseOptions(selectedTransformOperation.value);
    return;
  }

  if (mode === "ask") {
    await ensureAskModels();
    if (!askMessages.value.length) {
      askMessages.value = [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Ask anything about the highlighted text. I can help you reason through it.",
        },
      ];
    }
  }
};

const generateSummary = async () => {
  if (!aiPanelSourceText.value.trim() && aiPanelScope.value === "selection")
    return;

  isSummaryLoading.value = true;
  summaryResult.value = "";
  try {
    const response = await callNoteAiTransform({
      operation: "summarize",
      scope: aiPanelScope.value,
      selectedText: aiPanelSourceText.value,
      applyMode: "return-only",
    });
    summaryResult.value =
      response?.content || "No summary was generated for this selection.";
  } catch (error: any) {
    summaryResult.value = "";
    toast.add({
      title: "Summary failed",
      description: error?.message || "Could not generate summary.",
      color: "error",
    });
  } finally {
    isSummaryLoading.value = false;
  }
};

const generateRephraseOptions = async (
  operation: NoteAiOperation = selectedTransformOperation.value,
) => {
  if (!aiPanelSourceText.value.trim() && aiPanelScope.value === "selection")
    return;

  isRephraseLoading.value = true;
  rephraseOptions.value = [];
  selectedRephraseText.value = null;
  try {
    const config =
      transformOperationOptions.find((item) => item.value === operation) ||
      selectedTransformConfig.value;
    const response = await callNoteAiTransform({
      operation,
      scope: aiPanelScope.value,
      selectedText: aiPanelSourceText.value,
      instruction: config.instruction,
      applyMode: "return-only",
    });

    rephraseOptions.value = response?.content ? [response.content] : [];
  } catch (error: any) {
    toast.add({
      title: `${selectedTransformConfig.value.label} failed`,
      description: error?.message || "Could not generate AI text.",
      color: "error",
    });
  } finally {
    isRephraseLoading.value = false;
  }
};

const applyRephraseSelection = async (nextText: string) => {
  selectedRephraseText.value = nextText;
  if (aiPanelScope.value === "document") {
    const appendToDocument = selectedTransformOperation.value === "questions";
    content.value = appendToDocument
      ? `${content.value.trim()}\n\n${nextText}`.trim()
      : normalizeNoteMarkdown(nextText);
    noteContentType.value = "markdown";
    aiPanelSourceText.value = content.value;
    saveState.value = "idle";
    await persistNote();
    toast.add({
      title: "AI update applied",
      description: appendToDocument
        ? "Generated questions were added to the note."
        : "The full note was updated.",
      color: "success",
    });
    return;
  }

  const editor = editorInstance.value;
  const selection = aiPanelSourceSelection.value;

  if (!editor || !selection) return;

  const chain = editor.chain().focus().setTextSelection(selection);
  if (
    noteContentType.value === "markdown" &&
    typeof editor.markdown?.parse === "function"
  ) {
    try {
      const parsed = editor.markdown.parse(nextText);
      const parsedContent = Array.isArray(parsed?.content)
        ? parsed.content
        : null;

      if (parsedContent?.length) {
        chain.insertContent(parsedContent).run();
      } else {
        chain.insertContent(nextText).run();
      }
    } catch {
      chain.insertContent(nextText).run();
    }
  } else {
    chain.insertContent(nextText).run();
  }

  aiPanelSourceSelection.value = {
    from: selection.from,
    to: selection.from + nextText.length,
  };
  aiPanelSourceText.value = nextText;
  saveState.value = "idle";
  await nextTick();
  await persistNote();

  toast.add({
    title: "AI text applied",
    description: "The selected text was updated and saved.",
    color: "success",
  });
};

const appendAiText = async (nextText: string) => {
  content.value =
    `${content.value.trim()}\n\n${normalizeNoteMarkdown(nextText)}`.trim();
  noteContentType.value = "markdown";
  saveState.value = "idle";
  await persistNote();
  toast.add({
    title: "Added to note",
    description: "The AI response was appended to your note.",
    color: "success",
  });
};

const replaceNoteWithAiText = async (nextText: string) => {
  content.value = normalizeNoteMarkdown(nextText);
  noteContentType.value = "markdown";
  saveState.value = "idle";
  await persistNote();
  toast.add({
    title: "Note replaced",
    description: "The note was updated with the AI response.",
    color: "success",
  });
};

const copyAiText = async (nextText: string) => {
  await navigator.clipboard.writeText(nextText);
  toast.add({
    title: "Copied",
    description: "The AI response was copied to your clipboard.",
    color: "success",
  });
};

const ensureAskModels = async () => {
  if (askModels.value.length || isModelsLoading.value) return;

  isModelsLoading.value = true;
  try {
    askModels.value = [
      { label: "Google Standard", value: "google-standard" },
      { label: "Local Basic", value: "local-basic" },
    ];
    selectedAskModel.value = askModels.value[0]?.value || "";
  } catch (error: any) {
    toast.add({
      title: "Models unavailable",
      description: error?.message || "Could not load available AI models.",
      color: "error",
    });
  } finally {
    isModelsLoading.value = false;
  }
};

const parseDraftUrls = () =>
  draftForm.urls
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean);

const createAiDraftNote = async () => {
  const prompt = draftForm.prompt.trim();
  if (!prompt) {
    toast.add({
      title: "Prompt required",
      description: "Tell the AI what note you want to create.",
      color: "warning",
    });
    return;
  }

  isDraftingNote.value = true;
  toast.add({
    title: "Drafting note",
    description:
      "AI is generating and saving your note. Please keep this open.",
    color: "primary",
  });
  try {
    const draftTitle =
      draftForm.title.trim() ||
      titleDraft.value.trim() ||
      title.value.trim() ||
      "AI Draft";
    const response = await $api.mutate<NoteAiDraftResponse>(
      "/api/notes/ai/draft",
      {
        method: "POST",
        body: {
          title: draftTitle,
          prompt,
          projectId:
            typeof route.query.projectId === "string"
              ? route.query.projectId
              : null,
          context: draftForm.context.trim() || null,
          urls: parseDraftUrls(),
          includeWeb: draftForm.includeWeb,
          save: true,
          aiTier: selectedAskModel.value || "google-standard",
        },
      },
    );

    title.value = response?.title || draftTitle;
    titleDraft.value = title.value === "Untitled" ? "" : title.value;
    content.value = normalizeNoteMarkdown(response?.content);
    noteContentType.value = "markdown";
    currentBackendNoteId.value = response?.noteId || currentBackendNoteId.value;
    hasInitialized.value = true;
    saveState.value = response?.saved ? "saved" : "idle";
    lastSavedAt.value = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (response?.noteId) {
      await router.replace({
        path: `/dashboard/notes/${response.noteId}`,
        query: route.query,
      });
    }

    isDraftModalOpen.value = false;
    draftForm.prompt = "";
    draftForm.context = "";
    draftForm.urls = "";
    draftForm.includeWeb = false;

    toast.add({
      title: "Draft created",
      description: "Your AI-generated note is ready to edit.",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Draft failed",
      description: error?.message || "Could not create the AI draft.",
      color: "error",
    });
  } finally {
    isDraftingNote.value = false;
  }
};

const sendAskMessage = async () => {
  const text = askInput.value.trim();
  if (!text || isAskLoading.value) return;

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user" as const,
    content: text,
  };

  askMessages.value.push(userMessage);
  askInput.value = "";
  isAskLoading.value = true;

  try {
    const response = await callNoteAiTransform({
      operation: "custom",
      scope: "selection",
      selectedText: aiPanelSourceText.value,
      instruction: tutorMode.value
        ? `Guide me toward the answer instead of giving it directly. Use questions and hints. ${text}`
        : text,
      applyMode: "return-only",
    });

    askMessages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: response?.content || "I couldn't generate a response right now.",
    });
  } catch (error: any) {
    askMessages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: error?.message || "The demo assistant failed to respond.",
    });
  } finally {
    isAskLoading.value = false;
  }
};

const regenerateAskReply = async () => {
  if (isAskLoading.value) return;

  const lastUserMessage = [...askMessages.value]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserMessage) {
    toast.add({
      title: "No message to regenerate",
      description: "Send a message first.",
      color: "warning",
    });
    return;
  }

  if (askMessages.value[askMessages.value.length - 1]?.role === "assistant") {
    askMessages.value.pop();
  }

  isAskLoading.value = true;
  try {
    const response = await callNoteAiTransform({
      operation: "custom",
      scope: "selection",
      selectedText: aiPanelSourceText.value,
      instruction: lastUserMessage.content,
      applyMode: "return-only",
    });

    askMessages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        response?.content || "I couldn't regenerate a response right now.",
    });
  } catch (error: any) {
    askMessages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: error?.message || "Failed to regenerate response.",
    });
  } finally {
    isAskLoading.value = false;
  }
};

const restoreTableFocus = (editor: any) => {
  if (editor?.isActive?.("table")) {
    const currentCellPos = getTableCellTextPos(editor);
    if (currentCellPos !== null) {
      lastTableSelectionPos.value = currentCellPos;
    }
    return true;
  }

  if (lastTableSelectionPos.value !== null) {
    editor.chain().focus().setTextSelection(lastTableSelectionPos.value).run();
    if (editor?.isActive?.("table")) return true;
  }

  const dragPos = dragHandleNodePos.value;
  if (dragPos !== null && dragPos !== undefined) {
    const node = editor.state.doc.nodeAt(dragPos);
    if (node?.type?.name === "table") {
      if (focusTableAtPos(editor, dragPos)) return true;
    }
  }

  return false;
};

const getTablePosFromSelection = (editor: any): number | null => {
  const anchor = editor?.state?.selection?.$anchor;
  if (!anchor) return null;

  for (let depth = anchor.depth; depth > 0; depth -= 1) {
    const node = anchor.node(depth);
    if (node?.type?.name === "table") {
      return anchor.before(depth);
    }
  }

  return null;
};

const getFirstTablePos = (editor: any): number | null => {
  let foundPos: number | null = null;
  editor?.state?.doc?.descendants?.((node: any, pos: number) => {
    if (node?.type?.name === "table") {
      foundPos = pos;
      return false;
    }
    return true;
  });

  return foundPos;
};

const getTableCellTextPos = (editor: any): number | null => {
  const anchor = editor?.state?.selection?.$anchor;
  if (!anchor) return null;

  for (let depth = anchor.depth; depth > 0; depth -= 1) {
    const node = anchor.node(depth);
    if (
      node?.type?.name === "tableCell" ||
      node?.type?.name === "tableHeader"
    ) {
      return Math.max(1, anchor.before(depth) + 1);
    }
  }

  return null;
};

const focusTableAtPos = (editor: any, tablePos: number) => {
  try {
    let firstCellPos: number | null = null;
    editor.state.doc.descendants((node: any, pos: number) => {
      const inTableBounds = pos > tablePos;
      if (
        inTableBounds &&
        node?.type?.name &&
        (node.type.name === "tableCell" || node.type.name === "tableHeader")
      ) {
        firstCellPos = pos;
        return false;
      }
      return true;
    });

    if (firstCellPos !== null) {
      editor
        .chain()
        .focus()
        .setTextSelection(firstCellPos + 1)
        .run();
    } else {
      editor.chain().focus().setNodeSelection(tablePos).run();
      editor.chain().focus().goToNextCell().run();
    }

    return editor.isActive("table");
  } catch {
    return false;
  }
};

const getLastTableCellPos = (editor: any, tablePos: number): number | null => {
  const tableNode = editor?.state?.doc?.nodeAt?.(tablePos);
  if (!tableNode) return null;

  const tableEndPos = tablePos + tableNode.nodeSize;
  let lastCellPos: number | null = null;

  editor.state.doc.descendants((node: any, pos: number) => {
    const inTableBounds = pos > tablePos && pos < tableEndPos;
    if (!inTableBounds) return true;

    if (
      node?.type?.name === "tableCell" ||
      node?.type?.name === "tableHeader"
    ) {
      lastCellPos = pos;
    }
    return true;
  });

  return lastCellPos;
};

const addTableRowAtEnd = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  const tablePos = getTablePosFromSelection(editor) ?? getFirstTablePos(editor);
  if (tablePos === null) {
    toast.add({
      title: "Table action failed",
      description: "Place the cursor inside a table first.",
      color: "error",
    });
    return;
  }

  const lastCellPos = getLastTableCellPos(editor, tablePos);
  if (lastCellPos !== null) {
    editor
      .chain()
      .focus()
      .setTextSelection(lastCellPos + 1)
      .run();
    lastTableSelectionPos.value = lastCellPos + 1;
  } else {
    focusTableAtPos(editor, tablePos);
  }

  runTableCommand((commands) => commands.addRowAfter(), "Row added");
};

const executeTableCommand = (
  editor: any,
  commandFactory: (commands: any) => any,
) => {
  try {
    if (editor?.isActive?.("table")) {
      restoreTableFocus(editor);
    } else {
      restoreSelection(editor)?.run?.();
    }
    editor.commands.focus?.();
    return Boolean(commandFactory(editor.commands));
  } catch {
    return false;
  }
};

const runTableCommand = (
  commandFactory: (commands: any) => any,
  successMessage: string,
  requireTable = true,
) => {
  const editor = editorInstance.value;
  if (!editor) return;

  try {
    let didRun = executeTableCommand(editor, commandFactory);

    if (!didRun && requireTable) {
      if (!restoreTableFocus(editor)) {
        const activeTablePos = getTablePosFromSelection(editor);
        if (activeTablePos !== null) {
          focusTableAtPos(editor, activeTablePos);
        } else {
          const firstTablePos = getFirstTablePos(editor);
          if (firstTablePos !== null) {
            focusTableAtPos(editor, firstTablePos);
          }
        }
      }

      didRun = executeTableCommand(editor, commandFactory);
    }

    if (!didRun) throw new Error("Table command failed");

    toast.add({
      title: successMessage,
      color: "success",
    });

    if (editor.isActive("table")) {
      lastTableSelectionPos.value = editor.state.selection.from;
    }
  } catch {
    toast.add({
      title: "Table action failed",
      description: "Place the cursor inside a table cell and try again.",
      color: "error",
    });
  }
};

const insertTable = () => {
  const rows = Math.min(20, Math.max(1, Number(tableConfig.rows) || 3));
  const cols = Math.min(10, Math.max(1, Number(tableConfig.columns) || 3));
  tableConfig.rows = rows;
  tableConfig.columns = cols;
  runTableCommand(
    (commands) =>
      commands.insertTable({
        rows,
        cols,
        withHeaderRow: tableConfig.withHeaderRow,
      }),
    "Table inserted",
    false,
  );
  isTableMenuOpen.value = false;
};

const addTableRow = () => {
  runTableCommand((commands) => commands.addRowAfter(), "Row added");
};

const removeTableRow = () => {
  runTableCommand((commands) => commands.deleteRow(), "Row removed");
};

const addTableColumn = () => {
  runTableCommand((commands) => commands.addColumnAfter(), "Column added");
};
const addTableColumnAfter = () => {
  addTableColumn();
};

const addTableColumnBefore = () => {
  runTableCommand((commands) => commands.addColumnBefore(), "Column added");
};

const removeTableColumn = () => {
  runTableCommand((commands) => commands.deleteColumn(), "Column removed");
};

const addHeaderColumnLeft = () => {
  const current = activeTableColumnIndex.value;
  if (current === null) return;
  if (!focusTableColumnByIndex(current)) return;
  runTableCommand((commands) => commands.addColumnBefore(), "Column added");
};

const addHeaderColumnRight = () => {
  const current = activeTableColumnIndex.value;
  if (current === null) return;
  if (!focusTableColumnByIndex(current)) return;
  runTableCommand((commands) => commands.addColumnAfter(), "Column added");
};

const removeHeaderCurrentColumn = () => {
  const current = activeTableColumnIndex.value;
  if (current === null) return;
  if (!focusTableColumnByIndex(current)) return;
  runTableCommand((commands) => commands.deleteColumn(), "Column removed");
};

const removeHeaderLeftColumn = () => {
  const current = activeTableColumnIndex.value;
  if (current === null) return;
  if (current <= 0) {
    toast.add({ title: "No left column to remove", color: "warning" });
    return;
  }
  if (!focusTableColumnByIndex(current - 1)) return;
  runTableCommand((commands) => commands.deleteColumn(), "Left column removed");
};

const removeHeaderRightColumn = () => {
  const current = activeTableColumnIndex.value;
  if (current === null) return;
  const total = getActiveTableColumnCount();
  if (current >= total - 1) {
    toast.add({ title: "No right column to remove", color: "warning" });
    return;
  }
  if (!focusTableColumnByIndex(current + 1)) return;
  runTableCommand(
    (commands) => commands.deleteColumn(),
    "Right column removed",
  );
};

const toggleTableHeader = () => {
  tableConfig.withHeaderRow = !tableConfig.withHeaderRow;
  runTableCommand(
    (commands) => commands.toggleHeaderRow(),
    "Header row toggled",
  );
};

const deleteTable = () => {
  runTableCommand((commands) => commands.deleteTable(), "Table removed");
};

const handleDragHandleNodeChange = (payload: { node: any; pos: number }) => {
  dragHandleNodePos.value = payload.pos;
  if (payload?.node?.type?.name !== "table") return;

  const editor = editorInstance.value;
  if (!editor) return;

  if (focusTableAtPos(editor, payload.pos)) {
    const tableCellPos = getTableCellTextPos(editor);
    if (tableCellPos !== null) {
      lastTableSelectionPos.value = tableCellPos;
    }
  }
};

const focusDragHandleNode = () => {
  const editor = editorInstance.value;
  const pos = dragHandleNodePos.value;
  if (!editor || pos === null || pos === undefined) return false;

  const node = editor.state.doc.nodeAt(pos);
  if (!node) return false;

  const insideNodePos = Math.min(pos + node.nodeSize - 1, pos + 1);
  editor.chain().focus().setTextSelection(insideNodePos).run();
  return true;
};

const setParagraphFromHandle = () => {
  if (!focusDragHandleNode()) return;
  editorInstance.value?.chain().focus().setParagraph().run();
};

const setHeadingFromHandle = (level: 1 | 2) => {
  if (!focusDragHandleNode()) return;
  editorInstance.value?.chain().focus().toggleHeading({ level }).run();
};

const setBulletListFromHandle = () => {
  if (!focusDragHandleNode()) return;
  editorInstance.value?.chain().focus().toggleBulletList().run();
};

const setCodeBlockFromHandle = () => {
  if (!focusDragHandleNode()) return;
  editorInstance.value?.chain().focus().toggleCodeBlock().run();
};

const moveDragHandleNode = (direction: "up" | "down") => {
  const editor = editorInstance.value;
  const pos = dragHandleNodePos.value;
  if (!editor || pos === null || pos === undefined) return;

  const blocks: Array<{ node: any; pos: number }> = [];
  editor.state.doc.forEach((node: any, offset: number) => {
    blocks.push({ node, pos: offset });
  });

  let index = blocks.findIndex((block) => block.pos === pos);
  if (index === -1) {
    index = blocks.findIndex(
      (block) => pos >= block.pos && pos < block.pos + block.node.nodeSize,
    );
  }
  if (index === -1) return;

  if (direction === "up" && index === 0) {
    toast.add({ title: "Block is already at the top", color: "neutral" });
    return;
  }

  if (direction === "down" && index === blocks.length - 1) {
    toast.add({ title: "Block is already at the bottom", color: "neutral" });
    return;
  }

  const current = blocks[index];
  const target = direction === "up" ? blocks[index - 1] : blocks[index + 1];
  if (!current || !target) return;
  const tr = editor.state.tr;

  if (direction === "up") {
    tr.delete(current.pos, current.pos + current.node.nodeSize);
    tr.insert(target.pos, current.node);
    dragHandleNodePos.value = target.pos;
  } else {
    const insertPos = target.pos + target.node.nodeSize;
    tr.insert(insertPos, current.node);
    tr.delete(current.pos, current.pos + current.node.nodeSize);
    dragHandleNodePos.value = insertPos - current.node.nodeSize;
  }

  editor.view.dispatch(tr.scrollIntoView());
  toast.add({
    title: direction === "up" ? "Block moved up" : "Block moved down",
    color: "success",
  });
};

const duplicateDragHandleNode = () => {
  const editor = editorInstance.value;
  const pos = dragHandleNodePos.value;
  if (!editor || pos === null || pos === undefined) return;

  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;

  editor
    .chain()
    .focus()
    .insertContentAt(pos + node.nodeSize, node.toJSON())
    .run();
  toast.add({
    title: "Block duplicated",
    color: "success",
  });
};

const deleteDragHandleNode = () => {
  const editor = editorInstance.value;
  const pos = dragHandleNodePos.value;
  if (!editor || pos === null || pos === undefined) return;

  editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
  toast.add({
    title: "Block deleted",
    color: "success",
  });
};

const applyHeading = (level: 1 | 2 | 3) => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleHeading({ level }).run();
};

const applyParagraph = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.setParagraph().run();
};

const toggleBold = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleBold().run();
};

const toggleItalic = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleItalic().run();
};

const toggleStrike = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleStrike().run();
};

const toggleCode = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleCode().run();
};

const toggleBulletList = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleBulletList().run();
};

const toggleOrderedList = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleOrderedList().run();
};

const toggleBlockquote = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleBlockquote().run();
};

const toggleCodeBlock = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  restoreSelection(editor)?.toggleCodeBlock().run();
};

const insertLink = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  const url = window.prompt("Enter a URL");
  if (!url) return;

  restoreSelection(editor)?.setLink({ href: url }).run();
};

const applyTextColor = () => {
  const editor = editorInstance.value;
  if (!editor) return;
  restoreSelection(editor)?.setColor(selectedTextColor.value).run();
  isTextColorMenuOpen.value = false;
};

const clearTextColor = () => {
  const editor = editorInstance.value;
  if (!editor) return;
  restoreSelection(editor)?.unsetColor().run();
  isTextColorMenuOpen.value = false;
};

const undoChange = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  editor.chain().focus().undo().run();
};

const redoChange = () => {
  const editor = editorInstance.value;
  if (!editor) return;

  editor.chain().focus().redo().run();
};

const setEditorInstance = (editor: any) => {
  if (!editor) return false;
  if (editorInstance.value === editor) return true;

  editorInstance.value = editor;
  const selection = editor.state.selection;
  lastSelection.value = { from: selection.from, to: selection.to };
  if (editor.isActive("table") || getTablePosFromSelection(editor) !== null) {
    const tableCellPos = getTableCellTextPos(editor);
    lastTableSelectionPos.value = tableCellPos ?? selection.from;
  }
  updateSelectionActions(editor);
  updateTableInlineControls(editor);

  editor.on("selectionUpdate", ({ editor: currentEditor }: any) => {
    const selectionUpdate = currentEditor.state.selection;
    lastSelection.value = {
      from: selectionUpdate.from,
      to: selectionUpdate.to,
    };
    if (
      currentEditor.isActive("table") ||
      getTablePosFromSelection(currentEditor) !== null
    ) {
      const tableCellPos = getTableCellTextPos(currentEditor);
      lastTableSelectionPos.value = tableCellPos ?? selectionUpdate.from;
    }
    updateSelectionActions(currentEditor);
    updateTableInlineControls(currentEditor);
  });
  editor.on("blur", () => {
    hideSelectionActions();
    tableInlineControls.visible = false;
    tableEndAddControl.visible = false;
    clearHighlightedTableColumn();
  });

  return true;
};

const handleGlobalPointerDown = (event: MouseEvent) => {
  const target = event.target as Node | null;
  if (!target) return;
  if (editorSurfaceRef.value?.contains(target)) return;
  hideSelectionActions();
  tableInlineControls.visible = false;
  tableEndAddControl.visible = false;
  clearHighlightedTableColumn();
};

onMounted(async () => {
  window.addEventListener("keydown", handleSaveShortcut);
  window.addEventListener("mousedown", handleGlobalPointerDown);
  await loadNote();
  hydrateCachedNoteChat();
  await loadNoteChatHistory();
  await runAutoNoteCompanionAction();

  if (typeof route.query.jobId === "string" && route.query.jobId) {
    void pollNoteJob(route.query.jobId);
  }

  if (!isNewNote.value) {
    void $api
      .mutate(`/api/notes/${noteId.value}/activity`, {
        method: "POST",
        body: { eventType: "opened" },
      })
      .catch(() => undefined);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleSaveShortcut);
  window.removeEventListener("mousedown", handleGlobalPointerDown);
  clearHighlightedTableColumn();
});

onBeforeRouteLeave(async () => {
  await persistNote();
});
</script>

<template>
  <div
    class="ga-surface flex h-[calc(100vh-var(--ui-header-height))] min-h-0 flex-col overflow-hidden"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="attachImage"
    />

    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin" />
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header
        class="border-b border-[var(--ga-border)] bg-[var(--ga-surface)] px-4 py-3 sm:px-6"
      >
        <div class="flex items-center justify-between gap-3">
          <div
            v-if="isWorkspaceHeaderCollapsed"
            class="flex min-w-0 items-center gap-2"
          >
            <UIcon
              name="i-lucide-notebook-pen"
              class="ga-icon h-4 w-4 shrink-0"
            />
            <p class="ga-heading truncate text-sm font-bold">{{ pageTitle }}</p>
            <UBadge
              :color="
                saveState === 'error'
                  ? 'error'
                  : saveState === 'saved'
                    ? 'success'
                    : 'neutral'
              "
              variant="subtle"
              size="sm"
            >
              {{ saveLabel }}
            </UBadge>
          </div>
          <div v-else class="flex items-center gap-2">
            <UButton
              icon="i-lucide-arrow-left"
              label="Back"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="router.back()"
            />
            <span
              class="ga-subtle text-[10px] font-bold uppercase tracking-[0.18em]"
            >
              AI study notebook
            </span>
          </div>
          <UButton
            :icon="
              isWorkspaceHeaderCollapsed
                ? 'i-lucide-chevron-down'
                : 'i-lucide-chevron-up'
            "
            :label="
              isWorkspaceHeaderCollapsed ? 'Show note controls' : 'Focus mode'
            "
            color="neutral"
            variant="ghost"
            size="sm"
            @click="isWorkspaceHeaderCollapsed = !isWorkspaceHeaderCollapsed"
          />
        </div>

        <div
          v-if="!isWorkspaceHeaderCollapsed"
          class="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-notebook-pen" class="ga-icon h-4 w-4" />
              <p
                class="ga-subtle text-[10px] font-bold uppercase tracking-[0.18em]"
              >
                Current note
              </p>
              <UBadge
                :color="
                  saveState === 'error'
                    ? 'error'
                    : saveState === 'saved'
                      ? 'success'
                      : 'neutral'
                "
                variant="subtle"
                size="sm"
              >
                {{ noteStatusLabel }}
              </UBadge>
              <UBadge variant="subtle" color="neutral" size="sm">
                {{ sourceBadge }}
              </UBadge>
            </div>

            <div
              v-if="isEditingTitle"
              class="mt-2 flex max-w-3xl items-center gap-2"
            >
              <UInput
                v-model="titleDraft"
                size="xl"
                placeholder="Untitled"
                class="w-full"
                @keydown="handleTitleKeydown"
              />
              <UButton
                icon="i-lucide-check"
                color="primary"
                variant="soft"
                @click="commitTitleChange"
              />
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                @click="cancelTitleEdit"
              />
            </div>
            <button
              v-else
              type="button"
              class="ga-heading mt-2 flex max-w-3xl items-center gap-2 text-left font-serif text-3xl font-semibold tracking-tight transition hover:text-[var(--ga-primary)]"
              @click="beginTitleEdit"
            >
              <span class="truncate">{{ pageTitle }}</span>
              <UIcon
                name="i-lucide-pencil-line"
                class="h-4 w-4 shrink-0 opacity-60"
              />
            </button>
            <p class="ga-muted mt-1 text-xs">
              Markdown-style note with autosave. Highlight text for Explain,
              Rephrase, Summarise, or Improve.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UDropdownMenu :items="documentAiItems">
              <UButton
                icon="i-lucide-sparkles"
                label="AI tools"
                variant="outline"
                size="sm"
              />
            </UDropdownMenu>
            <UButton
              icon="i-lucide-file-plus-2"
              label="AI draft"
              variant="outline"
              size="sm"
              @click="openDraftModal"
            />
            <UButton
              icon="i-lucide-image-plus"
              label="Attach image"
              variant="outline"
              size="sm"
              @click="triggerImagePicker"
            />
            <UButton
              icon="i-lucide-save"
              label="Save"
              color="primary"
              size="sm"
              :loading="isSaving"
              @click="saveCurrentNote"
            />
          </div>
        </div>

        <div
          v-if="!isWorkspaceHeaderCollapsed && isSourceProcessing"
          class="mt-4 rounded-2xl border border-[var(--ga-primary-soft-strong)] bg-[var(--ga-primary-soft)] p-3"
        >
          <div class="mb-2 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-loader-circle"
                class="h-4 w-4 animate-spin text-[var(--ga-primary)]"
              />
              <p class="text-sm font-semibold text-[var(--ga-primary)]">
                {{ noteJobMessage || "Analysing source..." }}
              </p>
            </div>
            <span class="ga-subtle text-xs">{{ noteJobProgress || 12 }}%</span>
          </div>
          <UProgress :model-value="noteJobProgress || 12" color="primary" />
        </div>

        <div
          v-if="!isWorkspaceHeaderCollapsed && sourceIssue"
          class="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3"
        >
          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-triangle-alert"
              class="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
            />
            <p class="text-sm leading-6 text-amber-800 dark:text-amber-200">
              {{ sourceIssue }}
            </p>
          </div>
        </div>

        <div
          v-if="!isWorkspaceHeaderCollapsed"
          class="mt-4 flex flex-wrap items-center gap-2"
        >
          <button
            v-for="action in aiStudioActions"
            :key="action.title"
            type="button"
            :disabled="action.disabled"
            class="ga-surface-soft ga-muted inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-[var(--ga-primary)] hover:text-[var(--ga-primary)] disabled:cursor-not-allowed disabled:opacity-45"
            @click="action.onSelect"
          >
            <UIcon :name="action.icon" class="h-4 w-4" />
            {{ action.title }}
          </button>
          <span class="ga-subtle ml-auto text-[11px]">
            {{ imageCount }}/{{ MAX_NOTE_IMAGES }} images ·
            {{ contentCharacterCount }}/{{ MAX_CONTENT_LENGTH }} characters
          </span>
        </div>

        <div
          v-if="!isWorkspaceHeaderCollapsed"
          class="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--ga-border)] pt-3"
        >
          <UButton
            v-for="tab in noteTabs"
            :key="tab.value"
            type="button"
            :icon="tab.icon"
            :label="tab.label"
            size="lg"
            color="neutral"
            variant="outline"
            :active="activeNoteTab === tab.value"
            active-color="primary"
            active-variant="solid"
            class="rounded-xl text-xs font-semibold transition"
            @click="activeNoteTab = tab.value"
          />
        </div>
      </header>

      <div
        class="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_410px]"
      >
        <div class="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
          <div class="mx-auto max-w-5xl">
            <div
              v-if="activeNoteTab === 'work-note'"
              ref="editorSurfaceRef"
              class="relative"
            >
              <UEditor
                v-slot="{ editor }"
                v-model="content"
                :content-type="noteContentType"
                :extensions="editorExtensions"
                :autofocus="'end'"
                :placeholder="'Start writing your note here...'"
                :handlers="aiBubbleHandlers"
                :editor-props="editorProps"
                :ui="{
                  root: 'relative border border-default bg-default shadow-sm',
                  content:
                    'min-h-[calc(100vh-18rem)] px-6 pb-8 pt-16 text-base leading-7 focus:outline-none sm:px-10 sm:pb-10 sm:pt-20 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-default [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-default [&_td]:px-3 [&_td]:py-2',
                }"
                class="w-full"
              >
                <div
                  v-if="setEditorInstance(editor)"
                  @mousedown.prevent
                  class="sticky top-0 z-20 flex items-center justify-between gap-4 overflow-x-auto border-b border-default bg-default/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4"
                >
                  <div class="flex items-center gap-2">
                    <UButton
                      icon="i-lucide-undo"
                      variant="ghost"
                      size="sm"
                      @click="undoChange"
                    />
                    <UButton
                      icon="i-lucide-redo"
                      variant="ghost"
                      size="sm"
                      @click="redoChange"
                    />
                    <USeparator orientation="vertical" class="h-6" />
                    <UButton
                      label="P"
                      variant="ghost"
                      size="sm"
                      @click="applyParagraph"
                    />
                    <UButton
                      label="H1"
                      variant="ghost"
                      size="sm"
                      @click="applyHeading(1)"
                    />
                    <UButton
                      label="H2"
                      variant="ghost"
                      size="sm"
                      @click="applyHeading(2)"
                    />
                    <UButton
                      label="H3"
                      variant="ghost"
                      size="sm"
                      @click="applyHeading(3)"
                    />
                    <USeparator orientation="vertical" class="h-6" />
                    <UButton
                      icon="i-lucide-bold"
                      variant="ghost"
                      size="sm"
                      @click="toggleBold"
                    />
                    <UButton
                      icon="i-lucide-italic"
                      variant="ghost"
                      size="sm"
                      @click="toggleItalic"
                    />
                    <UButton
                      icon="i-lucide-strikethrough"
                      variant="ghost"
                      size="sm"
                      @click="toggleStrike"
                    />
                    <UButton
                      icon="i-lucide-code"
                      variant="ghost"
                      size="sm"
                      @click="toggleCode"
                    />
                    <UPopover v-model:open="isTextColorMenuOpen">
                      <UButton
                        icon="i-lucide-palette"
                        variant="ghost"
                        size="sm"
                      />
                      <template #content>
                        <div class="flex items-center gap-2 p-3">
                          <input
                            v-model="selectedTextColor"
                            type="color"
                            class="h-8 w-10 cursor-pointer rounded border border-default bg-transparent p-0"
                          />
                          <UButton
                            size="xs"
                            label="Apply"
                            color="primary"
                            @click="applyTextColor"
                          />
                          <UButton
                            size="xs"
                            label="Clear"
                            variant="outline"
                            @click="clearTextColor"
                          />
                        </div>
                      </template>
                    </UPopover>
                    <USeparator orientation="vertical" class="h-6" />
                    <UButton
                      icon="i-lucide-list"
                      variant="ghost"
                      size="sm"
                      @click="toggleBulletList"
                    />
                    <UButton
                      icon="i-lucide-list-ordered"
                      variant="ghost"
                      size="sm"
                      @click="toggleOrderedList"
                    />
                    <UButton
                      icon="i-lucide-text-quote"
                      variant="ghost"
                      size="sm"
                      @click="toggleBlockquote"
                    />
                    <UButton
                      icon="i-lucide-square-code"
                      variant="ghost"
                      size="sm"
                      @click="toggleCodeBlock"
                    />
                    <UButton
                      icon="i-lucide-link"
                      variant="ghost"
                      size="sm"
                      @click="insertLink"
                    />
                    <UDropdownMenu :items="buildSelectionAiItems(editor)">
                      <UButton
                        icon="i-lucide-sparkles"
                        label="AI selection"
                        color="primary"
                        variant="soft"
                        size="sm"
                        :disabled="!getSelectedText(editor)"
                        @mousedown.prevent
                      />
                    </UDropdownMenu>
                    <USeparator orientation="vertical" class="h-6" />
                    <UPopover
                      v-if="TABLE_FEATURES_ENABLED"
                      v-model:open="isTableMenuOpen"
                    >
                      <UButton
                        icon="i-lucide-table-2"
                        variant="ghost"
                        size="sm"
                        @mousedown.prevent
                      />

                      <template #content>
                        <div class="w-80 space-y-4 p-3">
                          <p class="text-sm font-medium">Insert table</p>

                          <div class="grid grid-cols-2 gap-2">
                            <UFormField label="Rows">
                              <UInputNumber
                                v-model="tableConfig.rows"
                                :min="1"
                                :max="20"
                              />
                            </UFormField>
                            <UFormField label="Columns">
                              <UInputNumber
                                v-model="tableConfig.columns"
                                :min="1"
                                :max="10"
                              />
                            </UFormField>
                          </div>

                          <div
                            class="flex items-center justify-between rounded-lg border border-default p-2"
                          >
                            <span class="text-sm">Header row</span>
                            <USwitch v-model="tableConfig.withHeaderRow" />
                          </div>

                          <UButton
                            color="primary"
                            class="w-full"
                            icon="i-lucide-table"
                            label="Insert table"
                            @click="insertTable"
                          />

                          <USeparator />

                          <p class="text-sm font-medium">
                            Customize selected table
                          </p>
                          <div class="grid grid-cols-2 gap-2">
                            <UButton
                              label="Add row"
                              variant="outline"
                              size="xs"
                              @click="addTableRow"
                            />
                            <UButton
                              label="Remove row"
                              variant="outline"
                              size="xs"
                              @click="removeTableRow"
                            />
                            <UButton
                              label="Add column"
                              variant="outline"
                              size="xs"
                              @click="addTableColumn"
                            />
                            <UButton
                              label="Remove column"
                              variant="outline"
                              size="xs"
                              @click="removeTableColumn"
                            />
                            <UButton
                              label="Toggle header"
                              variant="outline"
                              size="xs"
                              @click="toggleTableHeader"
                            />
                            <UButton
                              label="Delete table"
                              color="error"
                              variant="outline"
                              size="xs"
                              @click="deleteTable"
                            />
                          </div>
                        </div>
                      </template>
                    </UPopover>
                  </div>
                  <UButton
                    icon="i-lucide-image-plus"
                    variant="ghost"
                    color="neutral"
                    @click="openImagePicker(editor)"
                  />
                </div>

                <UEditorSuggestionMenu
                  :editor="editor"
                  :items="slashCommandItems"
                  :filter-fields="['label', 'description']"
                />

                <UEditorEmojiMenu
                  :editor="editor"
                  :items="emojiMenuItems"
                  char=";"
                  plugin-key="emojiMenuSemicolon"
                />
                <UEditorEmojiMenu
                  :editor="editor"
                  :items="emojiMenuItems"
                  char=":"
                  plugin-key="emojiMenuColon"
                />

                <UEditorToolbar
                  :editor="editor"
                  layout="bubble"
                  :items="bubbleToolbarItems"
                />

                <div
                  v-if="TABLE_FEATURES_ENABLED && tableInlineControls.visible"
                  class="pointer-events-none absolute z-30"
                  :style="{
                    left: `${tableInlineControls.left}px`,
                    top: `${tableInlineControls.top}px`,
                  }"
                >
                  <div
                    v-if="tableInlineControls.isHeader"
                    class="pointer-events-auto flex items-center gap-1 rounded-md border border-default bg-default/95 p-1 shadow-sm backdrop-blur"
                  >
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @mousedown.prevent
                      @click="addHeaderColumnLeft"
                    >
                      Add left
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @mousedown.prevent
                      @click="addHeaderColumnRight"
                    >
                      Add right
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @mousedown.prevent
                      @click="removeHeaderLeftColumn"
                    >
                      Remove left
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @mousedown.prevent
                      @click="removeHeaderRightColumn"
                    >
                      Remove right
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="error"
                      @mousedown.prevent
                      @click="removeHeaderCurrentColumn"
                    >
                      Remove this
                    </UButton>
                  </div>
                  <div
                    v-else
                    class="pointer-events-auto flex items-center gap-1 rounded-md border border-default bg-default/95 p-1 shadow-sm backdrop-blur"
                  >
                    <UButton
                      icon="i-lucide-plus"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @mousedown.prevent
                      @click="addTableColumnAfter"
                    />
                    <UDropdownMenu
                      v-model:open="isInlineTableMoreOpen"
                      :items="inlineTableMoreItems"
                    >
                      <UButton
                        icon="i-lucide-ellipsis"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @mousedown.prevent
                      />
                    </UDropdownMenu>
                  </div>
                </div>

                <div
                  v-if="TABLE_FEATURES_ENABLED && tableEndAddControl.visible"
                  class="pointer-events-none absolute z-30"
                  :style="{
                    left: `${tableEndAddControl.left}px`,
                    top: `${tableEndAddControl.top}px`,
                  }"
                >
                  <UButton
                    class="pointer-events-auto"
                    icon="i-lucide-plus"
                    size="xs"
                    color="primary"
                    variant="soft"
                    @mousedown.prevent
                    @click="addTableRowAtEnd"
                  />
                </div>

                <UEditorDragHandle
                  :editor="editor"
                  @node-change="handleDragHandleNodeChange"
                >
                  <template #default>
                    <div
                      class="flex items-center gap-1 rounded-lg border border-default bg-default/95 p-1 shadow-sm backdrop-blur"
                    >
                      <UDropdownMenu
                        v-model:open="isInsertBlockMenuOpen"
                        :items="dragHandleInsertItems"
                      >
                        <UButton
                          icon="i-lucide-plus"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @mousedown.prevent
                        />
                      </UDropdownMenu>
                      <UDropdownMenu
                        v-model:open="isMoreBlockMenuOpen"
                        :items="dragHandleMoreItems"
                      >
                        <UButton
                          icon="i-lucide-ellipsis"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @mousedown.prevent
                        />
                      </UDropdownMenu>
                    </div>
                  </template>
                </UEditorDragHandle>
              </UEditor>
            </div>

            <section
              v-else-if="activeNoteTab === 'study-guide'"
              class="space-y-4"
            >
              <div
                v-if="isStudyGuideGenerating"
                class="ga-surface-warm rounded-[2rem] border p-6"
              >
                <div class="flex items-start gap-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ga-primary-soft)] text-[var(--ga-primary)]"
                  >
                    <UIcon
                      name="i-lucide-loader-circle"
                      class="h-6 w-6 animate-spin"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h2 class="ga-heading font-serif text-2xl font-semibold">
                      Creating your study guide...
                    </h2>
                    <p class="ga-muted mt-2 text-sm leading-6">
                      {{
                        noteJobMessage ||
                        "GapAI is organising this note into revision sections."
                      }}
                    </p>
                    <UProgress
                      :model-value="noteJobProgress || 18"
                      color="primary"
                      class="mt-4"
                    />
                  </div>
                </div>
              </div>

              <div
                v-else-if="!studyGuideNoteId && !studyGuideMarkdown"
                class="ga-surface-warm rounded-[2rem] border p-8 text-center"
              >
                <div
                  class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ga-primary-soft)] text-[var(--ga-primary)]"
                >
                  <UIcon name="i-lucide-book-open-check" class="h-7 w-7" />
                </div>
                <h2 class="ga-heading mt-4 font-serif text-2xl font-semibold">
                  Create a study guide from this note
                </h2>
                <p class="ga-muted mx-auto mt-2 max-w-xl text-sm leading-6">
                  GapAI will turn your work note into Key Points, Definitions,
                  Examples, Common Mistakes, Exam Angles, and a Quick Recap.
                </p>
                <UButton
                  class="mt-5 rounded-xl"
                  icon="i-lucide-sparkles"
                  label="Create study guide"
                  color="primary"
                  :loading="isStudyGuideGenerating"
                  @click="createStudyGuide"
                />
              </div>

              <article
                v-else
                class="ga-surface rounded-[2rem] border p-6 sm:p-10"
              >
                <div
                  class="mb-6 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p
                      class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]"
                    >
                      Linked study guide
                    </p>
                    <h2
                      class="ga-heading mt-1 font-serif text-3xl font-semibold"
                    >
                      Revision structure
                    </h2>
                  </div>
                  <UButton
                    v-if="studyGuideNoteId"
                    label="Open guide note"
                    icon="i-lucide-external-link"
                    variant="outline"
                    :to="`/dashboard/notes/${studyGuideNoteId}`"
                  />
                </div>
                <div
                  class="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-[var(--ga-heading)] prose-p:text-[var(--ga-text-muted)] prose-li:text-[var(--ga-text-muted)]"
                  v-html="renderChatMarkdown(studyGuideSections)"
                />
              </article>
            </section>

            <section v-else class="space-y-4">
              <div class="ga-surface-warm rounded-[2rem] border p-6">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p
                      class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]"
                    >
                      Attached sources
                    </p>
                    <h2
                      class="ga-heading mt-1 font-serif text-3xl font-semibold"
                    >
                      Sources
                    </h2>
                    <p class="ga-muted mt-2 max-w-2xl text-sm leading-6">
                      Sources make the note companion more grounded. Processing,
                      partial extraction, failed extraction, and OCR-needed
                      states are shown here.
                    </p>
                  </div>
                  <UBadge
                    :color="sourceStatusColor(ingestionStatus)"
                    variant="subtle"
                  >
                    {{ ingestionStatus || "editable" }}
                  </UBadge>
                </div>
              </div>

              <div v-if="noteSources.length" class="grid gap-3">
                <div
                  v-for="source in noteSources"
                  :key="source.id || source.url || source.title"
                  class="ga-surface ga-hover-card rounded-2xl border p-4"
                >
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <UIcon
                          :name="
                            String(source.type).toLowerCase() === 'pdf'
                              ? 'i-lucide-file-text'
                              : source.url
                                ? 'i-lucide-link'
                                : 'i-lucide-file'
                          "
                          class="ga-icon h-5 w-5"
                        />
                        <h3 class="ga-heading truncate font-semibold">
                          {{ source.title || "Untitled source" }}
                        </h3>
                      </div>
                      <p
                        v-if="source.url"
                        class="ga-muted mt-2 truncate text-xs"
                      >
                        {{ source.url }}
                      </p>
                      <p class="ga-subtle mt-2 text-xs">
                        {{ String(source.type || "document").toUpperCase() }}
                        <span
                          v-if="source.processedPageCount || source.pageCount"
                        >
                          ·
                          {{ source.processedPageCount || source.pageCount }}
                          pages</span
                        >
                      </p>
                      <p
                        v-if="source.error"
                        class="mt-2 text-xs text-amber-700 dark:text-amber-200"
                      >
                        {{ source.error }}
                      </p>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <UBadge
                        :color="sourceStatusColor(source.status)"
                        variant="subtle"
                      >
                        {{ source.status || "ready" }}
                      </UBadge>
                      <UButton
                        v-if="source.url"
                        label="View source"
                        icon="i-lucide-external-link"
                        size="sm"
                        variant="outline"
                        @click="openSourceUrl(source)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="ga-surface rounded-[2rem] border border-dashed p-8 text-center"
              >
                <UIcon
                  name="i-lucide-file-plus-2"
                  class="ga-icon mx-auto h-10 w-10"
                />
                <h3 class="ga-heading mt-3 font-serif text-2xl font-semibold">
                  No external source attached
                </h3>
                <p class="ga-muted mx-auto mt-2 max-w-lg text-sm leading-6">
                  This is an editable note. Start from the home input with a
                  PDF, DOCX, TXT, Markdown file, or link to attach a source.
                </p>
              </div>
            </section>
          </div>
        </div>

        <aside
          class="hidden min-h-0 border-l border-[var(--ga-border)] bg-[var(--ga-surface-soft)] lg:flex lg:flex-col"
        >
          <div class="border-b border-[var(--ga-border)] p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--ga-primary)] text-white"
              >
                <UIcon name="i-lucide-sparkles" class="h-5 w-5" />
              </div>
              <div>
                <h2 class="ga-heading font-serif text-xl font-semibold">
                  AI Companion
                </h2>
                <p class="ga-subtle text-xs">Context-aware for this note</p>
              </div>
            </div>

            <div
              v-if="isSourceProcessing"
              class="mt-4 rounded-2xl border border-[var(--ga-primary-soft-strong)] bg-[var(--ga-primary-soft)] p-3 text-xs leading-5 text-[var(--ga-primary)]"
            >
              I’m still analysing the source. You can ask general questions, but
              source-grounded answers will improve when processing finishes.
            </div>
          </div>

          <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <div
              v-for="message in noteChatMessages"
              :key="message.id"
              :class="[
                'rounded-2xl px-4 py-3 text-sm leading-6',
                message.role === 'user'
                  ? 'ml-8 bg-(--ga-primary) text-[#fffaf0] dark:text-black shadow-sm'
                  : 'mr-8 border border-(--ga-border) bg-(--ga-surface) text-(--ga-text)',
              ]"
            >
              <div
                :class="[
                  'prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-ol:my-2',
                  message.role === 'user'
                    ? 'prose-invert prose-p:text-[#fffaf0] prose-strong:text-white prose-li:text-[#fffaf0] prose-code:text-white'
                    : '',
                ]"
                v-html="renderChatMarkdown(message.content)"
              />
              <div
                v-if="message.selectedText"
                :class="[
                  'mt-3 overflow-hidden rounded-xl border text-xs',
                  message.role === 'user'
                    ? 'border-white/20 bg-white/15 dark:text-black'
                    : 'border-(--ga-border) bg-(--ga-surface-soft) text-(--ga-text)',
                ]"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                  @click="
                    message.expandedSelectedText = !message.expandedSelectedText
                  "
                >
                  <span class="flex min-w-0 items-center gap-2 font-semibold">
                    <UIcon name="i-lucide-quote" class="h-3.5 w-3.5 shrink-0" />
                    <span class="truncate">Selected text</span>
                  </span>
                  <span class="flex shrink-0 items-center gap-1 opacity-80">
                    {{ message.expandedSelectedText ? "Hide" : "View" }}
                    <UIcon
                      name="i-lucide-chevron-down"
                      :class="[
                        'h-3.5 w-3.5 transition-transform',
                        message.expandedSelectedText ? 'rotate-180' : '',
                      ]"
                    />
                  </span>
                </button>
                <p
                  :class="[
                    'border-t px-3 py-2 leading-5',
                    message.role === 'user'
                      ? 'border-white/15'
                      : 'border-[var(--ga-border)]',
                    message.expandedSelectedText
                      ? 'whitespace-pre-wrap'
                      : 'line-clamp-2',
                  ]"
                >
                  {{ message.selectedText }}
                </p>
              </div>
            </div>
            <div
              v-if="
                isNoteChatSending ||
                (activeNoteJobId && noteJobStatus !== 'completed')
              "
              class="mr-8 rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface)] px-4 py-3 text-sm ga-muted"
            >
              {{ noteChatPendingLabel }}
            </div>
          </div>

          <div class="border-t border-[var(--ga-border)] p-2">
            <div
              class="border border-[var(--ga-border)] bg-[var(--ga-surface)]/70 p-3 shadow-[0_18px_40px_-30px_rgba(79,56,32,0.35)] backdrop-blur"
            >
              <div
                v-if="noteChatSelectedText"
                class="mb-2 flex items-center gap-2 rounded-2xl bg-[var(--ga-primary-soft)] px-3 py-2 text-xs text-[var(--ga-primary)]"
              >
                <UIcon name="i-lucide-quote" class="h-4 w-4 shrink-0" />
                <span class="line-clamp-2 min-w-0 flex-1">{{
                  noteChatSelectedText
                }}</span>
                <button
                  type="button"
                  class="rounded-full p-1 hover:bg-[var(--ga-primary-soft-strong)]"
                  aria-label="Remove selected text"
                  @click="noteChatSelectedText = ''"
                >
                  <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
                </button>
              </div>
              <UTextarea
                ref="noteChatInputRef"
                v-model="noteChatInput"
                :rows="2"
                autoresize
                :maxrows="6"
                :placeholder="noteChatPlaceholder"
                class="w-full"
                :ui="{
                  base: 'max-h-44 min-h-14 border-0 bg-transparent rounded-none text-[16px] leading-6 text-[var(--ga-text)] shadow-none placeholder:text-[var(--ga-muted)] focus:ring-0 lg:text-sm',
                }"
                @keydown.enter.exact.prevent="sendNoteChatMessage()"
              />
              <div class="mt-3 flex items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-2">
                  <UTooltip :text="selectedNoteCompanionOption.tip">
                    <USelect
                      v-model="selectedNoteCompanionAction"
                      :items="noteCompanionActionOptions"
                      value-key="value"
                      label-key="label"
                      class="w-34 shrink-0"
                      :ui="{
                        base: 'rounded-xl border-0 bg-transparent px-1 text-xs font-semibold text-[var(--ga-primary)] shadow-none ring-0 hover:bg-transparent focus:ring-0',
                      }"
                    />
                  </UTooltip>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <UButton
                    icon="i-lucide-arrow-up"
                    color="neutral"
                    variant="ghost"
                    class="h-9 w-9 rounded-full bg-[var(--ga-primary)] text-[#fffaf0] hover:bg-[var(--ga-primary)]/90 hover:text-[#fffaf0] disabled:bg-[var(--ga-primary-soft-strong)] disabled:text-[var(--ga-muted)]"
                    :loading="isNoteChatSending"
                    :disabled="!noteChatInput.trim() || isNoteChatSending"
                    @click="sendNoteChatMessage()"
                  />
                </div>
              </div>
            </div>
            <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="chip in [
                  'Explain this simply',
                  'Improve my note',
                  'Research more',
                  'Make a study guide',
                  'What should I revise next?',
                ]"
                :key="chip"
                type="button"
                class="shrink-0 rounded-full border border-[var(--ga-border)] bg-[var(--ga-surface)] px-3 py-1.5 text-xs font-semibold ga-muted transition hover:border-[var(--ga-primary)] hover:text-[var(--ga-primary)]"
                @click="
                  chip === 'Improve my note'
                    ? ((selectedNoteCompanionAction = 'improve'),
                      sendNoteChatMessage(
                        'Improve the whole note structure, clarity, and study usefulness.',
                      ))
                    : chip === 'Research more'
                      ? ((selectedNoteCompanionAction = 'research-more'),
                        sendNoteChatMessage(
                          'Research this note further and add useful context.',
                        ))
                      : chip === 'Make a study guide'
                        ? ((selectedNoteCompanionAction = 'study-guide'),
                          sendNoteChatMessage(
                            'Create a structured study guide from this note.',
                          ))
                        : chip === 'Explain this simply'
                          ? ((selectedNoteCompanionAction = 'explain'),
                            sendNoteChatMessage(
                              'Explain this note simply while preserving the important ideas.',
                            ))
                          : sendNoteChatMessage(chip)
                "
              >
                {{ chip }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <div
      v-if="canReopenAiPanel"
      class="fixed right-4 top-1/2 z-40 -translate-y-1/2"
    >
      <UButton
        icon="i-lucide-panel-right-open"
        label="AI panel"
        color="primary"
        variant="soft"
        @click="reopenAiPanel"
      />
    </div>

    <USlideover
      v-model:open="isAiPanelOpen"
      side="right"
      :title="aiPanelTitle"
      :description="aiPanelDescription"
      :ui="{ content: 'sm:max-w-xl w-full' }"
    >
      <template #body>
        <div class="flex h-full flex-col gap-4 p-4">
          <div class="flex items-center justify-end gap-2">
            <UButton
              v-if="aiPanelMode === 'summary'"
              icon="i-lucide-refresh-cw"
              label="Regenerate"
              size="sm"
              variant="outline"
              :loading="isSummaryLoading"
              @click="generateSummary"
            />
            <UButton
              v-else-if="aiPanelMode === 'rephrase'"
              icon="i-lucide-refresh-cw"
              label="Regenerate"
              size="sm"
              variant="outline"
              :loading="isRephraseLoading"
              @click="generateRephraseOptions(selectedTransformOperation)"
            />
            <UButton
              v-else-if="aiPanelMode === 'ask'"
              icon="i-lucide-refresh-cw"
              label="Regenerate reply"
              size="sm"
              variant="outline"
              :loading="isAskLoading"
              @click="regenerateAskReply"
            />
          </div>

          <UFormField
            :label="
              aiPanelScope === 'document' ? 'Current note' : 'Selected text'
            "
          >
            <UTextarea
              :model-value="aiPanelSourceText"
              :rows="aiPanelScope === 'document' ? 6 : 4"
              readonly
              class="w-full"
            />
          </UFormField>

          <template v-if="aiPanelMode === 'summary'">
            <div
              v-if="isSummaryLoading"
              class="rounded-lg border border-default bg-muted/30 p-4 text-sm text-muted-foreground"
            >
              Loading... generating text
            </div>
            <div
              v-else-if="summaryResult"
              class="ga-surface rounded-xl border p-4"
            >
              <div
                class="prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground"
                v-html="renderChatMarkdown(summaryResult)"
              />
              <div
                class="mt-4 flex flex-wrap gap-2 border-t border-default pt-3"
              >
                <UButton
                  label="Append"
                  size="xs"
                  variant="outline"
                  @click="appendAiText(summaryResult)"
                />
                <UButton
                  label="Replace note"
                  size="xs"
                  variant="outline"
                  @click="replaceNoteWithAiText(summaryResult)"
                />
                <UButton
                  label="Copy"
                  icon="i-lucide-copy"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="copyAiText(summaryResult)"
                />
              </div>
            </div>
          </template>

          <template v-else-if="aiPanelMode === 'rephrase'">
            <UFormField label="AI action">
              <USelect
                v-model="selectedTransformOperation"
                :items="transformOperationOptions"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <div
              v-if="isRephraseLoading"
              class="rounded-lg border border-default bg-muted/30 p-4 text-sm text-muted-foreground"
            >
              Loading... generating text
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(option, index) in rephraseOptions"
                :key="`${index}-${option.slice(0, 20)}`"
                class="rounded-lg border border-default p-3"
              >
                <div
                  class="prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground"
                  v-html="renderChatMarkdown(option)"
                />
                <div
                  class="mt-3 flex flex-wrap items-center gap-2 border-t border-default pt-3"
                >
                  <UButton
                    :label="
                      selectedRephraseText === option
                        ? 'Selected'
                        : selectedTransformConfig.applyLabel
                    "
                    size="sm"
                    :variant="
                      selectedRephraseText === option ? 'solid' : 'outline'
                    "
                    color="primary"
                    @click="applyRephraseSelection(option)"
                  />
                  <UButton
                    label="Append"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    @click="appendAiText(option)"
                  />
                  <UButton
                    label="Replace note"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    @click="replaceNoteWithAiText(option)"
                  />
                  <UButton
                    label="Copy"
                    icon="i-lucide-copy"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="copyAiText(option)"
                  />
                </div>
              </div>

              <p
                v-if="!rephraseOptions.length"
                class="text-sm text-muted-foreground"
              >
                {{ selectedTransformConfig.emptyLabel }}
              </p>
            </div>
          </template>

          <template v-else-if="aiPanelMode === 'ask'">
            <div
              class="ga-surface-accent flex items-center justify-between rounded-xl border p-3"
            >
              <div>
                <p class="ga-heading text-sm font-medium">Tutor mode</p>
                <p class="ga-muted text-xs">
                  Guide me with hints instead of giving the answer.
                </p>
              </div>
              <USwitch v-model="tutorMode" />
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <UFormField label="Model">
                <USelect
                  v-model="selectedAskModel"
                  :items="askModels"
                  :loading="isModelsLoading"
                  placeholder="Choose a model"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div
              class="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-default bg-muted/20 p-3"
            >
              <div
                v-for="message in askMessages"
                :key="message.id"
                :class="[
                  'max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-white'
                    : 'bg-default text-foreground',
                ]"
                v-html="renderChatMarkdown(message.content)"
              />
              <div
                v-if="isAskLoading"
                class="max-w-[90%] rounded-lg bg-default px-3 py-2 text-sm text-muted-foreground"
              >
                Loading... generating text
              </div>
            </div>

            <div class="mt-auto flex items-end gap-2">
              <UTextarea
                v-model="askInput"
                :rows="2"
                class="w-full"
                placeholder="Ask about your selected text..."
                @keydown.enter.exact.prevent="sendAskMessage"
              />
              <UButton
                icon="i-lucide-send"
                color="primary"
                :loading="isAskLoading"
                :disabled="!askInput.trim()"
                @click="sendAskMessage"
              />
            </div>
          </template>
        </div>
      </template>
    </USlideover>

    <UModal
      v-model:open="isDraftModalOpen"
      title="Draft note with AI"
      description="Create a saved study note from a short prompt, with optional context and sources."
      :ui="{ content: 'sm:max-w-2xl w-full' }"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Title">
            <UInput
              v-model="draftForm.title"
              placeholder="Cell Respiration"
              class="w-full"
              :disabled="isDraftingNote"
            />
          </UFormField>

          <UFormField label="Prompt" required>
            <UTextarea
              v-model="draftForm.prompt"
              :rows="4"
              placeholder="Create a WAEC-friendly study note about cell respiration."
              class="w-full"
              :disabled="isDraftingNote"
            />
          </UFormField>

          <UFormField label="Extra context">
            <UTextarea
              v-model="draftForm.context"
              :rows="3"
              placeholder="Focus on glycolysis, Krebs cycle, and ATP."
              class="w-full"
              :disabled="isDraftingNote"
            />
          </UFormField>

          <UFormField label="Source URLs">
            <UTextarea
              v-model="draftForm.urls"
              :rows="3"
              placeholder="Paste one URL per line or separate with commas"
              class="w-full"
              :disabled="isDraftingNote"
            />
          </UFormField>

          <div
            v-if="isDraftingNote"
            class="rounded-2xl border border-primary/20 bg-primary/5 p-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
              >
                <UIcon
                  name="i-lucide-loader-circle"
                  class="h-5 w-5 animate-spin"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-foreground">
                  Generating your study note
                </p>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                  The backend is drafting the note and saving it to your
                  library. This can take a moment if web sources are enabled.
                </p>
                <UProgress animation="carousel" color="primary" class="mt-3" />
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-between rounded-xl border border-default p-3"
          >
            <div>
              <p class="text-sm font-medium text-foreground">Use web sources</p>
              <p class="text-xs text-muted-foreground">
                Ask the backend to research URLs or web context while drafting.
              </p>
            </div>
            <USwitch
              v-model="draftForm.includeWeb"
              :disabled="isDraftingNote"
            />
          </div>

          <div
            class="flex items-center justify-end gap-2 border-t border-default pt-4"
          >
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              :disabled="isDraftingNote"
              @click="isDraftModalOpen = false"
            />
            <UButton
              :label="isDraftingNote ? 'Drafting note...' : 'Create draft'"
              icon="i-lucide-sparkles"
              color="primary"
              :loading="isDraftingNote"
              :disabled="isDraftingNote || !draftForm.prompt.trim()"
              @click="createAiDraftNote"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
:deep(.ga-table-col-highlight) {
  background-color: color-mix(in srgb, var(--ui-primary) 16%, transparent);
}
</style>
