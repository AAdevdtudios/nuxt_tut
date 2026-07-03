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
  layout: "newdash",
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
type SupportTicket = {
  id: string;
  title: string;
  description: string;
  module: string;
  priority: string;
  status: string;
  updatedAtUtc: string;
};
type SupportTicketNote = {
  id: string;
  note: string;
  createdAtUtc: string;
};
const supportTickets = ref<SupportTicket[]>([]);
const selectedTicket = ref<SupportTicket | null>(null);
const selectedTicketNotes = ref<SupportTicketNote[]>([]);
const ticketReply = ref("");
const isLoadingTickets = ref(false);
const isSendingReply = ref(false);

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

const fetchTickets = async () => {
  try {
    isLoadingTickets.value = true;
    const response = await $api.fetch<{ items?: SupportTicket[] }>(
      "/api/support/tickets",
      { method: "GET" },
    );
    supportTickets.value = response?.items || [];
  } catch {
    supportTickets.value = [];
  } finally {
    isLoadingTickets.value = false;
  }
};

const openTicket = async (ticket: SupportTicket) => {
  try {
    const response = await $api.fetch<{
      ticket?: SupportTicket;
      notes?: SupportTicketNote[];
    }>(`/api/support/tickets/${ticket.id}`, { method: "GET" });
    selectedTicket.value = response?.ticket || ticket;
    selectedTicketNotes.value = response?.notes || [];
  } catch (error: any) {
    toast.add({
      title: "Could not open ticket",
      description: error?.message || "Please try again.",
      color: "error",
    });
  }
};

const sendTicketReply = async () => {
  const message = ticketReply.value.trim();
  if (!selectedTicket.value || !message) return;

  try {
    isSendingReply.value = true;
    await $api.mutate(`/api/support/tickets/${selectedTicket.value.id}/reply`, {
      method: "POST",
      body: { message },
    });
    ticketReply.value = "";
    await openTicket(selectedTicket.value);
    await fetchTickets();
  } catch (error: any) {
    toast.add({
      title: "Reply failed",
      description: error?.message || "Could not send your reply.",
      color: "error",
    });
  } finally {
    isSendingReply.value = false;
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
      await fetchTickets();

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

await Promise.all([fetchSupport(), fetchTickets()]);
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

      <UCard v-if="activeTab === 'contact'" class="ga-surface border shadow-sm">
        <template #header>
          <div>
            <h3 class="ga-heading font-semibold">My support tickets</h3>
            <p class="ga-muted text-sm">Track replies from the support team.</p>
          </div>
        </template>
        <div v-if="isLoadingTickets" class="ga-muted py-4 text-sm">
          Loading tickets...
        </div>
        <div v-else-if="supportTickets.length" class="space-y-2">
          <button
            v-for="ticket in supportTickets"
            :key="ticket.id"
            type="button"
            class="ga-surface-soft flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left"
            @click="openTicket(ticket)"
          >
            <div class="min-w-0">
              <p class="ga-heading truncate text-sm font-semibold">{{ ticket.title }}</p>
              <p class="ga-muted truncate text-xs">{{ ticket.module }} · {{ ticket.priority }}</p>
            </div>
            <UBadge variant="soft">{{ ticket.status }}</UBadge>
          </button>
        </div>
        <p v-else class="ga-muted py-4 text-sm">No support tickets yet.</p>
      </UCard>

      <UModal :open="Boolean(selectedTicket)" @update:open="!$event && (selectedTicket = null)">
        <template #content>
          <div class="space-y-4 p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="ga-heading font-semibold">{{ selectedTicket?.title }}</h3>
                <p class="ga-muted mt-1 text-sm">{{ selectedTicket?.description }}</p>
              </div>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                @click="selectedTicket = null"
              />
            </div>
            <div class="max-h-64 space-y-2 overflow-y-auto">
              <div
                v-for="note in selectedTicketNotes"
                :key="note.id"
                class="ga-surface-soft rounded-xl border p-3"
              >
                <p class="text-sm">{{ note.note }}</p>
              </div>
              <p v-if="!selectedTicketNotes.length" class="ga-muted text-sm">
                No replies yet.
              </p>
            </div>
            <div class="flex gap-2">
              <UInput v-model="ticketReply" placeholder="Write a reply..." class="flex-1" />
              <UButton
                icon="i-lucide-send"
                :loading="isSendingReply"
                :disabled="!ticketReply.trim()"
                @click="sendTicketReply"
              />
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </DashboardBodyLayout>
</template>
