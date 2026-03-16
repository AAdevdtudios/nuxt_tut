<script setup lang="ts">
import {
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_SORT_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
} from "~/constants/feedback";
import type {
  FeedbackCategory,
  FeedbackSortBy,
  FeedbackStatus,
} from "~/types/feedback.types";

defineProps<{
  category: FeedbackCategory | "all";
  status: FeedbackStatus | "all";
  sortBy: FeedbackSortBy;
}>();

const emit = defineEmits<{
  "update:category": [value: FeedbackCategory | "all"];
  "update:status": [value: FeedbackStatus | "all"];
  "update:sortBy": [value: FeedbackSortBy];
}>();
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
    <div
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center"
    >
      <USelect
        :model-value="category"
        :items="FEEDBACK_CATEGORY_OPTIONS"
        value-key="value"
        option-attribute="label"
        class="min-w-48"
        @update:model-value="emit('update:category', $event)"
      />
      <USelect
        :model-value="status"
        :items="FEEDBACK_STATUS_OPTIONS"
        value-key="value"
        option-attribute="label"
        class="min-w-44"
        @update:model-value="emit('update:status', $event)"
      />
    </div>

    <div class="lg:ml-auto">
      <USelect
        :model-value="sortBy"
        :items="FEEDBACK_SORT_OPTIONS"
        value-key="value"
        option-attribute="label"
        class="min-w-40"
        @update:model-value="emit('update:sortBy', $event)"
      />
    </div>
  </div>
</template>
