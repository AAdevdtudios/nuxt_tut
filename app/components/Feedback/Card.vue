<script setup lang="ts">
import { feedbackCategoryMeta, feedbackStatusMeta } from "~/constants/feedback";
import type { FeedbackItem } from "~/types/feedback.types";

defineProps<{
  item: FeedbackItem;
  isExpanded: boolean;
  formattedDate: string;
}>();

const emit = defineEmits<{
  vote: [feedbackId: string];
  toggleExpand: [feedbackId: string];
}>();
</script>

<template>
  <UCard class="border-default transition-colors hover:border-primary/30">
    <div class="flex gap-4">
      <div class="flex flex-col items-center gap-1">
        <UButton
          color="neutral"
          :variant="item.hasVoted ? 'soft' : 'outline'"
          square
          @click="emit('vote', item.id)"
        >
          <UIcon name="i-lucide-chevron-up" class="h-5 w-5" />
        </UButton>
        <span
          class="text-sm font-semibold"
          :class="item.hasVoted ? 'text-primary' : 'text-muted-foreground'"
        >
          {{ item.voteCount }}
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
            :class="feedbackCategoryMeta[item.category].chipClass"
          >
            <UIcon
              :name="feedbackCategoryMeta[item.category].icon"
              class="h-3 w-3"
            />
            {{ feedbackCategoryMeta[item.category].label }}
          </span>

          <span
            class="inline-flex items-center gap-1.5 text-xs font-medium"
            :class="feedbackStatusMeta[item.status].textClass"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="feedbackStatusMeta[item.status].dotClass"
            />
            {{ feedbackStatusMeta[item.status].label }}
          </span>

          <span
            v-if="item.isOwner"
            class="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            Your post
          </span>

          <span class="text-xs text-muted-foreground">{{ formattedDate }}</span>
        </div>

        <div class="mt-2 space-y-2">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ item.title }}
          </h3>
          <p
            class="text-sm text-muted-foreground"
            :class="isExpanded ? '' : 'line-clamp-2'"
          >
            {{ item.description }}
          </p>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-3">
          <UButton
            color="primary"
            variant="ghost"
            size="xs"
            @click="emit('toggleExpand', item.id)"
          >
            {{ isExpanded ? "Show less" : "Read more" }}
          </UButton>

          <span
            v-if="item.adminResolution"
            class="text-xs text-muted-foreground"
          >
            {{ item.adminResolution }}
          </span>

          <span class="text-xs text-muted-foreground">
            Rated {{ item.overallExperienceRating }}/5
          </span>
        </div>
      </div>
    </div>
  </UCard>
</template>
