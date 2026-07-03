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

const categoryOptions = [...FEEDBACK_CATEGORY_OPTIONS];
const statusOptions = [...FEEDBACK_STATUS_OPTIONS];
const sortOptions = [...FEEDBACK_SORT_OPTIONS];

function handleCategoryUpdate(value: unknown) {
  emit("update:category", (value || "all") as FeedbackCategory | "all");
}

function handleStatusUpdate(value: unknown) {
  emit("update:status", (value || "all") as FeedbackStatus | "all");
}

function handleSortUpdate(value: unknown) {
  emit("update:sortBy", (value || "votes") as FeedbackSortBy);
}
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
    <div
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center"
    >
      <USelect
        :model-value="category"
        :items="categoryOptions"
        value-key="value"
        option-attribute="label"
        class="min-w-48"
        @update:model-value="handleCategoryUpdate"
      />
      <USelect
        :model-value="status"
        :items="statusOptions"
        value-key="value"
        option-attribute="label"
        class="min-w-44"
        @update:model-value="handleStatusUpdate"
      />
    </div>

    <div class="lg:ml-auto">
      <USelect
        :model-value="sortBy"
        :items="sortOptions"
        value-key="value"
        option-attribute="label"
        class="min-w-40"
        @update:model-value="handleSortUpdate"
      />
    </div>
  </div>
</template>
