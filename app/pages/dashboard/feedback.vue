<script setup lang="ts">
import { computed, ref } from "vue";
import FeedbackFilters from "~/components/Feedback/Filters.vue";
import FeedbackForm from "~/components/Feedback/Form.vue";
import FeedbackList from "~/components/Feedback/List.vue";
import type {
  FeedbackCategory,
  FeedbackItem,
  FeedbackListResponse,
  FeedbackSortBy,
  FeedbackStatus,
} from "~/types/feedback.types";

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();
const { $api } = useNuxtApp();

const feedbackList = ref<FeedbackItem[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const showForm = ref(false);
const submitted = ref(false);
const expandedId = ref<string | null>(null);
const filterCategory = ref<FeedbackCategory | "all">("all");
const filterStatus = ref<FeedbackStatus | "all">("all");
const sortBy = ref<FeedbackSortBy>("votes");
const rating = ref(0);
const hoverRating = ref(0);
const page = ref(1);
const pageSize = ref(20);

const form = ref({
  title: "",
  description: "",
  category: "feature-request" as FeedbackCategory,
});

const filteredFeedback = computed(() => {
  const list = [...feedbackList.value]
    .filter(
      (item) =>
        filterCategory.value === "all" ||
        item.category === filterCategory.value,
    )
    .filter(
      (item) =>
        filterStatus.value === "all" || item.status === filterStatus.value,
    );

  if (sortBy.value === "votes") {
    return list.sort((a, b) => b.voteCount - a.voteCount);
  }

  return list.sort(
    (a, b) =>
      new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
  );
});

const canSubmit = computed(
  () =>
    form.value.title.trim().length >= 3 &&
    form.value.description.trim().length >= 10 &&
    rating.value >= 1,
);

const formatRelativeDate = (value: string) => {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const resetForm = () => {
  form.value = {
    title: "",
    description: "",
    category: "feature-request",
  };
  rating.value = 0;
  hoverRating.value = 0;
};

const fetchFeedback = async () => {
  try {
    isLoading.value = true;

    const response = await $api.fetch<FeedbackListResponse>("/api/feedback", {
      method: "GET",
      query: {
        page: page.value,
        pageSize: pageSize.value,
      },
    });

    feedbackList.value = response.items || [];
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error?.message || "Failed to load feedback.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const submitFeedback = async () => {
  if (!canSubmit.value) return;

  try {
    isSubmitting.value = true;

    const created = await $api.mutate<FeedbackItem>("/api/feedback", {
      method: "POST",
      body: {
        category: form.value.category,
        title: form.value.title.trim(),
        description: form.value.description.trim(),
        overallExperienceRating: rating.value,
      },
    });

    feedbackList.value = [created, ...feedbackList.value];
    submitted.value = true;
    resetForm();

    setTimeout(() => {
      submitted.value = false;
      showForm.value = false;
    }, 1800);
  } catch (error: any) {
    toast.add({
      title: "Submit failed",
      description: error?.message || "Could not submit feedback.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const toggleVote = async (feedbackId: string) => {
  const current = feedbackList.value.find((item) => item.id === feedbackId);

  if (!current) return;

  const previous = { ...current };
  current.hasVoted = !current.hasVoted;
  current.voteCount += current.hasVoted ? 1 : -1;

  try {
    const updated = await $api.mutate<FeedbackItem>(
      `/api/feedback/${feedbackId}/vote`,
      {
        method: "POST",
      },
    );

    feedbackList.value = feedbackList.value.map((item) =>
      item.id === feedbackId ? updated : item,
    );
  } catch (error: any) {
    feedbackList.value = feedbackList.value.map((item) =>
      item.id === feedbackId ? previous : item,
    );

    toast.add({
      title: "Vote failed",
      description: error?.message || "Could not update vote.",
      color: "error",
    });
  }
};

const toggleExpanded = (feedbackId: string) => {
  expandedId.value = expandedId.value === feedbackId ? null : feedbackId;
};

await fetchFeedback();
</script>

<template>
  <DashboardBodyLayout
    title="Feedback"
    description="Report bugs, request features, or share what is working well."
  >
    <template #actions>
      <UButton
        icon="i-lucide-message-square-plus"
        color="primary"
        @click="showForm = !showForm"
      >
        New Feedback
      </UButton>
    </template>

    <div class="space-y-6">
      <FeedbackForm
        v-if="showForm"
        v-model="form"
        :rating="rating"
        :hover-rating="hoverRating"
        :submitted="submitted"
        :is-submitting="isSubmitting"
        :can-submit="canSubmit"
        @update:rating="rating = $event"
        @update:hover-rating="hoverRating = $event"
        @cancel="showForm = false"
        @submit="submitFeedback"
      />

      <FeedbackFilters
        :category="filterCategory"
        :status="filterStatus"
        :sort-by="sortBy"
        @update:category="filterCategory = $event"
        @update:status="filterStatus = $event"
        @update:sort-by="sortBy = $event"
      />

      <FeedbackList
        :items="filteredFeedback"
        :is-loading="isLoading"
        :expanded-id="expandedId"
        :format-relative-date="formatRelativeDate"
        @vote="toggleVote"
        @toggle-expand="toggleExpanded"
      />
    </div>
  </DashboardBodyLayout>
</template>
