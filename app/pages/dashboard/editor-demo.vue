<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const contentType = ref<"markdown" | "html">("markdown");
const content = ref(`# Demo Editor

This is a sandbox page to test editor behavior quickly.

1. Ordered list item
2. Ordered list item
`);

const contentTypeItems = [
  { label: "Markdown", value: "markdown" },
  { label: "HTML", value: "html" },
];

const slashItems = [
  [
    { type: "label", label: "Blocks" },
    {
      label: "Paragraph",
      description: "Plain text paragraph",
      icon: "i-lucide-pilcrow",
      kind: "paragraph",
    },
    {
      label: "Heading 1",
      description: "Big heading",
      icon: "i-lucide-heading-1",
      kind: "heading",
      level: 1,
    },
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
  ],
] as any;

const bubbleItems = [
  { icon: "i-lucide-bold", kind: "mark", mark: "bold", tooltip: { text: "Bold" } },
  { icon: "i-lucide-italic", kind: "mark", mark: "italic", tooltip: { text: "Italic" } },
  { icon: "i-lucide-strikethrough", kind: "mark", mark: "strike", tooltip: { text: "Strike" } },
  { icon: "i-lucide-link", kind: "link", tooltip: { text: "Link" } },
  { icon: "i-lucide-list", kind: "bulletList", tooltip: { text: "Bullet list" } },
  { icon: "i-lucide-list-ordered", kind: "orderedList", tooltip: { text: "Ordered list" } },
];

const emojiItems = [
  { name: "Grinning face", emoji: "😀", shortcodes: ["grinning"], tags: ["smile", "happy"] },
  { name: "Rocket", emoji: "🚀", shortcodes: ["rocket"], tags: ["launch"] },
  { name: "Fire", emoji: "🔥", shortcodes: ["fire"], tags: ["hot"] },
  { name: "Check", emoji: "✅", shortcodes: ["check"], tags: ["done"] },
];
</script>

<template>
  <div class="space-y-4 p-2">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Editor Demo</h1>
        <p class="text-sm text-muted-foreground">
          Isolated test page for markdown/html behavior, toolbar, slash command, and emoji.
        </p>
      </div>

      <UFormField label="Mode" class="w-44">
        <USelect v-model="contentType" :items="contentTypeItems" />
      </UFormField>
    </div>

    <UCard>
      <UEditor
        v-slot="{ editor }"
        v-model="content"
        :content-type="contentType"
        :placeholder="'Type here...'"
        :ui="{
          root: 'rounded-xl border border-default',
          content: 'min-h-[420px] px-5 py-4',
        }"
      >
        <UEditorSuggestionMenu
          :editor="editor"
          :items="slashItems"
          :filter-fields="['label', 'description']"
        />
        <UEditorEmojiMenu
          :editor="editor"
          :items="emojiItems"
          char=";"
          plugin-key="demoEmojiSemicolon"
        />
        <UEditorEmojiMenu
          :editor="editor"
          :items="emojiItems"
          char=":"
          plugin-key="demoEmojiColon"
        />
        <UEditorToolbar
          :editor="editor"
          layout="bubble"
          :items="bubbleItems"
        />
      </UEditor>
    </UCard>

    <UCard>
      <template #header>
        <p class="font-medium">Stored Output</p>
      </template>
      <pre class="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">{{ content }}</pre>
    </UCard>
  </div>
</template>
