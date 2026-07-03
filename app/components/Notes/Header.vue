<script setup lang="ts">
const title = ref("Untitled document");
const isMobileMenuOpen = ref(false);

const emit = defineEmits<{
  "menu-action": [payload: { key: string; label: string }];
  "title-change": [title: string];
}>();

const onTitleUpdate = (value: string | number) => {
  emit("title-change", String(value ?? ""));
};

const onMenuAction = (payload: { key: string; label: string }) => {
  emit("menu-action", payload);
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <div class="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3">
    <div class="min-w-0 flex items-center gap-2">
      <div
        class="bg-primary rounded w-10 h-10 shrink-0 flex items-center justify-center"
      >
        <UIcon name="i-lucide-file-text" size="22" />
      </div>

      <UInput
        v-model="title"
        @update:model-value="onTitleUpdate"
        variant="soft"
        size="lg"
        class="font-semibold w-45 sm:w-60 md:w-80 lg:w-104"
        :trailing="true"
        trailing-icon="i-lucide-pen-line"
      />
      <div class="hidden md:flex gap-2">
        <UIcon name="i-lucide-check" size="20" class="text-green-500" />
        <span class="text-sm text-muted-foreground">... Saving </span>
      </div>
    </div>

    <div class="hidden lg:flex items-center gap-4">
      <NotesMenuBar @action="onMenuAction" />
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <UColorModeButton />
      <UDrawer v-model:open="isMobileMenuOpen" side="right" title="Note Menu">
        <UButton
          class="lg:hidden"
          size="md"
          variant="soft"
          color="neutral"
          icon="i-lucide-menu"
        />
        <template #body>
          <div class="p-2">
            <NotesMenuBar compact @action="onMenuAction" />
          </div>
        </template>
      </UDrawer>
      <UButton
        size="md"
        variant="soft"
        color="primary"
        icon="i-lucide-settings"
      />
      <UButton
        size="md"
        variant="solid"
        color="primary"
        icon="i-lucide-share-2"
        label="Share"
      />
    </div>
  </div>
</template>
