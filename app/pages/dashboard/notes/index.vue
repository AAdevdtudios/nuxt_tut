<script setup lang="ts">
import type { LibraryItem } from "~/types";

definePageMeta({
  layout: "newdash",
});

const router = useRouter();
const toast = useToast();
const libraryStore = useLibraryStore();

const search = ref("");
const sortBy = ref("updated");
const page = ref(1);
const pageSize = ref(12);
const isDeleting = ref<string | null>(null);

const notes = computed(() =>
  libraryStore.allLibraries
    .filter((item) => item.libraryType === "note")
    .sort(
      (a, b) =>
        sortBy.value === "title"
          ? a.title.localeCompare(b.title)
          : new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
    ),
);

const pagination = computed(() => libraryStore.pagination);
const total = computed(() => pagination.value.total || notes.value.length);
const pageCount = computed(() =>
  Math.max(1, pagination.value.pageCount || Math.ceil(total.value / pageSize.value)),
);

const loadNotes = async () => {
  try {
    await libraryStore.fetchLibraries(
      page.value,
      pageSize.value,
      search.value.trim(),
      "note",
    );
  } catch (error: any) {
    toast.add({
      title: "Could not load notes",
      description: error?.message || "Please try again.",
      color: "error",
    });
  }
};

const openNote = (note: LibraryItem) => {
  router.push(`/dashboard/notes/${note.documentId || note.id}`);
};

const createNote = () => {
  router.push("/dashboard/notes/new");
};

const deleteNote = async (note: LibraryItem) => {
  const id = note.documentId || note.id;
  if (!id) return;

  isDeleting.value = id;
  try {
    await libraryStore.deleteLibrary(id);
    toast.add({
      title: "Note deleted",
      description: "The note was removed from your library.",
      color: "success",
    });
    await loadNotes();
  } catch (error: any) {
    toast.add({
      title: "Delete failed",
      description: error?.message || "Could not delete the note.",
      color: "error",
    });
  } finally {
    isDeleting.value = null;
  }
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const excerpt = (note: LibraryItem) => {
  const text = (note.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>\-[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text || "Open this note to add content, summaries, and AI rewrites.";
};

watch(
  search,
  useDebounceFn(async () => {
    page.value = 1;
    await loadNotes();
  }, 350),
);

watch(page, loadNotes);

await loadNotes();
</script>

<template>
  <DashboardBodyLayout
    title="Notes"
    description="Create, edit, and use AI tools on your saved study notes."
  >
    <template #actions>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search notes..."
          class="sm:w-72"
        />
        <USelect
          v-model="sortBy"
          :items="[
            { label: 'Recently updated', value: 'updated' },
            { label: 'Title A-Z', value: 'title' },
          ]"
          value-key="value"
          class="w-40"
        />
        <UButton
          icon="i-lucide-plus"
          label="New note"
          color="primary"
          @click="createNote"
        />
      </div>
    </template>

    <div class="space-y-7">
      <section
        class="ga-surface-warm relative overflow-hidden rounded-[1.75rem] border p-6 sm:p-8"
      >
        <div
          class="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl"
        />
        <div class="relative max-w-2xl space-y-3">
          <UBadge color="primary" variant="subtle">Your thinking space</UBadge>
          <h2 class="ga-heading font-serif text-3xl font-semibold tracking-tight">
            Notes that help you understand, not just remember.
          </h2>
          <p class="ga-muted max-w-xl text-sm leading-6">
            Create a note from a topic, PDF, or link. Then use GapAI to explain,
            refine, and turn your material into active practice.
          </p>
        </div>
      </section>

      <div
        v-if="libraryStore.isLoading && !notes.length"
        class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <USkeleton v-for="item in 6" :key="item" class="h-52 rounded-2xl" />
      </div>

      <UCard v-else-if="!notes.length">
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div
            class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <UIcon name="i-lucide-notebook-pen" class="h-7 w-7" />
          </div>
          <h3 class="text-lg font-semibold text-foreground">
            No notes found
          </h3>
          <p class="mt-1 max-w-md text-sm text-muted-foreground">
            Create your first note, or clear the search to see existing notes.
          </p>
          <UButton
            class="mt-5"
            icon="i-lucide-plus"
            label="Create note"
            @click="createNote"
          />
        </div>
      </UCard>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="note in notes"
          :key="note.id"
          class="ga-surface ga-hover-card group cursor-pointer border"
          @click="openNote(note)"
        >
          <div class="flex h-full flex-col gap-4">
            <div class="flex items-start justify-between gap-3">
              <div
                class="ga-icon-box flex h-11 w-11 items-center justify-center rounded-xl"
              >
                <UIcon name="i-lucide-sticky-note" class="h-5 w-5" />
              </div>
              <UDropdownMenu
                :items="[
                  [
                    {
                      label: 'Open note',
                      icon: 'i-lucide-arrow-up-right',
                      onSelect: () => openNote(note),
                    },
                    {
                      label: 'Delete',
                      icon: 'i-lucide-trash-2',
                      color: 'error',
                      onSelect: () => deleteNote(note),
                    },
                  ],
                ]"
              >
                <UButton
                  icon="i-lucide-more-horizontal"
                  color="neutral"
                  variant="ghost"
                  :loading="isDeleting === (note.documentId || note.id)"
                  @click.stop
                />
              </UDropdownMenu>
            </div>

            <div class="min-h-0 flex-1">
              <h3 class="ga-heading line-clamp-2 font-serif text-xl font-semibold">
                {{ note.title || "Untitled note" }}
              </h3>
              <p class="ga-muted mt-2 line-clamp-4 text-sm leading-6">
                {{ excerpt(note) }}
              </p>
            </div>

            <div class="flex items-center justify-between border-t border-[var(--ga-border)] pt-4">
              <span class="text-xs text-muted-foreground">
                Updated {{ formatDate(note.updatedAt || note.createdAt) }}
              </span>
              <span class="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Open
                <UIcon
                  name="i-lucide-arrow-right"
                  class="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </div>
        </UCard>
      </div>

      <div v-if="pageCount > 1" class="flex justify-center">
        <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" />
      </div>
    </div>
  </DashboardBodyLayout>
</template>
