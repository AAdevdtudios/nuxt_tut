<template>
  <!-- GRID MODE -->
  <div
    v-if="viewType === 'grid'"
    class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    <UCard
      v-for="item in filteredItems"
      :key="item.id"
      class="group hover:ring-1 hover:ring-primary/30"
    >
      <template #header>
        <div class="flex items-start justify-between">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <UIcon :name="iconFor(item)" class="h-6 w-6" />
          </div>

          <div class="flex items-center gap-1">
            <UButton
              variant="ghost"
              size="xs"
              :class="
                isFavorite(item.id)
                  ? 'text-yellow-500'
                  : 'text-muted-foreground'
              "
              :icon="isFavorite(item.id) ? 'i-lucide-star' : 'i-lucide-star'"
              @click="toggleFavorite(item.id)"
            >
              <template #leading>
                <UIcon
                  name="i-lucide-star"
                  class="h-4 w-4"
                  :class="isFavorite(item.id) ? 'fill-current' : ''"
                />
              </template>
            </UButton>

            <UDropdownMenu :items="menuItems(item)">
              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-more-vertical"
                class="opacity-0 group-hover:opacity-100"
              />
            </UDropdownMenu>
          </div>
        </div>
      </template>

      <div>
        <h3 class="mt-1 font-semibold text-card-foreground line-clamp-2">
          {{ item.title }}
        </h3>

        <div class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <UBadge variant="soft">{{ badgeLabel(item) }}</UBadge>
          <span>•</span>
          <span>{{ sizeLabel(item) }}</span>
        </div>

        <div class="mt-2 text-xs text-muted-foreground">
          {{ metaLine(item) }}
        </div>

        <div class="mt-4 flex items-center gap-2">
          <UButton
            variant="outline"
            class="flex-1 justify-center"
            icon="i-lucide-eye"
            @click="emit('view', item)"
          >
            View
          </UButton>

          <UButton
            variant="outline"
            icon="i-lucide-download"
            @click="emit('download', item)"
          />
        </div>
      </div>
    </UCard>
  </div>

  <!-- LIST MODE -->
  <UCard v-else>
    <div class="divide-y divide-border">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="flex items-center justify-between p-4 hover:bg-accent/50"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <UIcon :name="iconFor(item)" class="h-5 w-5" />
          </div>

          <div>
            <p class="font-medium text-card-foreground">
              {{ item.title }}
            </p>

            <div
              class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
            >
              <span>{{ badgeLabel(item) }}</span>
              <span>•</span>
              <span>{{ sizeLabel(item) }}</span>
              <template>
                <span>•</span>
                <span>December 2023</span>
              </template>

              <!-- <template v-if="item.date">
                <span>•</span>
                <span>{{ item.date }}</span>
              </template>

              <template v-if="item.folder">
                <span>•</span>
                <span class="text-primary">{{ item.folder }}</span>
              </template> -->

              <span>•</span>
              <span
                class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {{ sourceLabel(item) }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <UButton
            variant="ghost"
            size="sm"
            :class="
              isFavorite(item.id) ? 'text-yellow-500' : 'text-muted-foreground'
            "
            @click="toggleFavorite(item.id)"
          >
            <UIcon
              name="i-lucide-star"
              class="h-4 w-4"
              :class="isFavorite(item.id) ? 'fill-current' : ''"
            />
          </UButton>

          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-eye"
            class="text-muted-foreground hover:text-foreground"
            @click="emit('view', item)"
          />

          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-download"
            class="text-muted-foreground hover:text-foreground"
            @click="emit('download', item)"
          />

          <UDropdown :items="menuItems(item)">
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-more-vertical"
              class="text-muted-foreground hover:text-foreground"
            />
          </UDropdown>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { LibraryItem, LibraryTypeValue } from "~/types";

type ViewType = "grid" | "list";

const props = withDefaults(
  defineProps<{
    searchQuery?: string;
    documentType?: LibraryTypeValue | "all";
    viewType?: ViewType;
    itemsList: LibraryItem[];
  }>(),
  {
    viewType: "grid",
    documentType: "all",
    searchQuery: "",
  }
);

const emit = defineEmits<{
  (e: "view", item: LibraryItem): void;
  (e: "download", item: LibraryItem): void;
  (e: "toggle-favorite", id: number): void; // optional, if you want parent to own favorites
}>();

/**
 * Local favorites state (mirrors your React example).
 * If you want favorites stored in parent, remove this and emit instead.
 */
const favorites = ref<number[]>([]);

function isFavorite(id: number) {
  return favorites.value.includes(id);
}

function toggleFavorite(id: number) {
  if (isFavorite(id)) favorites.value = favorites.value.filter((x) => x !== id);
  else favorites.value.push(id);

  // If you want parent ownership too:
  // emit("toggle-favorite", id);
}

const filteredItems = computed(() => {
  const q = (props.searchQuery || "").trim().toLowerCase();
  const type = props.documentType ?? "all";

  return props.itemsList.filter((item) => {
    const matchesQuery = !q || item.title.toLowerCase().includes(q);
    const matchesType = type === "all" || item.type === type;
    return matchesQuery && matchesType;
  });
});

/**
 * Helpers to keep template clean
 */
function iconFor(item: LibraryItem) {
  switch (item.type) {
    case "pdf":
      return "i-lucide-file-text"; // lucide doesn't have a dedicated pdf in all packs; swap if you have it
    case "website":
      return "i-lucide-external-link";
    case "note":
      return "i-lucide-file-code";
    case "docx":
      return "i-lucide-file-text";
    case "txt":
      return "i-lucide-file";
    case "ai_generated":
      return "i-lucide-sparkles";
    default:
      return "i-lucide-file";
  }
}

function badgeLabel(item: LibraryItem) {
  // what you show as "type" chip
  return item.type.toUpperCase();
}

function sizeLabel(item: LibraryItem) {
  return item.size > 0 ? `${item.size} MB` : "N/A";
}

function sourceLabel(item: LibraryItem) {
  // In your React you had item.source separate from type.
  // If you truly have source, adjust to use it.
  switch (item.type) {
    case "pdf":
      return "PDF";
    case "website":
      return "Website";
    case "note":
      return "Note";
    default:
      return item.type.toUpperCase();
  }
}

function metaLine(item: any) {
  // Optional metadata similar to your React example
  if (item.type === "pdf" && item.pages) return `${item.pages} pages`;
  if (item.type === "website") return "From website";
  if (item.type === "note") return "Personal note";
  return "";
}

function menuItems(item: LibraryItem) {
  return [
    [
      {
        label: "Open",
        icon: "i-lucide-eye",
        click: () => emit("view", item),
      },
      {
        label: "Download",
        icon: "i-lucide-download",
        click: () => emit("download", item),
      },
    ],
    [
      {
        label: isFavorite(item.id) ? "Unfavorite" : "Favorite",
        icon: "i-lucide-star",
        click: () => toggleFavorite(item.id),
      },
    ],
  ];
}
</script>
