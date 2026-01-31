<template>
  <DashboardBodyLayout title="">
    <div
      class="mb-4 flex flex-col md:flex-row gap-2 items-center md:justify-between"
    >
      <div class="flex items-center gap-2">
        <UButton
          variant="ghost"
          :to="`/dashboard/projects`"
          icon="i-lucide-arrow-left"
        />
        <div
          class="bg-primary p-1 md:p-3 rounded-lg items-center justify-center flex"
        >
          <UIcon name="i-lucide-history" class="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 class="text-2xl md:text-3xl font-bold text-foreground">
            Subject Topic
          </h2>
          <p class="text-xs md:text-lg text-muted">
            Comprehensive preparation for end of semester examinations covering
            all major subjects
          </p>
        </div>
      </div>
      <div class="flex gap-2 mt-2 md:mt-0">
        <div class="flex items-center gap-2 px-4 py-2">
          <UIcon
            name="i-lucide-calendar"
            class="h-4 w-4 text-muted-foreground"
          />
          <span>Due Apr 15, 2024</span>
        </div>
        <div class="flex items-center gap-2 px-4 py-2">
          <UIcon name="i-lucide-target" class="h-4 w-4 text-muted-foreground" />
          <span>65% complete</span>
        </div>
      </div>
    </div>
    <UTabs
      v-if="!isMobile"
      :model-value="currentTab"
      @update:model-value="getCurrentTab"
      :items="PROJECT_TABS"
      class="mb-3 mt-2"
    />
    <USelect
      v-else
      v-model="currentTab"
      default-value="overview"
      variant="soft"
      :icon="icon"
      size="xl"
      :items="PROJECT_TABS"
      class="mb-3 w-full"
    />
    <component :is="currentTabComponent()" />
  </DashboardBodyLayout>
</template>
<script setup lang="ts">
import { useIsMobile } from "~/composable/useIsMobile";
import { PROJECT_TABS } from "~/constants/projects.const";
const { isMobile } = useIsMobile();

var currentTab = ref("overview");
const icon = computed(
  () => PROJECT_TABS.find((item) => item.value === currentTab.value)?.icon
);

function getCurrentTab(val: string | number) {
  currentTab.value = String(val);
  currentTabComponent();
}
function currentTabComponent() {
  return PROJECT_TABS.find((item) => item.value === currentTab.value)
    ?.component;
}

definePageMeta({
  layout: "dashboard",
});
</script>
