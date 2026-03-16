<script setup lang="ts">
import type { FeedbackItem } from "~/types/feedback.types";
import FeedbackCard from "~/components/Feedback/Card.vue";

defineProps<{
  items: FeedbackItem[];
  isLoading: boolean;
  expandedId: string | null;
  formatRelativeDate: (value: string) => string;
}>();

const emit = defineEmits<{
  vote: [feedbackId: string];
  toggleExpand: [feedbackId: string];
}>();
</script>

<template>
  <div v-if="isLoading" class="flex justify-center py-16">
    <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin" />
  </div>

  <div
    v-else-if="items.length === 0"
    class="flex flex-col items-center gap-3 rounded-xl border border-default bg-card py-16"
  >
    <UIcon
      name="i-lucide-message-square-plus"
      class="h-10 w-10 text-muted-foreground/40"
    />
    <p class="text-muted-foreground">No feedback matches your filters.</p>
  </div>

  <div v-else class="space-y-3">
    <FeedbackCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :is-expanded="expandedId === item.id"
      :formatted-date="formatRelativeDate(item.createdAtUtc)"
      @vote="emit('vote', $event)"
      @toggle-expand="emit('toggleExpand', $event)"
    />
  </div>
</template>
