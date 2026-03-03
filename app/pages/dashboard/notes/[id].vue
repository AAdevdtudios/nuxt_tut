<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import type { LibrarySingleResponse } from "~/types";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const MAX_CONTENT_LENGTH = 10000;
const MAX_NOTE_IMAGES = 6;

const noteId = computed(() => String(route.params.id || "new"));
const isNewNote = computed(() => noteId.value === "new");

const title = ref("");
const titleDraft = ref("");
const content = ref("");
const isLoading = ref(false);
const isSaving = ref(false);
const isEditingTitle = ref(false);
const saveState = ref<"idle" | "saving" | "saved" | "error">("idle");
const lastSavedAt = ref<string | null>(null);
const hasInitialized = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const editorInstance = shallowRef<any>(null);
const lastSelection = shallowRef<{ from: number; to: number } | null>(null);

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
    const remaining = MAX_CONTENT_LENGTH - (currentText.length - selectionLength);
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

const buildFormData = () => {
  const formData = new FormData();
  formData.append("title", title.value.trim() || "Untitled");
  formData.append("libraryType", "note");
  formData.append("content", content.value);
  return formData;
};

const loadNote = async () => {
  if (isNewNote.value) {
    title.value = "Untitled";
    titleDraft.value = "";
    content.value = "";
    hasInitialized.value = true;
    return;
  }

  try {
    isLoading.value = true;
    const response = await $api.fetch<LibrarySingleResponse>(
      `/api/libraries/${noteId.value}`,
      { method: "GET" },
    );

    if (!response?.data) {
      throw new Error("Note not found");
    }

    title.value = response.data.title || "Untitled";
    titleDraft.value = title.value === "Untitled" ? "" : title.value;
    content.value = response.data.content || "";
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

const persistNote = async () => {
  if (isLoading.value || isSaving.value || !hasInitialized.value) return;
  if (!title.value.trim() && !content.value.trim()) return;

  const submittedTitle = title.value;
  const submittedContent = content.value;
  isSaving.value = true;
  saveState.value = "saving";

  try {
    const body = buildFormData();

    const response = isNewNote.value
      ? await $api.mutate<LibrarySingleResponse>("/api/libraries", {
          method: "POST",
          body,
        })
      : await $api.mutate<LibrarySingleResponse>(`/api/libraries/${noteId.value}`, {
          method: "PUT",
          body,
        });

    const savedNote = response?.data;
    if (!savedNote) {
      throw new Error("Invalid note response");
    }

    if (isNewNote.value) {
      await router.replace(`/dashboard/notes/${savedNote.documentId}`);
    }

    if (title.value === submittedTitle) {
      title.value = savedNote.title || submittedTitle || "Untitled";
      titleDraft.value = title.value === "Untitled" ? "" : title.value;
    }

    if (content.value === submittedContent) {
      content.value = savedNote.content ?? submittedContent;
    }

    lastSavedAt.value = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    saveState.value = "saved";
  } catch {
    saveState.value = "error";
    toast.add({
      title: "Save failed",
      description: "The note could not be saved.",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
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

const handleSaveShortcut = async (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    await persistNote();
  }
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

  return editor
    .chain()
    .focus()
    .setTextSelection({
      from: lastSelection.value.from,
      to: lastSelection.value.to,
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
  if (!editorInstance.value) {
    editorInstance.value = editor;
    const selection = editor.state.selection;
    lastSelection.value = { from: selection.from, to: selection.to };
    editor.on("selectionUpdate", ({ editor: currentEditor }: any) => {
      const selectionUpdate = currentEditor.state.selection;
      lastSelection.value = {
        from: selectionUpdate.from,
        to: selectionUpdate.to,
      };
    });
  }
  return true;
};

onMounted(async () => {
  window.addEventListener("keydown", handleSaveShortcut);
  await loadNote();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleSaveShortcut);
});

onBeforeRouteLeave(async () => {
  await persistNote();
});
</script>

<template>
  <div class="space-y-4">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="attachImage"
    />

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin" />
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <UBadge
          :color="saveState === 'error' ? 'error' : saveState === 'saved' ? 'success' : 'neutral'"
          variant="subtle"
        >
          {{ saveLabel }}
        </UBadge>
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-image-plus"
            label="Attach image"
            variant="outline"
            @click="triggerImagePicker"
          />
          <UButton
            icon="i-lucide-save"
            label="Save"
            color="primary"
            :loading="isSaving"
            @click="persistNote"
          />
        </div>
      </div>

      <UCard>
        <div class="space-y-4">
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Note title
              </p>
              <UButton
                v-if="!isEditingTitle"
                icon="i-lucide-pencil-line"
                variant="ghost"
                size="sm"
                @click="beginTitleEdit"
              />
            </div>

            <div v-if="isEditingTitle" class="flex items-center gap-2">
              <UInput
                v-model="titleDraft"
                size="xl"
                placeholder="Untitled"
                class="w-full"
                @keydown.enter.prevent="commitTitleChange"
                @keydown.esc.prevent="cancelTitleEdit"
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
              class="w-full rounded-xl border border-dashed border-default bg-muted/30 px-4 py-4 text-left text-3xl font-semibold tracking-tight text-foreground transition hover:border-primary/40 hover:bg-muted/50"
              @click="beginTitleEdit"
            >
              {{ pageTitle }}
            </button>
            <p class="px-1 text-sm text-muted-foreground">
              Rich note editor with autosave. Type <code>/</code> in the note body for the future command menu.
            </p>
          </div>

          <div class="flex items-center justify-end px-1 text-xs text-muted-foreground">
            {{ imageCount }}/{{ MAX_NOTE_IMAGES }} images •
            {{ contentCharacterCount }}/{{ MAX_CONTENT_LENGTH }}
          </div>

          <UEditor
            v-slot="{ editor }"
            v-model="content"
            content-type="markdown"
            :autofocus="'end'"
            :enable-paste-rules="false"
            :placeholder="'Start writing your note here...'"
            :editor-props="editorProps"
            :ui="{
              root: 'rounded-2xl border border-default bg-default',
              content: 'min-h-[70vh] px-6 py-5 text-base leading-7 focus:outline-none'
            }"
            class="w-full"
          >
            <div
              v-if="setEditorInstance(editor)"
              @mousedown.prevent
              class="sticky top-4 z-20 flex items-center justify-between gap-3 overflow-x-auto rounded-t-2xl border-b border-default bg-default/95 px-3 py-2 shadow-sm backdrop-blur"
            >
              <div class="flex items-center gap-2">
                <UButton icon="i-lucide-undo" variant="ghost" size="sm" @click="undoChange" />
                <UButton icon="i-lucide-redo" variant="ghost" size="sm" @click="redoChange" />
                <USeparator orientation="vertical" class="h-6" />
                <UButton label="P" variant="ghost" size="sm" @click="applyParagraph" />
                <UButton label="H1" variant="ghost" size="sm" @click="applyHeading(1)" />
                <UButton label="H2" variant="ghost" size="sm" @click="applyHeading(2)" />
                <UButton label="H3" variant="ghost" size="sm" @click="applyHeading(3)" />
                <USeparator orientation="vertical" class="h-6" />
                <UButton icon="i-lucide-bold" variant="ghost" size="sm" @click="toggleBold" />
                <UButton icon="i-lucide-italic" variant="ghost" size="sm" @click="toggleItalic" />
                <UButton icon="i-lucide-strikethrough" variant="ghost" size="sm" @click="toggleStrike" />
                <UButton icon="i-lucide-code" variant="ghost" size="sm" @click="toggleCode" />
                <USeparator orientation="vertical" class="h-6" />
                <UButton icon="i-lucide-list" variant="ghost" size="sm" @click="toggleBulletList" />
                <UButton icon="i-lucide-list-ordered" variant="ghost" size="sm" @click="toggleOrderedList" />
                <UButton icon="i-lucide-text-quote" variant="ghost" size="sm" @click="toggleBlockquote" />
                <UButton icon="i-lucide-square-code" variant="ghost" size="sm" @click="toggleCodeBlock" />
                <UButton icon="i-lucide-link" variant="ghost" size="sm" @click="insertLink" />
              </div>
              <UButton
                icon="i-lucide-image-plus"
                variant="ghost"
                color="neutral"
                @click="openImagePicker(editor)"
              />
            </div>
          </UEditor>
        </div>
      </UCard>
    </div>
  </div>
</template>
