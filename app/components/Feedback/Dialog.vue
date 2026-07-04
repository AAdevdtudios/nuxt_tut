<script setup lang="ts">
import { computed, ref } from "vue";
import {
  FEEDBACK_CATEGORY_OPTIONS,
} from "~/constants/feedback";
import type { FeedbackCategory, FeedbackItem } from "~/types/feedback.types";

const open = defineModel<boolean>("open", { required: true });

const emit = defineEmits<{
  submitted: [item: FeedbackItem];
}>();

const toast = useToast();
const { $api } = useNuxtApp();

const title = ref("");
const description = ref("");
const category = ref<FeedbackCategory>("bug-report");
const rating = ref(0);
const hoverRating = ref(0);
const isSubmitting = ref(false);
const isUploading = ref(false);
const screenshots = ref<Array<{ url: string; name: string }>>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const categoryButtons = computed(
  () =>
    FEEDBACK_CATEGORY_OPTIONS.filter(
      (option): option is { label: string; value: FeedbackCategory } =>
        option.value !== "all",
    ),
);

const canSubmit = computed(
  () =>
    title.value.trim().length >= 3 &&
    description.value.trim().length >= 10 &&
    rating.value >= 1 &&
    !isUploading.value,
);

function resetForm() {
  title.value = "";
  description.value = "";
  category.value = "bug-report";
  rating.value = 0;
  hoverRating.value = 0;
  screenshots.value = [];
}

function closeDialog() {
  open.value = false;
}

function selectCategory(value: FeedbackCategory) {
  category.value = value;
}

function openFilePicker() {
  fileInput.value?.click();
}

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return;
  const remaining = 3 - screenshots.value.length;
  const selected = Array.from(files).slice(0, remaining);

  isUploading.value = true;
  try {
    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        toast.add({ title: "Too large", description: `${file.name} is over 5MB.`, color: "warning" });
        continue;
      }
      const payload = new FormData();
      payload.append("file", file);
      const response = await $fetch<{ url: string }>("/api/feedback/upload-image", {
        method: "POST",
        body: payload,
      });
      screenshots.value.push({ url: response.url, name: file.name });
    }
  } catch (error: any) {
    toast.add({
      title: "Upload failed",
      description: error?.data?.statusMessage || error?.message || "Could not upload screenshot.",
      color: "error",
    });
  } finally {
    isUploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

function removeScreenshot(index: number) {
  screenshots.value.splice(index, 1);
}

async function submit() {
  if (!canSubmit.value) return;
  isSubmitting.value = true;
  try {
    const created = await $api.mutate<FeedbackItem>("/api/feedback", {
      method: "POST",
      body: {
        category: category.value,
        title: title.value.trim(),
        description: description.value.trim(),
        overallExperienceRating: rating.value,
        imageUrls: screenshots.value.map((s) => s.url),
      },
    });

    toast.add({
      title: "Thank you!",
      description: "Feedback received. Useful reports earn beta rewards.",
      color: "success",
    });
    emit("submitted", created);
    resetForm();
    open.value = false;
  } catch (error: any) {
    toast.add({
      title: "Submit failed",
      description: error?.message || "Could not submit feedback.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <div class="p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="ga-heading font-serif text-xl font-semibold">Send feedback</h3>
            <p class="ga-muted mt-1 text-sm leading-6">
              Spotted a bug or a wrong question? Reports with screenshots earn
              extra beta reward points.
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            class="rounded-full"
            aria-label="Close feedback"
            @click="closeDialog"
          />
        </div>

        <div class="mt-5 space-y-4">
          <div>
            <p class="ga-subtle mb-2 text-xs font-semibold uppercase tracking-wide">Type</p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="option in categoryButtons"
                :key="option.value"
                :label="option.label"
                size="sm"
                :color="category === option.value ? 'primary' : 'neutral'"
                :variant="category === option.value ? 'solid' : 'soft'"
                class="rounded-full"
                @click="selectCategory(option.value)"
              />
            </div>
          </div>

          <UFormField label="Title">
            <UInput
              v-model="title"
              placeholder="Short summary, e.g. Wrong answer marked correct"
              class="w-full"
            />
          </UFormField>

          <UFormField label="What happened?">
            <UTextarea
              v-model="description"
              :rows="4"
              placeholder="What did you expect, and what did GapAI do instead?"
              class="w-full"
            />
          </UFormField>

          <div>
            <p class="ga-subtle mb-2 text-xs font-semibold uppercase tracking-wide">
              Overall experience
            </p>
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="p-0.5"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                @click="rating = star"
              >
                <UIcon
                  name="i-lucide-star"
                  :class="[
                    'h-6 w-6 transition',
                    (hoverRating || rating) >= star
                      ? 'text-amber-400'
                      : 'text-[var(--ga-border)]',
                  ]"
                />
              </button>
            </div>
          </div>

          <div>
            <p class="ga-subtle mb-2 text-xs font-semibold uppercase tracking-wide">
              Screenshots <span class="normal-case font-normal">(optional, up to 3)</span>
            </p>
            <input
              ref="fileInput"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              class="hidden"
              @change="handleFiles(($event.target as HTMLInputElement).files)"
            />
            <div class="flex flex-wrap items-center gap-2">
              <div
                v-for="(shot, index) in screenshots"
                :key="shot.url"
                class="relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--ga-border)]"
              >
                <img :src="shot.url" :alt="shot.name" class="h-full w-full object-cover" />
                <button
                  type="button"
                  class="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  :aria-label="`Remove ${shot.name}`"
                  @click="removeScreenshot(index)"
                >
                  <UIcon name="i-lucide-x" class="h-3 w-3" />
                </button>
              </div>
              <UButton
                v-if="screenshots.length < 3"
                icon="i-lucide-image-plus"
                color="neutral"
                variant="soft"
                class="h-16 w-16 justify-center rounded-xl"
                :loading="isUploading"
                aria-label="Add screenshot"
                @click="openFilePicker"
              />
            </div>
          </div>
        </div>

        <UButton
          :label="isSubmitting ? 'Sending...' : 'Send feedback'"
          color="primary"
          class="mt-6 w-full justify-center rounded-xl"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
