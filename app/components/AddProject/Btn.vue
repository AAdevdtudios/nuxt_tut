<script setup lang="ts">
const contentTypes = [
  {
    icon: "i-lucide-file-text",
    label: "Upload Document",
    description: "PDF, DOCX, or TXT files",
    type: "document",
  },
  {
    icon: "i-lucide-link",
    label: "Save Website",
    description: "Add URL to your library",
    type: "website",
  },
  {
    icon: "i-lucide-book-open",
    label: "Create Note",
    description: "Write or paste notes",
    type: "note",
  },
  {
    icon: "i-lucide-brain",
    label: "AI Generated",
    description: "Create with AI assistance",
    type: "ai",
  },
];
const state = ref("add");
</script>

<template>
  <UModal
    title="Modal with description"
    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  >
    <UButton
      label="Add Content"
      icon="i-lucide-plus"
      color="neutral"
      variant="subtle"
    />

    <template #body>
      <AddProjectViewport>
        <template #actions>
          <AddProjectEditorExample />
        </template>
      </AddProjectViewport>
    </template>
  </UModal>
</template>
