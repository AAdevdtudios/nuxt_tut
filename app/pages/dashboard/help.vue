<script setup lang="ts">
import { computed, ref, watch } from "vue";
import HelpContactTab from "~/components/Help/ContactTab.vue";
import HelpFaqTab from "~/components/Help/FaqTab.vue";
import HelpGuidesTab from "~/components/Help/GuidesTab.vue";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_GUIDE_ITEMS,
  SUPPORT_TABS,
} from "~/constants/support";
import type {
  SupportArticle,
  SupportResponse,
  SupportTab,
} from "~/types/support.types";

definePageMeta({
  layout: "dashboard",
});

const activeTab = ref<SupportTab>("faq");
const searchQuery = ref("");
const expandedFaq = ref<string | null>(null);
const guideExpanded = ref<string | null>(null);
const faqFilter = ref("all");
const contactSubmitted = ref(false);
const isLoadingFaq = ref(false);
const supportArticles = ref<SupportArticle[]>([]);
const availableCategories = ref<string[]>(["all"]);

const contactForm = ref({
  subject: "",
  message: "",
  priority: "normal",
  module: "general",
});

const toast = useToast();
const { $api } = useNuxtApp();

const faqCategories = computed(() =>
  availableCategories.value.map((category) => ({
    label: SUPPORT_CATEGORY_LABELS[category] || category,
    value: category,
  })),
);

const filteredFaq = computed(() =>
  supportArticles.value.filter((item) => {
    const matchesCategory =
      faqFilter.value === "all" || item.category === faqFilter.value;
    const term = searchQuery.value.trim().toLowerCase();

    if (!term) {
      return matchesCategory;
    }

    return (
      matchesCategory &&
      (item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term))
    );
  }),
);

const filteredGuides = computed(() => {
  const term = searchQuery.value.trim().toLowerCase();

  if (!term) {
    return SUPPORT_GUIDE_ITEMS;
  }

  return SUPPORT_GUIDE_ITEMS.filter(
    (guide) =>
      guide.title.toLowerCase().includes(term) ||
      guide.description.toLowerCase().includes(term),
  );
});

const fetchSupport = async () => {
  try {
    isLoadingFaq.value = true;

    const response = await $api.fetch<SupportResponse>("/api/support", {
      method: "GET",
      query: {
        category: faqFilter.value,
      },
    });

    availableCategories.value = response.categories?.length
      ? response.categories
      : ["all"];
    supportArticles.value = [...(response.items || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error?.message || "Failed to load support articles.",
      color: "error",
    });
  } finally {
    isLoadingFaq.value = false;
  }
};

watch(faqFilter, async () => {
  expandedFaq.value = null;
  await fetchSupport();
});

const clearFaqFilters = async () => {
  searchQuery.value = "";
  faqFilter.value = "all";
};

const handleContactSubmit = () => {
  if (!contactForm.value.subject.trim() || !contactForm.value.message.trim()) {
    return;
  }

  const priority =
    contactForm.value.priority === "normal"
      ? "medium"
      : contactForm.value.priority;

  return (async () => {
    try {
      await $api.mutate("/api/support/tickets", {
        method: "POST",
        body: {
          title: contactForm.value.subject.trim(),
          description: contactForm.value.message.trim(),
          module: contactForm.value.module,
          priority,
        },
      });

      contactSubmitted.value = true;
      setTimeout(() => {
        contactSubmitted.value = false;
        contactForm.value = {
          subject: "",
          message: "",
          priority: "normal",
          module: "general",
        };
      }, 3000);
    } catch (error: any) {
      toast.add({
        title: "Error",
        description: error?.message || "Failed to create support ticket.",
        color: "error",
      });
    }
  })();
};

await fetchSupport();
</script>

<template>
  <DashboardBodyLayout
    title="Help & Support"
    description="Find answers, explore guides, or reach out when you need help."
  >
    <template #actions>
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        size="xl"
        variant="outline"
        placeholder="Search for help articles, guides, or topics..."
      />
    </template>
    <div class="space-y-6">
      <UTabs
        v-model="activeTab"
        :items="SUPPORT_TABS"
        value-key="value"
        :ui="{
          trigger: 'justify-center gap-2',
          list: 'rounded-xl border border-default bg-card p-1',
        }"
      />

      <HelpFaqTab
        v-if="activeTab === 'faq'"
        :categories="faqCategories"
        :selected-category="faqFilter"
        :items="filteredFaq"
        :expanded-faq="expandedFaq"
        :is-loading="isLoadingFaq"
        @update:selected-category="faqFilter = $event"
        @update:expanded-faq="expandedFaq = $event"
        @clear-filters="clearFaqFilters"
      />

      <HelpGuidesTab
        v-else-if="activeTab === 'guides'"
        :items="filteredGuides"
        :expanded-guide="guideExpanded"
        @update:expanded-guide="guideExpanded = $event"
      />

      <HelpContactTab
        v-else
        :submitted="contactSubmitted"
        :form="contactForm"
        :modules="
          Object.entries(SUPPORT_CATEGORY_LABELS)
            .filter(([key]) => key !== 'all')
            .map(([value, label]) => ({ value, label }))
        "
        @update:form="contactForm = $event"
        @submit="handleContactSubmit"
      />
    </div>
  </DashboardBodyLayout>
</template>
