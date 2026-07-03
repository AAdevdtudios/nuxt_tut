<script setup lang="ts">
defineProps<{
  status: string;
  activePathTitle?: string;
  activePathDescription?: string;
  recommendationTitle?: string;
  recommendationReason?: string;
  suggestedActions?: string[];
}>();
</script>

<template>
  <!-- Preserved snapshot of the previous two-card section. It is intentionally not mounted. -->
  <section class="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
    <div class="ga-surface rounded-[2rem] border p-5">
      <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">Current step</p>
      <h2 class="ga-heading mt-2 font-serif text-3xl font-semibold">
        {{ status === "diagnostic_ready" ? "Diagnostic test ready" : activePathTitle || "Stream complete" }}
      </h2>
      <p class="ga-muted mt-2 text-sm leading-6">
        {{ activePathDescription || recommendationReason || "Follow the active study path." }}
      </p>
    </div>

    <div class="ga-surface rounded-[2rem] border p-5">
      <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">Recommendation</p>
      <h3 class="ga-heading mt-2 text-lg font-semibold">
        {{ recommendationTitle || "Follow the active path" }}
      </h3>
      <p class="ga-muted mt-2 text-sm leading-6">
        {{ recommendationReason || "GapAI will unlock one path at a time." }}
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <UBadge
          v-for="action in suggestedActions || []"
          :key="action"
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ action }}
        </UBadge>
      </div>
    </div>
  </section>
</template>
