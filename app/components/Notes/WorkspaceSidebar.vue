<script setup lang="ts">
const activeSidebarTab = ref("notes");
const selectedNoteId = ref(1);
const search = ref("");

const demoNotes = [
  { id: 1, title: "Project kickoff notes", updatedAt: "2m ago" },
  { id: 2, title: "Research summary", updatedAt: "14m ago" },
  { id: 3, title: "Weekly review", updatedAt: "1h ago" },
  { id: 4, title: "Draft outline", updatedAt: "Today" },
];

const filteredNotes = computed(() =>
  demoNotes.filter((note) =>
    note.title.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

const sidebarTabs = [
  { label: "Notes", icon: "i-lucide-notebook-text", value: "notes" },
  { label: "AI Chats", icon: "i-lucide-message-circle", value: "ai-chats" },
];

const modelOptions = [
  { label: "GPT-4.1 Mini", value: "gpt-4.1-mini" },
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
  { label: "Gemini 1.5 Pro", value: "gemini-1-5-pro" },
];

const selectedModel = ref(modelOptions[0]?.value || "");
const aiInput = ref("");
const aiMessages = ref([
  {
    id: 1,
    role: "assistant",
    text: "Hi, share what you want to improve in this note.",
  },
]);

const sendAiMessage = () => {
  const text = aiInput.value.trim();
  if (!text) return;

  aiMessages.value.push({ id: Date.now(), role: "user", text });
  aiMessages.value.push({
    id: Date.now() + 1,
    role: "assistant",
    text: `Using ${selectedModel.value}, I can help rewrite, summarize, or expand this section.`,
  });
  aiInput.value = "";
};
</script>

<template>
  <UDashboardSidebar
    collapsible
    :ui="{
      root: 'min-h-[calc(100dvh-76px)]',
      header: 'border-b border-default',
      body: 'px-2 py-3',
    }"
  >
    <template #header="{ collapsed }">
      <div
        v-if="collapsed"
        class="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
      >
        <UIcon name="i-lucide-notebook-tabs" class="size-4 text-primary" />
      </div>
      <div v-else class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <UIcon name="i-lucide-notebook-tabs" class="size-4 text-primary" />
        </div>
        <span class="text-sm font-semibold">Workspace</span>
      </div>
    </template>

    <template #default="{ collapsed }">
      <div v-if="collapsed" class="space-y-1">
        <UButton
          block
          size="sm"
          variant="ghost"
          color="neutral"
          icon="i-lucide-notebook-text"
          @click="activeSidebarTab = 'notes'"
        />
        <UButton
          block
          size="sm"
          variant="ghost"
          color="neutral"
          icon="i-lucide-message-circle"
          @click="activeSidebarTab = 'ai-chats'"
        />
      </div>

      <div v-else class="flex h-full min-h-0 flex-col">
        <UTabs
          v-model="activeSidebarTab"
          :items="sidebarTabs"
          value-key="value"
          :ui="{
            list: 'mb-3 rounded-lg border border-default p-1',
            trigger: 'justify-center gap-2',
          }"
        />

        <div v-if="activeSidebarTab === 'notes'" class="min-h-0 flex-1 overflow-y-auto">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search notes..."
            class="mb-3"
          />

          <div class="space-y-1">
            <button
              v-for="note in filteredNotes"
              :key="note.id"
              type="button"
              class="w-full rounded-md px-2 py-2 text-left transition"
              :class="
                selectedNoteId === note.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground'
              "
              @click="selectedNoteId = note.id"
            >
              <p class="truncate text-sm font-medium">{{ note.title }}</p>
              <p class="text-xs opacity-80">{{ note.updatedAt }}</p>
            </button>
          </div>
        </div>

        <div v-else class="min-h-0 flex flex-1 flex-col">
          <div
            class="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-default bg-muted/30 p-2"
          >
            <div
              v-for="message in aiMessages"
              :key="message.id"
              class="max-w-[90%] rounded-lg px-3 py-2 text-sm"
              :class="
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-card'
              "
            >
              {{ message.text }}
            </div>
          </div>

          <div class="mt-3 space-y-2">
            <USelect
              v-model="selectedModel"
              :items="modelOptions"
              value-key="value"
              class="w-full"
            />
            <div class="flex items-center gap-2">
              <UInput
                v-model="aiInput"
                class="flex-1"
                placeholder="Ask AI about this note..."
                @keyup.enter="sendAiMessage"
              />
              <UButton
                size="sm"
                color="primary"
                icon="i-lucide-send"
                @click="sendAiMessage"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardSidebar>
</template>
