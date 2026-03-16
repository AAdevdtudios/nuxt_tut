<script setup lang="ts">
import { SUPPORT_CATEGORY_LABELS } from "~/constants/support";
import type { SupportArticle } from "~/types/support.types";

defineProps<{
  categories: Array<{ label: string; value: string }>;
  selectedCategory: string;
  items: SupportArticle[];
  expandedFaq: string | null;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  "update:selectedCategory": [value: string];
  "update:expandedFaq": [value: string | null];
  clearFilters: [];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="category in categories"
        :key="category.value"
        :variant="selectedCategory === category.value ? 'solid' : 'outline'"
        :color="selectedCategory === category.value ? 'primary' : 'neutral'"
        size="lg"
        @click="emit('update:selectedCategory', category.value)"
      >
        {{ category.label }}
      </UButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin" />
    </div>

    <div
      v-else-if="items.length === 0"
      class="flex flex-col items-center gap-3 rounded-xl border border-default bg-card py-16"
    >
      <UIcon
        name="i-lucide-circle-help"
        class="h-10 w-10 text-muted-foreground/40"
      />
      <p class="text-muted-foreground">No results found.</p>
      <UButton color="primary" variant="ghost" @click="emit('clearFilters')">
        Clear filters
      </UButton>
    </div>

    <UAccordion
      v-else
      :modelValue="expandedFaq ?? undefined"
      :items="
        items.map((faq) => ({
          label: faq.question,
          value: faq.id,
          slot: faq.id,
        }))
      "
      type="single"
      collapsible
      :ui="{
        item: 'rounded-xl border border-default bg-card px-5 py-1',
        trigger: 'py-4 text-left',
      }"
      @update:modelValue="
        emit('update:expandedFaq', typeof $event === 'string' ? $event : null)
      "
    >
      <template v-for="faq in items" :key="faq.id" #[faq.id]>
        <div class="space-y-4 border-t border-default pb-4 pt-4">
          <div class="flex items-center gap-2">
            <UBadge color="primary" variant="soft">
              {{ SUPPORT_CATEGORY_LABELS[faq.category] || faq.category }}
            </UBadge>
            <span class="text-xs text-muted-foreground">
              Updated
              {{
                new Date(faq.updatedAtUtc).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }}
            </span>
          </div>
          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ faq.answer }}
          </p>
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">Was this helpful?</span>
            <UButton size="xs" color="neutral" variant="outline">Yes</UButton>
            <UButton size="xs" color="neutral" variant="outline">No</UButton>
          </div>
        </div>
      </template>
    </UAccordion>
  </div>
</template>
