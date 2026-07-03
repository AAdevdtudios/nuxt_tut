<script setup lang="ts">
definePageMeta({ layout: "newdash" });
const projectStore = useProjectStore();
const libraryStore = useLibraryStore();
const auth = useAuthStore();
const { $api } = useNuxtApp();
const analytics = ref<any>(null);
const totalNotes = computed(() => libraryStore.allLibraries.filter((item) => item.libraryType === "note").length);
const totalMaterials = computed(() => libraryStore.allLibraries.filter((item) => item.libraryType !== "note").length);
const questionsUsed = computed(() => auth.currentUser?.subscription?.usage?.questionsUsed ?? 0);
const questionLimit = computed(() => auth.currentUser?.subscription?.usage?.questionLimit ?? 0);
onMounted(async () => {
  await Promise.allSettled([
    projectStore.fetchProjects(1, 25, ""),
    libraryStore.fetchLibraries(1, 100, "", "all"),
  ]);
  try { analytics.value = await $api.fetch("/api/analytics", { method: "GET" }); } catch {}
});
</script>

<template>
  <DashboardBodyLayout title="Learning analytics" description="A clear view of your study activity and growing knowledge base.">
    <div class="space-y-8">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div v-for="stat in [
          { label: 'Active projects', value: projectStore.allProjects.length, icon: 'i-lucide-folder-kanban' },
          { label: 'Study notes', value: totalNotes, icon: 'i-lucide-notebook-text' },
          { label: 'Library materials', value: totalMaterials, icon: 'i-lucide-library-big' },
          { label: 'Questions answered', value: questionsUsed, icon: 'i-lucide-circle-help' },
        ]" :key="stat.label" class="ga-surface rounded-2xl border p-5 shadow-sm">
          <UIcon :name="stat.icon" class="ga-icon h-5 w-5" />
          <p class="ga-heading mt-8 text-3xl font-semibold">{{ stat.value }}</p>
          <p class="ga-muted mt-1 text-sm">{{ stat.label }}</p>
        </div>
      </section>
      <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="ga-surface rounded-2xl border p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="ga-subtle text-xs font-bold uppercase tracking-[0.18em]">Recent activity</p>
              <h2 class="ga-heading mt-1 font-serif text-2xl font-semibold">Your learning trail</h2>
            </div>
          </div>
          <div class="mt-5 space-y-3">
            <div v-for="(activity, index) in (analytics?.recentActivities || []).slice(0, 6)" :key="index" class="ga-surface-soft flex gap-3 rounded-xl p-3">
              <UIcon name="i-lucide-sparkles" class="ga-icon mt-0.5 h-4 w-4" />
              <div>
                <p class="ga-heading text-sm font-medium">{{ activity.name }}</p>
                <p class="ga-muted text-xs">{{ activity.data }}</p>
              </div>
            </div>
            <p v-if="!analytics?.recentActivities?.length" class="ga-muted py-8 text-center text-sm">Your recent learning activity will appear here.</p>
          </div>
        </div>
        <div class="ga-surface-accent rounded-2xl border p-6">
          <p class="ga-link text-xs font-bold uppercase tracking-[0.18em]">Monthly practice usage</p>
          <p class="ga-heading mt-4 font-serif text-4xl font-semibold">{{ questionsUsed }}<span class="ga-subtle text-lg"> / {{ questionLimit || '—' }}</span></p>
          <p class="ga-muted mt-2 text-sm leading-6">Questions answered against your current plan allowance.</p>
          <UProgress :model-value="questionLimit ? (questionsUsed / questionLimit) * 100 : 0" class="mt-6" />
        </div>
      </section>
    </div>
  </DashboardBodyLayout>
</template>
