<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

type MenuAction =
  | "file:new"
  | "file:open"
  | "file:save"
  | "file:export:pdf"
  | "file:export:word"
  | "file:export:markdown"
  | "file:email-attachment"
  | "file:print"
  | "edit:undo"
  | "edit:redo"
  | "edit:cut"
  | "edit:copy"
  | "edit:paste"
  | "edit:find-replace"
  | "view:print-layout"
  | "view:reading-mode"
  | "view:zoom-in"
  | "view:zoom-out"
  | "view:fit-width"
  | "view:dark-mode"
  | "insert:image"
  | "insert:table"
  | "insert:link"
  | "insert:code-block"
  | "insert:divider"
  | "insert:comment"
  | "insert:footnote"
  | "ai:generate-content"
  | "ai:generate-image"
  | "ai:summary"
  | "ai:rephrase"
  | "ai:ask";

type MenuItem = NavigationMenuItem & {
  key?: MenuAction;
  type?: "separator" | "label" | "trigger" | "link";
  children?: MenuItem[];
};

const props = withDefaults(
  defineProps<{
    compact?: boolean;
  }>(),
  {
    compact: false,
  },
);

const emit = defineEmits<{
  action: [payload: { key: MenuAction; label: string }];
}>();

const items = ref<MenuItem[]>([
  {
    label: "File",
    icon: "i-lucide-file-text",
    children: [
      { key: "file:new", label: "New Document", icon: "i-lucide-file-plus" },
      { key: "file:open", label: "Open Document", icon: "i-lucide-folder-open" },
      { key: "file:save", label: "Save", icon: "i-lucide-save" },
      {
        label: "Export as",
        icon: "i-lucide-file-down",
        children: [
          { key: "file:export:pdf", label: "PDF", icon: "i-lucide-file-type" },
          { key: "file:export:word", label: "Word", icon: "i-lucide-file-text" },
          { key: "file:export:markdown", label: "Markdown", icon: "i-lucide-file-code-2" },
        ],
      },
      { key: "file:email-attachment", label: "Email as Attachment", icon: "i-lucide-paperclip" },
      { type: "label", label: "", class: "my-1 h-px bg-muted pointer-events-none p-0" },
      { key: "file:print", label: "Print", icon: "i-lucide-printer" },
    ],
  },
  {
    label: "Edit",
    icon: "i-lucide-edit-3",
    children: [
      { key: "edit:undo", label: "Undo", icon: "i-lucide-undo-2" },
      { key: "edit:redo", label: "Redo", icon: "i-lucide-redo-2" },
      { type: "label", label: "", class: "my-1 h-px bg-muted pointer-events-none p-0" },
      { key: "edit:cut", label: "Cut", icon: "i-lucide-scissors" },
      { key: "edit:copy", label: "Copy", icon: "i-lucide-copy" },
      { key: "edit:paste", label: "Paste", icon: "i-lucide-clipboard-paste" },
      { type: "label", label: "", class: "my-1 h-px bg-muted pointer-events-none p-0" },
      { key: "edit:find-replace", label: "Find & Replace", icon: "i-lucide-search" },
    ],
  },
  {
    label: "View",
    icon: "i-lucide-eye",
    children: [
      { key: "view:print-layout", label: "Print Layout", icon: "i-lucide-layout-template" },
      { key: "view:reading-mode", label: "Reading Mode", icon: "i-lucide-book-open" },
      { type: "label", label: "", class: "my-1 h-px bg-muted pointer-events-none p-0" },
      { key: "view:zoom-in", label: "Zoom In", icon: "i-lucide-zoom-in" },
      { key: "view:zoom-out", label: "Zoom Out", icon: "i-lucide-zoom-out" },
      { key: "view:fit-width", label: "Fit Width", icon: "i-lucide-maximize-2" },
      { type: "label", label: "", class: "my-1 h-px bg-muted pointer-events-none p-0" },
      { key: "view:dark-mode", label: "Dark Mode", icon: "i-lucide-moon" },
    ],
  },
  {
    label: "Insert",
    icon: "i-lucide-plus-square",
    children: [
      { key: "insert:image", label: "Image", icon: "i-lucide-image-plus" },
      { key: "insert:table", label: "Table", icon: "i-lucide-table" },
      { key: "insert:link", label: "Link", icon: "i-lucide-link" },
      { key: "insert:code-block", label: "Code Block", icon: "i-lucide-square-code" },
      { key: "insert:divider", label: "Divider", icon: "i-lucide-minus" },
      { key: "insert:comment", label: "Comment", icon: "i-lucide-message-square-plus" },
      { key: "insert:footnote", label: "Footnote", icon: "i-lucide-bookmark-plus" },
    ],
  },
  {
    label: "AI",
    icon: "i-lucide-sparkles",
    children: [
      { key: "ai:generate-content", label: "Generate Content", icon: "i-lucide-wand-sparkles" },
      { key: "ai:generate-image", label: "Generate Image", icon: "i-lucide-image-up" },
      { key: "ai:summary", label: "Summary", icon: "i-lucide-scroll-text" },
      { key: "ai:rephrase", label: "Rephrase", icon: "i-lucide-refresh-cw" },
      { key: "ai:ask", label: "Ask AI", icon: "i-lucide-message-circle" },
    ],
  },
]);

const onMenuSelect = (item: MenuItem) => {
  if (item.type === "label" || !item.key || !item.label) return;
  emit("action", { key: item.key, label: item.label });
};

const compactItems = computed<MenuItem[]>(() => {
  const mapItems = (source: MenuItem[]): MenuItem[] =>
    source.map((item) => ({
      ...item,
      onSelect:
        item.type === "label" || item.children?.length || !item.key || !item.label
          ? undefined
          : () => onMenuSelect(item),
      children: item.children ? mapItems(item.children) : undefined,
    }));

  return mapItems(items.value);
});
</script>

<template>
  <UNavigationMenu
    v-if="props.compact"
    :items="compactItems"
    orientation="vertical"
    type="multiple"
    class="w-full"
  />

  <UNavigationMenu
    v-else
    :items="items"
    orientation="horizontal"
    content-orientation="vertical"
    :disable-pointer-leave-close="true"
    :skip-delay-duration="300"
    :unmount-on-hide="false"
  >
    <template #item-content="{ item }">
      <ul class="min-w-56 space-y-1 p-1">
        <li v-for="(child, index) in item.children || []" :key="`${item.label}-${index}`">
          <div v-if="child.type === 'label'" :class="child.class" />

          <UPopover
            v-else-if="child.children?.length"
            mode="hover"
            :open-delay="40"
            :close-delay="240"
            :content="{ side: 'right', align: 'start', sideOffset: 0 }"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <UIcon v-if="child.icon" :name="child.icon" class="h-4 w-4 text-muted-foreground" />
              <span class="flex-1">{{ child.label }}</span>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-muted-foreground" />
            </button>
            <template #content>
              <ul class="min-w-44 space-y-1 p-1">
                <li
                  v-for="(subChild, subIndex) in child.children"
                  :key="`${child.label}-${subIndex}`"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    @click="onMenuSelect(subChild)"
                  >
                    <UIcon
                      v-if="subChild.icon"
                      :name="subChild.icon"
                      class="h-4 w-4 text-muted-foreground"
                    />
                    <span>{{ subChild.label }}</span>
                  </button>
                </li>
              </ul>
            </template>
          </UPopover>

          <button
            v-else
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
            @click="onMenuSelect(child)"
          >
            <UIcon v-if="child.icon" :name="child.icon" class="h-4 w-4 text-muted-foreground" />
            <span>{{ child.label }}</span>
          </button>
        </li>
      </ul>
    </template>
  </UNavigationMenu>
</template>
