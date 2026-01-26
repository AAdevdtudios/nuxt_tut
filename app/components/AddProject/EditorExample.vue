<template>
  <div class="editor-container space-y-2">
    <!-- Toolbar -->
    <div
      class="flex gap-1 p-2 border border-default rounded-t-lg bg-card overflow-x-auto overflow-y-hidden"
    >
      <!-- Undo/Redo -->
      <UButton
        icon="i-lucide-undo"
        variant="ghost"
        size="sm"
        aria-label="Undo"
        @click="applyFormat('undo')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-redo"
        variant="ghost"
        size="sm"
        aria-label="Redo"
        @click="applyFormat('redo')"
        class="shrink-0"
      />

      <USeparator orientation="vertical" class="h-6 shrink-0" />

      <!-- Text Formatting -->
      <UButton
        icon="i-lucide-bold"
        :color="isFormatActive('bold') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Bold"
        @click="applyFormat('bold')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-italic"
        :color="isFormatActive('italic') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Italic"
        @click="applyFormat('italic')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-underline"
        :color="isFormatActive('underline') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Underline"
        @click="applyFormat('underline')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-strikethrough"
        :color="isFormatActive('strikethrough') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Strikethrough"
        @click="applyFormat('strikethrough')"
        class="shrink-0"
      />

      <USeparator orientation="vertical" class="h-6 shrink-0" />

      <!-- Font Size -->
      <UDropdownMenu :items="fontSizeItems">
        <UButton
          icon="i-lucide-type"
          variant="ghost"
          size="sm"
          aria-label="Font Size"
          class="shrink-0"
        />
      </UDropdownMenu>

      <!-- Headings -->
      <UDropdownMenu :items="headingItems">
        <UButton
          icon="i-lucide-heading"
          variant="ghost"
          size="sm"
          aria-label="Headings"
          class="shrink-0"
        />
      </UDropdownMenu>

      <!-- Lists -->
      <UButton
        icon="i-lucide-list"
        :color="isFormatActive('insertUnorderedList') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Bullet List"
        @click="applyFormat('insertUnorderedList')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-list-ordered"
        :color="isFormatActive('insertOrderedList') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Ordered List"
        @click="applyFormat('insertOrderedList')"
        class="shrink-0"
      />

      <USeparator orientation="vertical" class="h-6 shrink-0" />

      <!-- Alignment -->
      <UButton
        icon="i-lucide-align-left"
        :color="isFormatActive('justifyLeft') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Align Left"
        @click="applyFormat('justifyLeft')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-align-center"
        :color="isFormatActive('justifyCenter') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Align Center"
        @click="applyFormat('justifyCenter')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-align-right"
        :color="isFormatActive('justifyRight') ? 'primary' : 'info'"
        variant="ghost"
        size="sm"
        aria-label="Align Right"
        @click="applyFormat('justifyRight')"
        class="shrink-0"
      />

      <USeparator orientation="vertical" class="h-6 shrink-0" />

      <!-- Text Color -->
      <div class="flex items-center shrink-0">
        <input
          type="color"
          v-model="textColor"
          @input="updateTextColor"
          class="h-8 w-8 cursor-pointer rounded border border-default"
          title="Text Color"
        />
      </div>

      <!-- Background Color -->
      <div class="flex items-center shrink-0">
        <input
          type="color"
          v-model="bgColor"
          @input="updateBgColor"
          class="h-8 w-8 cursor-pointer rounded border border-default"
          title="Background Color"
        />
      </div>

      <USeparator orientation="vertical" class="h-6 shrink-0" />

      <!-- Quote & Code -->
      <UButton
        icon="i-lucide-quote"
        variant="ghost"
        size="sm"
        aria-label="Quote"
        @click="applyFormat('formatBlock', '<blockquote>')"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-code"
        variant="ghost"
        size="sm"
        aria-label="Code Block"
        @click="insertCodeBlock"
        class="shrink-0"
      />

      <!-- Links & Media -->
      <UButton
        icon="i-lucide-link"
        variant="ghost"
        size="sm"
        aria-label="Insert Link"
        @click="insertLink"
        class="shrink-0"
      />
      <UButton
        icon="i-lucide-image"
        variant="ghost"
        size="sm"
        aria-label="Insert Image"
        @click="insertImage"
        class="shrink-0"
      />

      <USeparator orientation="vertical" class="h-6 shrink-0" />

      <!-- Horizontal Rule -->
      <UButton
        icon="i-lucide-minus"
        variant="ghost"
        size="sm"
        aria-label="Horizontal Rule"
        @click="applyFormat('insertHorizontalRule')"
        class="shrink-0"
      />

      <!-- Clear Format -->
      <UButton
        icon="i-lucide-eraser"
        variant="ghost"
        size="sm"
        aria-label="Clear Format"
        @click="applyFormat('removeFormat')"
        class="shrink-0"
      />
    </div>

    <!-- Editor -->
    <div
      ref="editor"
      contenteditable
      class="min-h-56 max-h-96 overflow-y-auto p-4 border border-t-0 border-default rounded-b-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary prose prose-invert max-w-none"
      @input="updateContent"
      @paste="handlePaste"
      @click="handleEditorClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";

const editor = ref<HTMLDivElement | null>(null);
const contentData = ref("");
const textColor = ref("#000000");
const bgColor = ref("#ffffff");
const activeFormats = reactive<Record<string, boolean>>({
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
});

const fontSizeItems = ref<DropdownMenuItem[]>([
  { label: "12px", onSelect: () => setFontSize("12px") },
  { label: "14px", onSelect: () => setFontSize("14px") },
  { label: "16px", onSelect: () => setFontSize("16px") },
  { label: "18px", onSelect: () => setFontSize("18px") },
  { label: "20px", onSelect: () => setFontSize("20px") },
  { label: "24px", onSelect: () => setFontSize("24px") },
  { label: "28px", onSelect: () => setFontSize("28px") },
  { label: "32px", onSelect: () => setFontSize("32px") },
]);

const headingItems = ref<DropdownMenuItem[]>([
  { label: "Heading 1", onSelect: () => applyFormat("formatBlock", "H1") },
  { label: "Heading 2", onSelect: () => applyFormat("formatBlock", "H2") },
  { label: "Heading 3", onSelect: () => applyFormat("formatBlock", "H3") },
  { label: "Heading 4", onSelect: () => applyFormat("formatBlock", "H4") },
  { label: "Paragraph", onSelect: () => applyFormat("formatBlock", "P") },
]);
// Font size using span style for custom px
function setFontSize(size: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (selection.isCollapsed) return;
  const span = document.createElement("span");
  span.style.fontSize = size;
  range.surroundContents(span);
  editor.value?.focus();
  updateActiveStates();
}

const applyFormat = (command: string, value?: string) => {
  // For lists, ensure selection is not collapsed
  const selection = window.getSelection();
  if (
    (command === "insertUnorderedList" || command === "insertOrderedList") &&
    selection &&
    selection.isCollapsed
  ) {
    // Insert a dummy character to allow list creation
    document.execCommand("insertText", false, "\u200B");
  }
  // @ts-ignore - execCommand is deprecated but necessary for contenteditable
  document.execCommand(command, false, value);
  editor.value?.focus();
  updateActiveStates();
};

const updateActiveStates = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    Object.keys(activeFormats).forEach((key) => {
      activeFormats[key] = false;
    });
    return;
  }

  const range = selection.getRangeAt(0);
  const parent = range.commonAncestorContainer
    .parentElement as HTMLElement | null;
  if (!parent || !editor.value?.contains(parent)) {
    Object.keys(activeFormats).forEach((key) => {
      activeFormats[key] = false;
    });
    return;
  }

  const tagMap: Record<string, string[]> = {
    bold: ["STRONG", "B"],
    italic: ["EM", "I"],
    underline: ["U"],
    strikethrough: ["S", "STRIKE"],
    insertUnorderedList: ["UL"],
    insertOrderedList: ["OL"],
  };

  Object.keys(activeFormats).forEach((command) => {
    const tags = tagMap[command] || [];
    let current: HTMLElement | null = parent;
    activeFormats[command] = false;
    while (current && editor.value?.contains(current)) {
      if (tags.includes(current.tagName)) {
        activeFormats[command] = true;
        break;
      }
      current = current.parentElement;
    }
  });
};

const isFormatActive = (command: string): boolean => {
  return activeFormats[command] ?? false;
};

const updateTextColor = () => {
  // @ts-ignore - execCommand is deprecated but necessary for contenteditable
  document.execCommand("foreColor", false, textColor.value);
  editor.value?.focus();
};

const updateBgColor = () => {
  // @ts-ignore - execCommand is deprecated but necessary for contenteditable
  document.execCommand("backColor", false, bgColor.value);
  editor.value?.focus();
};

const insertLink = () => {
  const url = prompt("Enter URL:");
  if (url) {
    applyFormat("createLink", url);
  }
};

const insertImage = () => {
  const url = prompt("Enter image URL:");
  if (url) {
    applyFormat("insertImage", url);
  }
};

const insertCodeBlock = () => {
  applyFormat("formatBlock", "<pre>");
};

const updateContent = () => {
  if (editor.value) {
    contentData.value = editor.value.innerHTML;
  }
};

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData("text/plain") || "";
  // @ts-ignore - execCommand is deprecated but necessary for contenteditable
  document.execCommand("insertText", false, text);
  updateActiveStates();
};

const handleEditorClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  // Handle link clicks
  if (target.tagName === "A") {
    e.preventDefault();
    const href = target.getAttribute("href");
    if (href) {
      // Check if ctrl/cmd is held to open the link normally
      if (e.ctrlKey || e.metaKey) {
        window.open(href, "_blank");
      } else {
        // Show confirmation dialog for other cases
        const shouldOpen = confirm(`Open link: ${href}?`);
        if (shouldOpen) {
          window.open(href, "_blank");
        }
      }
    }
    // Keep focus in editor
    editor.value?.focus();
  }
  // Update active states after any click
  setTimeout(updateActiveStates, 0);
};
</script>
