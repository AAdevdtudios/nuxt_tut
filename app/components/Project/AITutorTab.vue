<template>
  <div class="flex h-[calc(100vh-16rem)] gap-4">
    <div
      v-if="showHistory"
      class="w-64 shrink-0 rounded-lg border border-default bg-card"
    >
      <div
        class="flex items-center justify-between border-b border-default p-4"
      >
        <h3 class="font-semibold text-card-foreground">Chat History</h3>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          size="sm"
          @click="showHistory = false"
          aria-label="Close chat history"
        />
      </div>
      <div class="p-2">
        <UButton
          @click="startNewChat"
          class="mb-2 w-full"
          color="primary"
          icon="i-lucide-sparkles"
          label="New Chat"
        />
        <div class="space-y-1">
          <div
            v-for="chat in chatHistories"
            :key="String(chat.id)"
            :class="[
              'w-full rounded-lg p-3 text-left text-sm transition-colors',
              currentChatId === String(chat.id)
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent',
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <button
                class="min-w-0 flex-1 text-left"
                @click="loadChat(chat.id)"
              >
                <p class="line-clamp-1 font-medium">{{ chat.title }}</p>
              </button>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                @click.stop="deleteChat(chat.id)"
                aria-label="Delete chat"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="flex items-center gap-2">
          <UButton
            v-if="!showHistory"
            icon="i-lucide-history"
            variant="outline"
            size="sm"
            @click="showChatHistory()"
            aria-label="Show chat history"
          />
          <div>
            <h3 class="text-xl font-semibold text-foreground">
              Project AI Tutor
            </h3>
            <p class="text-sm text-muted-foreground">
              {{ subtitle }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-2 rounded-md border border-default px-2 py-1"
          >
            <span class="text-xs text-muted-foreground">Web</span>
            <USwitch v-model="includeWeb" />
          </div>
          <USelect
            v-model="selectedAiTier"
            :items="aiTierOptions"
            :disabled="!aiTierOptions.length"
            placeholder="AI tier"
            class="w-52"
          />
          <UButton
            @click="handleLibraryToggle()"
            variant="outline"
            icon="i-lucide-file-text"
            :label="`Library (${selectedContent.length})`"
          />
        </div>
      </div>

      <div v-if="selectedContent.length > 0" class="mb-4 flex flex-wrap gap-2">
        <div
          v-for="item in selectedContent"
          :key="String(item.id)"
          class="flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-primary"
        >
          <UIcon name="i-lucide-file-text" class="h-3 w-3" />
          <span>{{ item.title }}</span>
          <button
            @click="toggleContentSelection(item)"
            class="hover:text-primary/70"
            aria-label="Remove selected content"
          >
            <UIcon name="i-lucide-x" class="h-3 w-3" />
          </button>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <div
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-default bg-card"
        >
          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                :class="[
                  'flex max-w-[80%] gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                ]"
              >
                <div
                  :class="[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium',
                    message.role === 'assistant'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  ]"
                >
                  <UIcon
                    v-if="message.role === 'assistant'"
                    name="i-lucide-sparkles"
                    class="h-4 w-4"
                  />
                  <span v-else>U</span>
                </div>
                <div
                  :class="[
                    'rounded-lg px-4 py-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  ]"
                >
                  <p
                    v-if="message.role === 'user'"
                    class="whitespace-pre-wrap text-sm leading-relaxed"
                  >
                    {{ message.content }}
                  </p>
                  <div
                    v-else
                    class="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground"
                    v-html="renderChatMarkdown(message.content)"
                  />
                  <div
                    v-if="message.sources?.length"
                    class="mt-3 space-y-1 rounded-md border border-default bg-background/60 p-2"
                  >
                    <p
                      class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Sources
                    </p>
                    <a
                      v-for="source in message.sources"
                      :key="source.sourceId"
                      :href="source.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block truncate text-xs text-primary hover:underline"
                      :title="source.title || source.url"
                    >
                      {{ source.title || source.url }}
                    </a>
                  </div>
                  <p
                    :class="[
                      'mt-2 text-xs',
                      message.role === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground/70',
                    ]"
                  >
                    {{ isClientMounted ? formatTime(message.timestamp) : "" }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="isTyping" class="flex justify-start">
              <div class="flex gap-3">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                >
                  <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
                </div>
                <div class="rounded-lg bg-muted px-4 py-3">
                  <div class="flex gap-1">
                    <div
                      class="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style="animation-delay: -0.3s"
                    />
                    <div
                      class="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style="animation-delay: -0.15s"
                    />
                    <div
                      class="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-default p-4">
            <div class="flex items-end gap-2">
              <div class="flex-1 rounded-lg border border-border bg-background">
                <textarea
                  v-model="inputValue"
                  @keydown="handleInputKeydown"
                  placeholder="Ask anything about this project..."
                  rows="3"
                  class="w-full resize-none bg-transparent p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <UButton
                @click="handleSend"
                icon="i-lucide-send"
                :disabled="!canSend"
                :loading="isTyping"
                color="primary"
                size="lg"
                aria-label="Send message"
              />
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>

        <div
          v-if="showLibrary"
          class="w-64 shrink-0 rounded-lg border border-default bg-card"
        >
          <div
            class="flex items-center justify-between border-b border-default p-4"
          >
            <h3 class="font-semibold text-card-foreground">Select Content</h3>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="showLibrary = false"
              aria-label="Close library"
            />
          </div>
          <div class="space-y-2 p-3">
            <button
              v-for="item in libraryItems"
              :key="String(item.id)"
              @click="toggleContentSelection(item)"
              :class="[
                'flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors',
                isSelected(item)
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-accent',
              ]"
            >
              <div
                :class="[
                  'flex h-5 w-5 items-center justify-center rounded border',
                  isSelected(item)
                    ? 'border-primary bg-primary'
                    : 'border-border bg-background',
                ]"
              >
                <UIcon
                  v-if="isSelected(item)"
                  name="i-lucide-check"
                  class="h-3 w-3 text-primary-foreground"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="line-clamp-1 font-medium">{{ item.title }}</p>
                <p class="text-xs text-muted-foreground">{{ item.type }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatHistory, LibrarySelection } from "~/types";
import {
  LazyAiChatHistorySlideOver,
  LazyAiChatLibraryDrawer,
} from "#components";
import { useIsMobile } from "~/composable/useIsMobile";
import { renderChatMarkdown } from "~/utils/chatMarkdown";
import { normalizeAssistantAnswer } from "~/utils/chatResponse";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: AdaptiveCitation[];
  sources?: AdaptiveSource[];
  toolsUsed?: AdaptiveTool[];
};

type AdaptiveCitation = {
  chunkId: string;
  snippet: string;
};

type AdaptiveSource = {
  sourceId: string;
  url: string;
  title: string;
  snippet: string;
};

type AdaptiveTool = {
  name: string;
  status: string;
  detail?: string;
};

type AdaptiveAiItem = {
  tier: string;
  provider: string;
  model: string;
  isDefault: boolean;
};

type AdaptiveSessionItem = {
  sessionId: string;
  libraryItemId: string | null;
  libraryTitle: string | null;
  title: string;
  updatedAtUtc: string;
  createdAtUtc: string;
};

type AdaptiveLibraryItem = {
  libraryItemId: string;
  title: string;
  type: string;
};

type AdaptiveSessionMessageItem = {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  createdAtUtc: string;
};

type AdaptiveChatResponse = {
  chat?: {
    sessionId: string;
    answer: string;
    aiTier?: string;
    citations?: AdaptiveCitation[];
    sources?: AdaptiveSource[];
    toolsUsed?: AdaptiveTool[];
  };
  aiTier?: string;
};

type AdaptiveChatPayload = {
  projectId: string;
  libraryItemId: string | number | null;
  sessionId: string | null;
  message: string;
  aiTier?: string;
  includeWeb?: boolean;
};

const props = defineProps<{
  projectId: string;
  projectName?: string;
}>();

const { $api } = useNuxtApp();
const toast = useToast();
const overlay = useOverlay();
const { isMobile } = useIsMobile();

const showLibrary = ref(false);
const showHistory = ref(false);
const isTyping = ref(false);
const inputValue = ref("");
const selectedAiTier = ref("");
const currentChatId = ref<string | null>(null);
const includeWeb = ref(true);
const isClientMounted = ref(false);

const accessibleAis = ref<AdaptiveAiItem[]>([]);
const sessionItems = ref<AdaptiveSessionItem[]>([]);
const libraryItems = ref<LibrarySelection[]>([]);
const selectedContent = ref<LibrarySelection[]>([]);
const messages = ref<UiMessage[]>([]);
const messagesBySession = ref<Record<string, UiMessage[]>>({});

const mobileChatSlideOver = overlay.create(LazyAiChatHistorySlideOver);
const mobileLibraryDrawer = overlay.create(LazyAiChatLibraryDrawer);

const subtitle = computed(() =>
  props.projectName
    ? `Ask questions about ${props.projectName}.`
    : "Ask questions about this project.",
);

const welcomeMessage = computed<UiMessage>(() => ({
  id: crypto.randomUUID(),
  role: "assistant",
  content:
    "Chat ready. Ask anything about this project. Select one library item for tighter context if needed.",
  timestamp: new Date(),
}));

const aiTierOptions = computed(() =>
  accessibleAis.value.map((item) => ({
    label: `${item.tier} (${item.provider})`,
    value: item.tier,
  })),
);

const chatHistories = computed<ChatHistory[]>(() =>
  sessionItems.value.map((session, index) => {
    const sessionMessages = messagesBySession.value[session.sessionId] || [];
    const assistantMessage = [...sessionMessages]
      .reverse()
      .find((message) => message.role === "assistant");

    return {
      id: session.sessionId || `session-${index}`,
      title: session.title || "Chat session",
      lastMessage:
        assistantMessage?.content || session.title || "No messages yet",
      timestamp: new Date(
        session.updatedAtUtc || session.createdAtUtc || Date.now(),
      ),
      messages: sessionMessages.map((message, messageIndex) => ({
        id: messageIndex + 1,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
      })),
    };
  }),
);

const canSend = computed(
  () => Boolean(inputValue.value.trim()) && Boolean(props.projectId),
);

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const isSelected = (item: LibrarySelection) =>
  selectedContent.value.some(
    (current) => String(current.id) === String(item.id),
  );

const hasSelectedTier = computed(() =>
  accessibleAis.value.some((item) => item.tier === selectedAiTier.value),
);

const getSessionStorageKey = (projectId: string) =>
  `adaptive-chat:${projectId}:sessions`;

const toUiMessage = (message: any): UiMessage => ({
  id: String(message?.id || crypto.randomUUID()),
  role: message?.role === "user" ? "user" : "assistant",
  content: String(message?.content || ""),
  timestamp: new Date(message?.timestamp || Date.now()),
  citations: Array.isArray(message?.citations) ? message.citations : [],
  sources: Array.isArray(message?.sources) ? message.sources : [],
  toolsUsed: Array.isArray(message?.toolsUsed) ? message.toolsUsed : [],
});

const normalizeSessionItems = (response: any): AdaptiveSessionItem[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const persistSessionsToStorage = () => {
  if (!process.client || !props.projectId) return;
  localStorage.setItem(
    getSessionStorageKey(props.projectId),
    JSON.stringify(messagesBySession.value),
  );
};

const hydrateSessionsFromStorage = () => {
  if (!process.client || !props.projectId) return;
  const raw = localStorage.getItem(getSessionStorageKey(props.projectId));
  if (!raw) {
    messagesBySession.value = {};
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, any[]>;
    const hydrated: Record<string, UiMessage[]> = {};

    Object.entries(parsed || {}).forEach(([sessionId, sessionMessages]) => {
      hydrated[sessionId] = Array.isArray(sessionMessages)
        ? sessionMessages.map(toUiMessage)
        : [];
    });

    messagesBySession.value = hydrated;
  } catch {
    messagesBySession.value = {};
  }
};

const isAdaptiveProcessingError = (error: any) => {
  const message = String(
    error?.data?.message || error?.statusMessage || error?.message || "",
  ).toLowerCase();
  return (
    message.includes("failed to process adaptive chat") ||
    message.includes("requested ai tier is configured") ||
    message.includes("processable content")
  );
};

const persistCurrentMessages = () => {
  if (!currentChatId.value) return;
  messagesBySession.value[currentChatId.value] = [...messages.value];
  persistSessionsToStorage();
};

const resetChatView = () => {
  currentChatId.value = null;
  messages.value = [welcomeMessage.value];
  selectedContent.value = [];
};

async function fetchAccessibleAis(projectId: string) {
  const response = await $api.fetch<{ items?: AdaptiveAiItem[] }>(
    `/api/projects/${projectId}/adaptive/chat/ais`,
    { method: "GET" },
  );
  accessibleAis.value = Array.isArray(response?.items) ? response.items : [];

  if (!selectedAiTier.value) {
    selectedAiTier.value =
      accessibleAis.value.find((item) => item.isDefault)?.tier ||
      accessibleAis.value[0]?.tier ||
      "";
  }
}

async function fetchChatLibraries(projectId: string) {
  const response = await $api.fetch<{ items?: AdaptiveLibraryItem[] }>(
    `/api/projects/${projectId}/adaptive/chat/libraries`,
    { method: "GET" },
  );
  const items = Array.isArray(response?.items) ? response.items : [];
  libraryItems.value = items.map((item) => ({
    id: item.libraryItemId,
    title: item.title,
    type: String(item.type || "Unknown"),
  }));
}

async function fetchSessions(projectId: string) {
  const response = await $api.fetch<{ items?: AdaptiveSessionItem[] } | AdaptiveSessionItem[]>(
    `/api/projects/${projectId}/adaptive/chat/sessions`,
    { method: "GET" },
  );
  sessionItems.value = normalizeSessionItems(response);
}

async function fetchSessionMessages(projectId: string, sessionId: string) {
  const response = await $api.fetch<{ items?: AdaptiveSessionMessageItem[] } | AdaptiveSessionMessageItem[]>(
    `/api/projects/${projectId}/adaptive/chat/sessions/${sessionId}/messages`,
    { method: "GET" },
  );

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.items)
      ? response.items
      : [];

  return items.map((item) => ({
    id: item.messageId,
    role: item.role === "user" ? "user" : "assistant",
    content: item.content || "",
    timestamp: new Date(item.createdAtUtc || Date.now()),
  })) as UiMessage[];
}

async function loadProjectContext(projectId: string) {
  if (!projectId) return;

  try {
    hydrateSessionsFromStorage();

    await Promise.all([
      fetchAccessibleAis(projectId),
      fetchChatLibraries(projectId),
      fetchSessions(projectId),
    ]);

    if (!currentChatId.value) {
      messages.value = [welcomeMessage.value];
    }

    if (!isMobile.value && sessionItems.value.length > 0) {
      showHistory.value = true;
    }
  } catch (error: any) {
    toast.add({
      title: "Chat setup failed",
      description: error?.message || "Could not load project chat context.",
      color: "error",
    });
  }
}

function toggleContentSelection(item: LibrarySelection) {
  if (isSelected(item)) {
    selectedContent.value = [];
    return;
  }
  selectedContent.value = [item];
}

function hydrateSelectedLibraryForSession(sessionId: string) {
  const session = sessionItems.value.find((item) => item.sessionId === sessionId);
  const libraryItemId = session?.libraryItemId;

  if (!libraryItemId) {
    selectedContent.value = [];
    return;
  }

  const existing = libraryItems.value.find(
    (item) => String(item.id) === String(libraryItemId),
  );

  if (existing) {
    selectedContent.value = [existing];
    return;
  }

  selectedContent.value = [
    {
      id: libraryItemId,
      title: session?.libraryTitle || "Selected library",
      type: "Unknown",
    },
  ];
}

async function loadChat(chatId: string | number) {
  persistCurrentMessages();
  const normalizedId = String(chatId);
  currentChatId.value = normalizedId;
  hydrateSelectedLibraryForSession(normalizedId);

  const saved = messagesBySession.value[normalizedId];
  if (saved?.length) {
    messages.value = [...saved];
  }

  try {
    const sessionMessages = await fetchSessionMessages(props.projectId, normalizedId);

    if (sessionMessages.length > 0) {
      messages.value = sessionMessages;
      messagesBySession.value[normalizedId] = sessionMessages;
      persistSessionsToStorage();
      return;
    }
  } catch (error: any) {
    if (!saved?.length) {
      toast.add({
        title: "Unable to load session",
        description:
          error?.message || "Could not fetch messages for this chat session.",
        color: "error",
      });
    }
  }

  if (saved?.length) return;
  messages.value = [];
}

async function deleteChat(chatId: string | number) {
  const normalizedId = String(chatId);
  try {
    await $api.mutate(
      `/api/projects/${props.projectId}/adaptive/chat/sessions/${normalizedId}`,
      {
        method: "DELETE",
      },
    );

    sessionItems.value = sessionItems.value.filter(
      (session) => session.sessionId !== normalizedId,
    );

    delete messagesBySession.value[normalizedId];
    persistSessionsToStorage();

    if (currentChatId.value === normalizedId) {
      resetChatView();
    }

    toast.add({
      title: "Chat deleted",
      description: "The chat session was deleted successfully.",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Delete failed",
      description: error?.message || "Could not delete this chat session.",
      color: "error",
    });
  }
}

function startNewChat() {
  persistCurrentMessages();
  resetChatView();
}

async function showChatHistory() {
  if (!isMobile.value) {
    showHistory.value = true;
    return;
  }

  await mobileChatSlideOver.open({
    chats: chatHistories.value,
    currentChatId: currentChatId.value,
    onLoadChat: (chatId: string | number) => {
      void loadChat(chatId);
      mobileChatSlideOver.close();
    },
    onDeleteChat: (chatId: string | number) => {
      void deleteChat(chatId);
      mobileChatSlideOver.close();
    },
    onNewChat: () => {
      startNewChat();
      mobileChatSlideOver.close();
    },
  });
}

async function handleLibraryToggle() {
  if (!isMobile.value) {
    showLibrary.value = !showLibrary.value;
    return;
  }

  await mobileLibraryDrawer.open({
    selected: selectedContent.value,
    items: libraryItems.value,
    "onUpdate:selected": (items: LibrarySelection[]) => {
      selectedContent.value = items;
    },
  });
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter") return;
  if (event.shiftKey) return;
  event.preventDefault();
  void handleSend();
}

async function handleSend() {
  if (!canSend.value || isTyping.value) return;

  const prompt = inputValue.value.trim();
  const userMessage: UiMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: prompt,
    timestamp: new Date(),
  };

  messages.value.push(userMessage);
  inputValue.value = "";
  isTyping.value = true;

  try {
    const basePayload: AdaptiveChatPayload = {
      projectId: props.projectId,
      libraryItemId: selectedContent.value[0]?.id || null,
      sessionId: currentChatId.value,
      message: prompt,
      aiTier: hasSelectedTier.value
        ? selectedAiTier.value || undefined
        : undefined,
      includeWeb: includeWeb.value,
    };

    const attempts: Array<{
      payload: AdaptiveChatPayload;
      mode: "primary" | "no-library" | "default-tier" | "safe-default";
    }> = [
      { payload: basePayload, mode: "primary" },
      {
        payload: { ...basePayload, libraryItemId: null },
        mode: "no-library",
      },
      {
        payload: { ...basePayload, aiTier: undefined },
        mode: "default-tier",
      },
      {
        payload: { ...basePayload, libraryItemId: null, aiTier: undefined },
        mode: "safe-default",
      },
    ];

    let response: AdaptiveChatResponse | null = null;
    let usedMode: (typeof attempts)[number]["mode"] = "primary";
    let lastError: any = null;

    for (const attempt of attempts) {
      if (attempt.mode === "no-library" && !basePayload.libraryItemId) {
        continue;
      }
      if (attempt.mode === "default-tier" && !basePayload.aiTier) {
        continue;
      }
      if (
        attempt.mode === "safe-default" &&
        !basePayload.libraryItemId &&
        !basePayload.aiTier
      ) {
        continue;
      }

      try {
        response = await $api.mutate<AdaptiveChatResponse>(
          `/api/projects/${props.projectId}/adaptive/chat`,
          {
            method: "POST",
            body: attempt.payload,
          },
        );
        usedMode = attempt.mode;
        break;
      } catch (error: any) {
        lastError = error;
        if (!isAdaptiveProcessingError(error)) {
          throw error;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Could not process adaptive chat.");
    }

    const rawAnswer =
      response?.chat?.answer ??
      (response as any)?.answer ??
      (response as any)?.chat ??
      response ??
      "No response received.";
    const answer = normalizeAssistantAnswer(rawAnswer);
    const sessionId = response?.chat?.sessionId || currentChatId.value;

    if (sessionId) {
      currentChatId.value = String(sessionId);
    }

    messages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: answer,
      timestamp: new Date(),
      citations: response?.chat?.citations || [],
      sources: response?.chat?.sources || [],
      toolsUsed: response?.chat?.toolsUsed || [],
    });

    persistCurrentMessages();
    await fetchSessions(props.projectId);

    if (usedMode !== "primary") {
      if (usedMode === "no-library" || usedMode === "safe-default") {
        selectedContent.value = [];
      }
      if (usedMode === "default-tier" || usedMode === "safe-default") {
        selectedAiTier.value =
          accessibleAis.value.find((item) => item.isDefault)?.tier ||
          accessibleAis.value[0]?.tier ||
          "";
      }

      toast.add({
        title: "Chat sent with fallback",
        description:
          usedMode === "no-library"
            ? "Selected library could not be processed. Sent without library context."
            : usedMode === "default-tier"
              ? "Selected AI tier was unavailable. Sent using the default tier."
              : "Selected tier/library failed. Sent using default settings.",
        color: "warning",
      });
    }
  } catch (error: any) {
    toast.add({
      title: "Message failed",
      description: error?.message || "Could not send your message.",
      color: "error",
    });
  } finally {
    isTyping.value = false;
  }
}

onMounted(async () => {
  isClientMounted.value = true;
  selectedAiTier.value = "";
  resetChatView();
  await loadProjectContext(props.projectId);
});

watch(
  () => props.projectId,
  async (projectId) => {
    if (!isClientMounted.value) return;
    selectedAiTier.value = "";
    resetChatView();
    await loadProjectContext(projectId);
  },
);
</script>
