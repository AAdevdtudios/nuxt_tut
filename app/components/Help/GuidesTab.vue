<script setup lang="ts">
import type { GuideItem } from "~/types/support.types";

defineProps<{
  items: GuideItem[];
  expandedGuide: string | null;
}>();

const emit = defineEmits<{
  "update:expandedGuide": [value: string | null];
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div
      v-if="items.length === 0"
      class="col-span-full flex flex-col items-center gap-3 rounded-xl border border-default bg-card py-16"
    >
      <UIcon
        name="i-lucide-book-open"
        class="h-10 w-10 text-muted-foreground/40"
      />
      <p class="text-muted-foreground">No guides found.</p>
    </div>

    <template v-else>
      <UCard
        v-for="guide in items"
        :key="guide.id"
        class="border-default transition-colors hover:border-primary/30"
      >
        <button
          type="button"
          class="flex w-full items-start gap-4 text-left"
          @click="
            emit(
              'update:expandedGuide',
              expandedGuide === guide.id ? null : guide.id,
            )
          "
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <UIcon :name="guide.icon" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-semibold text-card-foreground">
                {{ guide.title }}
              </h4>
              <UIcon
                :name="
                  expandedGuide === guide.id
                    ? 'i-lucide-chevron-down'
                    : 'i-lucide-chevron-right'
                "
                class="h-3.5 w-3.5 text-muted-foreground"
              />
            </div>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              {{ guide.description }}
            </p>
            <UBadge class="mt-2" color="neutral" variant="soft">
              {{ guide.category }}
            </UBadge>
          </div>
        </button>

        <div
          v-if="expandedGuide === guide.id"
          class="mt-4 space-y-3 border-t border-default pt-4"
        >
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <UIcon name="i-lucide-file-text" class="h-4 w-4" />
            <span>5 min read</span>
          </div>
          <p class="text-sm leading-relaxed text-muted-foreground">
            This guide covers everything you need to know about
            {{ guide.title.toLowerCase() }}.
          </p>
          <ol
            class="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground"
          >
            <li>Navigate to the relevant section from the sidebar.</li>
            <li>Follow the on-screen prompts to get started.</li>
            <li>Use the tips panel for best practices.</li>
          </ol>
          <UButton color="primary" variant="ghost">Open full guide</UButton>
        </div>
      </UCard>
    </template>
  </div>
</template>
