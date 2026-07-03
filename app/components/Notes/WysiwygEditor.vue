<script setup lang="ts">
import type { ContextMenuItem, DropdownMenuItem } from "@nuxt/ui";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";

const content = defineModel<string>({
  default: "# Untitled\n\nStart writing...",
});

const normalizeSerializedContent = (value: string) =>
  value.replaceAll("&nbsp;", " ").replaceAll("\u00A0", " ");

const editorInstance = shallowRef<any>(null);
const isTableContext = ref(false);
const lastTableSelectionPos = ref<number | null>(null);
const tableBubble = reactive({
  visible: false,
  top: 0,
  left: 0,
});
const textScale = ref<"sm" | "base" | "lg" | "xl">("base");
const isInsertBlockMenuOpen = ref(false);
const isMoreBlockMenuOpen = ref(false);
const isTableFormOpen = ref(false);
const isGraphFormOpen = ref(false);

const tableForm = reactive({ rows: 3, cols: 3, withHeaderRow: true });
const graphForm = reactive({
  title: "Weekly Progress",
  type: "bar" as "bar" | "line",
  labels: "Mon, Tue, Wed, Thu, Fri",
  values: "45, 62, 70, 84, 91",
});

const textScaleItems = [
  { label: "Small", value: "sm" },
  { label: "Normal", value: "base" },
  { label: "Large", value: "lg" },
  { label: "Extra large", value: "xl" },
];

const chartTypeItems = [
  { label: "Bar", value: "bar" },
  { label: "Line", value: "line" },
];

const tableQuickActions = [
  {
    key: "add-row",
    label: "Add row below",
    icon: "i-lucide-rows-3",
    color: "neutral" as const,
    run: (chain: any) => chain.addRowAfter(),
  },
  {
    key: "remove-row",
    label: "Remove row",
    icon: "i-lucide-rows-2",
    color: "neutral" as const,
    run: (chain: any) => chain.deleteRow(),
  },
  {
    key: "add-col",
    label: "Add column right",
    icon: "i-lucide-columns-2",
    color: "neutral" as const,
    run: (chain: any) => chain.addColumnAfter(),
  },
  {
    key: "remove-col",
    label: "Remove column",
    icon: "i-lucide-columns-3",
    color: "neutral" as const,
    run: (chain: any) => chain.deleteColumn(),
  },
  {
    key: "merge-cells",
    label: "Merge cells",
    icon: "i-lucide-table-cells-merge",
    color: "neutral" as const,
    run: (chain: any) => chain.mergeCells(),
  },
  {
    key: "split-cell",
    label: "Split cell",
    icon: "i-lucide-table-cells-split",
    color: "neutral" as const,
    run: (chain: any) => chain.splitCell(),
  },
  {
    key: "toggle-header",
    label: "Toggle header row",
    icon: "i-lucide-heading-1",
    color: "neutral" as const,
    run: (chain: any) => chain.toggleHeaderRow(),
  },
  {
    key: "delete-table",
    label: "Delete table",
    icon: "i-lucide-trash",
    color: "error" as const,
    run: (chain: any) => chain.deleteTable(),
  },
];

const tableBubbleActions = computed(() =>
  tableQuickActions.map((action) => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    color: action.color,
  })),
);

const executeTableQuickAction = (actionKey: string) => {
  const action = tableQuickActions.find((item) => item.key === actionKey);
  if (!action) return;
  const editor = editorInstance.value;
  if (!editor) return;
  let chain = editor.chain().focus();
  if (lastTableSelectionPos.value !== null) {
    chain = chain.setTextSelection(lastTableSelectionPos.value);
  }
  const didRun = action.run(chain).run();
  if (!didRun) {
    action.run(editor.chain().focus()).run();
  }
  updateTableBubble(editor);
};

const slashItems = [
  [
    { type: "label" as const, label: "Basic blocks" },
    {
      label: "Paragraph",
      description: "Plain text",
      icon: "i-lucide-pilcrow",
      kind: "paragraph",
    },
    {
      label: "Heading 1",
      description: "Large heading",
      icon: "i-lucide-heading-1",
      kind: "heading",
      level: 1,
    },
    {
      label: "Heading 2",
      description: "Medium heading",
      icon: "i-lucide-heading-2",
      kind: "heading",
      level: 2,
    },
    {
      label: "Heading 3",
      description: "Small heading",
      icon: "i-lucide-heading-3",
      kind: "heading",
      level: 3,
    },
  ],
  [
    { type: "label" as const, label: "Structure" },
    {
      label: "Bullet list",
      description: "Unordered list",
      icon: "i-lucide-list",
      kind: "bulletList",
    },
    {
      label: "Numbered list",
      description: "Ordered list",
      icon: "i-lucide-list-ordered",
      kind: "orderedList",
    },
    {
      label: "Quote",
      description: "Blockquote",
      icon: "i-lucide-text-quote",
      kind: "blockquote",
    },
    {
      label: "Code block",
      description: "Code snippet",
      icon: "i-lucide-square-code",
      kind: "codeBlock",
    },
    {
      label: "Divider",
      description: "Horizontal rule",
      icon: "i-lucide-minus",
      kind: "horizontalRule",
    },
  ],
];

const bubbleItems = [
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
    icon: "i-lucide-list",
    kind: "bulletList",
    tooltip: { text: "Bullet list" },
  },
  {
    icon: "i-lucide-list-ordered",
    kind: "orderedList",
    tooltip: { text: "Numbered list" },
  },
];

const emojiItems = [
  {
    name: "Grinning face",
    emoji: "😀",
    shortcodes: ["grinning"],
    tags: ["smile", "happy"],
  },
  { name: "Rocket", emoji: "🚀", shortcodes: ["rocket"], tags: ["launch"] },
  { name: "Fire", emoji: "🔥", shortcodes: ["fire"], tags: ["hot"] },
  { name: "Check", emoji: "✅", shortcodes: ["check"], tags: ["done"] },
];

const editorExtensions = [
  TextStyle,
  Color,
  Table.configure({ resizable: true, allowTableNodeSelection: true }),
  TableRow,
  TableHeader,
  TableCell,
];

const updateTableBubble = (editor: any) => {
  if (!editor || !isTableContext.value) {
    tableBubble.visible = false;
    return;
  }

  const { $from } = editor.state.selection;
  let tablePos: number | null = null;

  for (let depth = $from.depth; depth >= 0; depth--) {
    if ($from.node(depth)?.type?.name === "table") {
      tablePos = depth > 0 ? $from.before(depth) : 0;
      break;
    }
  }

  if (tablePos === null) {
    tableBubble.visible = false;
    return;
  }

  const tableEl = editor.view.nodeDOM(tablePos) as HTMLElement | null;
  if (!tableEl) {
    tableBubble.visible = false;
    return;
  }

  const rect = tableEl.getBoundingClientRect();
  tableBubble.left = rect.left + rect.width / 2;
  tableBubble.top = Math.max(8, rect.top - 26);
  tableBubble.visible = true;
};

const setEditorInstance = (editor: any) => {
  if (editorInstance.value === editor) return true;
  editorInstance.value = editor;

  const sanitizeContent = () => {
    const normalized = normalizeSerializedContent(content.value || "");
    if (normalized !== content.value) content.value = normalized;
  };

  const syncContext = () => {
    const currentEditor = editorInstance.value;
    if (!currentEditor) return;
    const { $from } = currentEditor.state.selection;
    let inTable = false;
    for (let depth = $from.depth; depth >= 0; depth--) {
      if ($from.node(depth)?.type?.name === "table") {
        inTable = true;
        break;
      }
    }
    isTableContext.value = inTable;
    lastTableSelectionPos.value = inTable ? $from.pos : null;
    updateTableBubble(currentEditor);
  };

  editor.on("selectionUpdate", syncContext);
  editor.on("transaction", syncContext);
  editor.on("focus", syncContext);
  editor.on("blur", sanitizeContent);
  syncContext();
  return true;
};

const syncBubbleOnViewportChange = () => {
  if (!editorInstance.value) return;
  updateTableBubble(editorInstance.value);
};

onMounted(() => {
  window.addEventListener("scroll", syncBubbleOnViewportChange, true);
  window.addEventListener("resize", syncBubbleOnViewportChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", syncBubbleOnViewportChange, true);
  window.removeEventListener("resize", syncBubbleOnViewportChange);
});

const contextMenuItems = computed<ContextMenuItem[][]>(() => {
  const editor = editorInstance.value;
  const sections: ContextMenuItem[][] = [
    [
      {
        label: "Undo",
        icon: "i-lucide-undo-2",
        onSelect: () => editor?.chain().focus().undo().run(),
      },
      {
        label: "Redo",
        icon: "i-lucide-redo-2",
        onSelect: () => editor?.chain().focus().redo().run(),
      },
    ],
  ];

  if (isTableContext.value) {
    sections.push([
      {
        label: "Table Actions",
        icon: "i-lucide-table-2",
        children: [
          {
            label: "Add row above",
            onSelect: () => editor?.chain().focus().addRowBefore().run(),
          },
          {
            label: "Add row below",
            onSelect: () => editor?.chain().focus().addRowAfter().run(),
          },
          {
            label: "Delete row",
            onSelect: () => editor?.chain().focus().deleteRow().run(),
          },
          { type: "separator" },
          {
            label: "Add column before",
            onSelect: () => editor?.chain().focus().addColumnBefore().run(),
          },
          {
            label: "Add column after",
            onSelect: () => editor?.chain().focus().addColumnAfter().run(),
          },
          {
            label: "Delete column",
            onSelect: () => editor?.chain().focus().deleteColumn().run(),
          },
          { type: "separator" },
          {
            label: "Merge cells",
            onSelect: () => editor?.chain().focus().mergeCells().run(),
          },
          {
            label: "Split cell",
            onSelect: () => editor?.chain().focus().splitCell().run(),
          },
          {
            label: "Toggle header row",
            onSelect: () => editor?.chain().focus().toggleHeaderRow().run(),
          },
          {
            label: "Toggle header column",
            onSelect: () => editor?.chain().focus().toggleHeaderColumn().run(),
          },
          { type: "separator" },
          {
            label: "Delete table",
            color: "error",
            onSelect: () => editor?.chain().focus().deleteTable().run(),
          },
        ],
      },
    ]);
  }

  return sections;
});

const insertTable = () => {
  const editor = editorInstance.value;
  if (!editor) return;
  const rows = Math.min(20, Math.max(1, Number(tableForm.rows) || 3));
  const cols = Math.min(10, Math.max(1, Number(tableForm.cols) || 3));
  editor
    .chain()
    .focus()
    .insertTable({ rows, cols, withHeaderRow: tableForm.withHeaderRow })
    .run();
  isTableFormOpen.value = false;
};

const insertGraphTemplate = () => {
  const editor = editorInstance.value;
  if (!editor) return;
  const labels = graphForm.labels
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const values = graphForm.values
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v));
  const count = Math.min(labels.length, values.length);
  const title = graphForm.title.trim() || "Chart";

  const chartConfig = {
    type: graphForm.type,
    data: {
      labels: labels.slice(0, count),
      datasets: [
        {
          label: title,
          data: values.slice(0, count),
          borderColor: "#378ADD",
          backgroundColor:
            graphForm.type === "line"
              ? "rgba(55,138,221,0.18)"
              : ["#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#BA7517"],
          fill: graphForm.type === "line",
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: title },
      },
    },
  };

  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  editor
    .chain()
    .focus()
    .insertContent(
      `\n<img src="${chartUrl}" alt="${title}" style="width:100%;max-width:100%;border-radius:12px;" />\n`,
    )
    .run();
  isGraphFormOpen.value = false;
};

const insertActions = computed<DropdownMenuItem[]>(() => [
  {
    label: "Paragraph",
    icon: "i-lucide-pilcrow",
    onSelect: () => editorInstance.value?.chain().focus().setParagraph().run(),
  },
  {
    label: "Heading 1",
    icon: "i-lucide-heading-1",
    onSelect: () =>
      editorInstance.value?.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "Heading 2",
    icon: "i-lucide-heading-2",
    onSelect: () =>
      editorInstance.value?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Bullet list",
    icon: "i-lucide-list",
    onSelect: () =>
      editorInstance.value?.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered list",
    icon: "i-lucide-list-ordered",
    onSelect: () =>
      editorInstance.value?.chain().focus().toggleOrderedList().run(),
  },
  { type: "separator" as const },
  {
    label: "Table",
    icon: "i-lucide-table-2",
    onSelect: () => {
      isInsertBlockMenuOpen.value = false;
      isTableFormOpen.value = true;
    },
  },
  {
    label: "Graph block",
    icon: "i-lucide-chart-column-big",
    onSelect: () => {
      isInsertBlockMenuOpen.value = false;
      isGraphFormOpen.value = true;
    },
  },
  {
    label: "Quote",
    icon: "i-lucide-text-quote",
    onSelect: () =>
      editorInstance.value?.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code block",
    icon: "i-lucide-square-code",
    onSelect: () =>
      editorInstance.value?.chain().focus().toggleCodeBlock().run(),
  },
]);

const moreActions = computed<DropdownMenuItem[]>(() => {
  const editor = editorInstance.value;
  const items: DropdownMenuItem[] = [
    {
      label: "Undo",
      icon: "i-lucide-undo-2",
      onSelect: () => editor?.chain().focus().undo().run(),
    },
    {
      label: "Redo",
      icon: "i-lucide-redo-2",
      onSelect: () => editor?.chain().focus().redo().run(),
    },
  ];

  if (isTableContext.value && editor) {
    items.push(
      { type: "separator" as const },
      {
        label: "Add row above",
        icon: "i-lucide-rows-3",
        onSelect: () => editor.chain().focus().addRowBefore().run(),
      },
      {
        label: "Add row below",
        icon: "i-lucide-rows-3",
        onSelect: () => editor.chain().focus().addRowAfter().run(),
      },
      {
        label: "Delete row",
        icon: "i-lucide-rows-2",
        onSelect: () => editor.chain().focus().deleteRow().run(),
      },
      { type: "separator" as const },
      {
        label: "Add column before",
        icon: "i-lucide-columns-2",
        onSelect: () => editor.chain().focus().addColumnBefore().run(),
      },
      {
        label: "Add column after",
        icon: "i-lucide-columns-2",
        onSelect: () => editor.chain().focus().addColumnAfter().run(),
      },
      {
        label: "Delete column",
        icon: "i-lucide-columns-3",
        onSelect: () => editor.chain().focus().deleteColumn().run(),
      },
      { type: "separator" as const },
      {
        label: "Merge cells",
        icon: "i-lucide-table-cells-merge",
        onSelect: () => editor.chain().focus().mergeCells().run(),
      },
      {
        label: "Split cell",
        icon: "i-lucide-table-cells-split",
        onSelect: () => editor.chain().focus().splitCell().run(),
      },
      {
        label: "Toggle header row",
        icon: "i-lucide-heading-1",
        onSelect: () => editor.chain().focus().toggleHeaderRow().run(),
      },
      {
        label: "Toggle header column",
        icon: "i-lucide-heading-1",
        onSelect: () => editor.chain().focus().toggleHeaderColumn().run(),
      },
      { type: "separator" as const },
      {
        label: "Delete table",
        icon: "i-lucide-table-2",
        color: "error" as const,
        onSelect: () => editor.chain().focus().deleteTable().run(),
      },
    );
  }
  return items;
});

const editorContentClass = computed(() => {
  const sizeClass =
    textScale.value === "sm"
      ? "text-sm"
      : textScale.value === "lg"
        ? "text-lg"
        : textScale.value === "xl"
          ? "text-xl"
          : "text-base";
  return [
    "min-h-[calc(100dvh-170px)] px-6 py-5 md:px-10 leading-7",
    sizeClass,
    "[&_table]:w-full [&_table]:border-collapse",
    "[&_th]:border [&_th]:border-default [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2",
    "[&_td]:border [&_td]:border-default [&_td]:px-3 [&_td]:py-2",
    "[&_.selectedCell]:bg-primary/10",
  ].join(" ");
});
</script>

<template>
  <UContextMenu :items="contextMenuItems">
    <UEditor
      v-slot="{ editor }"
      v-model="content"
      content-type="markdown"
      :extensions="editorExtensions"
      :placeholder="{ placeholder: 'Type / for commands', mode: 'firstLine' }"
      :ui="{
        root: 'h-full border-0 rounded-none bg-transparent',
        content: editorContentClass,
      }"
    >
      <NotesEditorTableInsertModal
        :open="isTableFormOpen"
        :rows="tableForm.rows"
        :cols="tableForm.cols"
        :with-header-row="tableForm.withHeaderRow"
        @update:open="isTableFormOpen = $event"
        @update:rows="tableForm.rows = $event"
        @update:cols="tableForm.cols = $event"
        @update:with-header-row="tableForm.withHeaderRow = $event"
        @submit="insertTable"
      />

      <NotesEditorGraphInsertModal
        :open="isGraphFormOpen"
        :title="graphForm.title"
        :type="graphForm.type"
        :labels="graphForm.labels"
        :values="graphForm.values"
        :chart-type-items="chartTypeItems"
        @update:open="isGraphFormOpen = $event"
        @update:title="graphForm.title = $event"
        @update:type="graphForm.type = $event"
        @update:labels="graphForm.labels = $event"
        @update:values="graphForm.values = $event"
        @submit="insertGraphTemplate"
      />

      <NotesEditorTopBar
        v-if="setEditorInstance(editor)"
        :is-table-context="isTableContext"
        :text-scale="textScale"
        :text-scale-items="textScaleItems"
        @update:text-scale="textScale = $event"
      />

      <NotesEditorTableBubbleActions
        :visible="tableBubble.visible"
        :left="tableBubble.left"
        :top="tableBubble.top"
        :actions="tableBubbleActions"
        @action="executeTableQuickAction"
      />

      <UEditorSuggestionMenu
        :editor="editor"
        :items="slashItems"
        :filter-fields="['label', 'description']"
      />
      <UEditorEmojiMenu
        :editor="editor"
        :items="emojiItems"
        char=";"
        plugin-key="notesEmojiSemicolon"
      />
      <UEditorEmojiMenu
        :editor="editor"
        :items="emojiItems"
        char=":"
        plugin-key="notesEmojiColon"
      />
      <UEditorToolbar :editor="editor" layout="bubble" :items="bubbleItems" />

      <UEditorDragHandle :editor="editor">
        <template #default>
          <NotesEditorDragHandleMenu
            :insert-open="isInsertBlockMenuOpen"
            :more-open="isMoreBlockMenuOpen"
            :insert-actions="insertActions"
            :more-actions="moreActions"
            @update:insert-open="isInsertBlockMenuOpen = $event"
            @update:more-open="isMoreBlockMenuOpen = $event"
          />
        </template>
      </UEditorDragHandle>
    </UEditor>
  </UContextMenu>
</template>
