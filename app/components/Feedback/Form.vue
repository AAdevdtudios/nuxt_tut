<script setup lang="ts">
import { computed } from "vue";
import {
  FEEDBACK_CATEGORY_OPTIONS,
  feedbackCategoryMeta,
} from "~/constants/feedback";
import type { FeedbackCategory } from "~/types/feedback.types";

const props = defineProps<{
  modelValue: {
    title: string;
    description: string;
    category: FeedbackCategory;
  };
  rating: number;
  hoverRating: number;
  submitted: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [
    value: {
      title: string;
      description: string;
      category: FeedbackCategory;
    },
  ];
  "update:rating": [value: number];
  "update:hoverRating": [value: number];
  cancel: [];
  submit: [];
}>();

const categoryButtons = computed(
  () =>
    FEEDBACK_CATEGORY_OPTIONS.filter(
      (option): option is { label: string; value: FeedbackCategory } =>
        option.value !== "all",
    ),
);

const updateField = (field: "title" | "description", value: string) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};

const updateCategory = (category: FeedbackCategory) => {
  emit("update:modelValue", {
    ...props.modelValue,
    category,
  });
};
</script>

<template>
  <UCard class="border-default">
    <template #header>
      <div v-if="submitted" class="flex flex-col items-center gap-3 py-4">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-green-100"
        >
          <UIcon name="i-lucide-check" class="h-7 w-7 text-green-600" />
        </div>
        <div class="text-center">
          <h3 class="text-lg font-semibold">Thanks for your feedback</h3>
          <p class="text-sm text-muted-foreground">
            We appreciate you helping improve LearnHub.
          </p>
        </div>
      </div>
      <div v-else>
        <h3 class="text-lg font-semibold">Submit Feedback</h3>
        <p class="text-sm text-muted-foreground">
          The more detail you give, the easier it is to act on it.
        </p>
      </div>
    </template>

    <div v-if="!submitted" class="space-y-5">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-medium">Category</label>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="category in categoryButtons"
              :key="category.value"
              :variant="modelValue.category === category.value ? 'soft' : 'outline'"
              :color="modelValue.category === category.value ? 'primary' : 'neutral'"
              @click="updateCategory(category.value)"
            >
              <UIcon
                :name="feedbackCategoryMeta[category.value].icon"
                class="h-4 w-4"
              />
              {{ category.label }}
            </UButton>
          </div>
        </div>

        <UFormField label="Title" class="w-full" required>
          <UInput
            :model-value="modelValue.title"
            placeholder="Brief summary of your feedback"
            class="w-full"
            @update:model-value="updateField('title', $event)"
          />
        </UFormField>
      </div>

      <UFormField label="Description" class="w-full" required>
        <UTextarea
          :model-value="modelValue.description"
          :rows="5"
          class="w-full"
          placeholder="Tell us more about the issue, request, or experience."
          @update:model-value="updateField('description', $event)"
        />
      </UFormField>

      <div class="space-y-2">
        <label class="text-sm font-medium">Overall Experience</label>
        <div class="flex items-center gap-1">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="rounded p-1"
            @mouseenter="emit('update:hoverRating', star)"
            @mouseleave="emit('update:hoverRating', 0)"
            @click="emit('update:rating', star)"
          >
            <UIcon
              name="i-lucide-star"
              class="h-6 w-6 transition-colors"
              :class="
                star <= (hoverRating || rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/40'
              "
            />
          </button>
          <span v-if="rating" class="ml-2 text-sm text-muted-foreground">
            {{ ["", "Poor", "Fair", "Good", "Great", "Excellent"][rating] }}
          </span>
        </div>
      </div>
    </div>

    <template v-if="!submitted" #footer>
      <div class="flex items-center justify-end gap-3">
        <UButton color="neutral" variant="ghost" @click="emit('cancel')">
          Cancel
        </UButton>
        <UButton
          icon="i-lucide-send"
          color="primary"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="emit('submit')"
        >
          Submit Feedback
        </UButton>
      </div>
    </template>
  </UCard>
</template>
