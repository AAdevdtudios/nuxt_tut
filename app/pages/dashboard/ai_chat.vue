<template>
  <DashboardBodyLayout title="">
    <div class="flex h-[calc(100vh-8rem)] gap-4">
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
            <button
              v-for="chat in chatHistories"
              :key="chat.id"
              @click="loadChat(chat.id)"
              :class="[
                'w-full rounded-lg p-3 text-left transition-colors text-sm',
                currentChatId === chat.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-accent',
              ]"
            >
              <p class="font-medium line-clamp-1">{{ chat.title }}</p>
              <p class="mt-1 text-xs text-muted-foreground line-clamp-1">
                {{ chat.lastMessage }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ new Date(chat.timestamp).toLocaleDateString() }}
              </p>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Header -->
        <div class="mb-4 flex items-center justify-between">
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
              <h2 class="text-3xl font-bold text-foreground">AI Chat</h2>
              <p class="mt-1 text-muted-foreground">
                Get instant help with your studies
              </p>
            </div>
          </div>
          <UButton
            @click="showLibrary = !showLibrary"
            variant="outline"
            icon="i-lucide-file-text"
            :label="`Library (${selectedContent.length})`"
          />
        </div>

        <!-- Selected Content Chips -->
        <div
          v-if="selectedContent.length > 0"
          class="mb-4 flex flex-wrap gap-2"
        >
          <div
            v-for="item in selectedContent"
            :key="item.id"
            class="flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-primary"
          >
            <UIcon name="i-lucide-file-text" class="h-3 w-3" />
            <span>{{ item.title }}</span>
            <button
              @click="toggleContentSelection(item)"
              class="hover:text-primary/70"
              aria-label="Remove"
            >
              <UIcon name="i-lucide-x" class="h-3 w-3" />
            </button>
          </div>
        </div>

        <!-- Chat Container -->
        <div class="flex flex-1 gap-4 overflow-hidden">
          <!-- Messages Area -->
          <div
            class="flex flex-1 flex-col overflow-hidden rounded-lg border border-default bg-card"
          >
            <!-- Messages -->
            <div class="flex-1 space-y-4 overflow-y-auto p-6">
              <div
                v-for="message in messages"
                :key="message.id"
                class="flex"
                :class="
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                "
              >
                <div
                  :class="[
                    'flex max-w-[80%] gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  ]"
                >
                  <!-- Avatar -->
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
                  <!-- Message Bubble -->
                  <div
                    :class="[
                      'rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    ]"
                  >
                    <p class="text-sm leading-relaxed">{{ message.content }}</p>
                    <p
                      :class="[
                        'mt-2 text-xs',
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground/70',
                      ]"
                    >
                      {{ formatTime(message.timestamp) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Typing Indicator -->
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

            <!-- Input Area -->
            <div class="border-t border-default p-4">
              <div class="flex items-end gap-2">
                <div
                  class="flex-1 rounded-lg border border-border bg-background"
                >
                  <textarea
                    v-model="inputValue"
                    @keydown.enter.prevent="handleSend"
                    placeholder="Ask me anything about your studies..."
                    rows="3"
                    class="w-full resize-none bg-transparent p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <UButton
                  @click="handleSend"
                  icon="i-lucide-send"
                  :disabled="!inputValue.trim()"
                  color="primary"
                  size="lg"
                  aria-label="Send message"
                />
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>

          <!-- Library Sidebar -->
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
                :key="item.id"
                @click="toggleContentSelection(item)"
                :class="[
                  'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors text-sm',
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
                <div class="flex-1 min-w-0">
                  <p class="font-medium line-clamp-1">{{ item.title }}</p>
                  <p class="text-xs text-muted-foreground">{{ item.type }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import type { ChatHistory } from "~/types";
import { LazyAiChatHistorySlideOver } from "#components";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const chatHistories = ref<ChatHistory[]>([
  {
    id: 1,
    title: "Calculus Help",
    lastMessage: "Can you explain derivatives?",
    timestamp: new Date(Date.now() - 3600000),
    messages: [
      {
        id: 1,
        role: "user",
        content: "Can you explain derivatives?",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: 2,
        role: "assistant",
        content: "Derivatives measure the rate of change of a function...",
        timestamp: new Date(Date.now() - 3590000),
      },
    ],
  },
  {
    id: 2,
    title: "Biology Questions",
    lastMessage: "What is photosynthesis?",
    timestamp: new Date(Date.now() - 7200000),
    messages: [],
  },
]);

const currentChatId = ref<number | null>(null);
const messages = ref<Message[]>([
  {
    id: 1,
    role: "assistant",
    content:
      "Hello! I'm your AI study assistant. I can help you understand concepts, generate questions, summarize documents, and more. You can also select content from your library to chat about. What would you like to work on today?",
    timestamp: new Date(),
  },
]);

const inputValue = ref("");
const isTyping = ref(false);
const showLibrary = ref(false);
const selectedContent = ref<any[]>([]);
const showHistory = ref(false);
const showMobileHistory = ref(false);
const isMobile = ref(false);
let media: MediaQueryList;

onMounted(() => {
  media = window.matchMedia("(max-width: 767px)");
  isMobile.value = media.matches;

  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches;
  };

  media.addEventListener("change", handler);

  onUnmounted(() => {
    media.removeEventListener("change", handler);
  });
});

const overlay = useOverlay();
const mobileChatSlideOver = overlay.create(LazyAiChatHistorySlideOver);
async function showChatHistory() {
  console.log(isMobile.value);

  if (isMobile.value) {
    showMobileHistory.value = true;
    const instance = await mobileChatSlideOver.open({
      chats: chatHistories.value,
      currentChatId: currentChatId.value,
      onLoadChat: (chatId: number) => {
        loadChat(chatId);
        mobileChatSlideOver.close();
      },
      onNewChat: () => {
        startNewChat();
        mobileChatSlideOver.close();
      },
    });
    console.log(instance);
  } else {
    showHistory.value = true;
  }
}

const libraryItems = [
  { id: 1, title: "Advanced Calculus Notes", type: "PDF" },
  { id: 2, title: "Biology Chapter 5", type: "Document" },
  { id: 3, title: "Chemistry Lab Report", type: "Note" },
  { id: 4, title: "Physics Formula Sheet", type: "PDF" },
];

const formatTime = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const isSelected = (item: any) => {
  return selectedContent.value.some((c) => c.id === item.id);
};

const handleSend = () => {
  if (!inputValue.value.trim()) return;

  const userMessage: Message = {
    id: messages.value.length + 1,
    role: "user",
    content: inputValue.value,
    timestamp: new Date(),
  };

  messages.value.push(userMessage);
  inputValue.value = "";
  isTyping.value = true;

  setTimeout(() => {
    let responseContent = `I understand you're asking about "${userMessage.content}".`;

    if (selectedContent.value.length > 0) {
      const titles = selectedContent.value.map((c) => c.title).join(", ");
      responseContent += ` Based on the materials you've selected (${titles}), `;
    }

    responseContent +=
      " Let me help you with that. This is a simulated response demonstrating the AI chat functionality with context from your library materials.";

    const aiMessage: Message = {
      id: messages.value.length + 1,
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
    };
    messages.value.push(aiMessage);
    isTyping.value = false;
  }, 2000);
};

const toggleContentSelection = (item: any) => {
  if (isSelected(item)) {
    selectedContent.value = selectedContent.value.filter(
      (c) => c.id !== item.id
    );
  } else {
    selectedContent.value.push(item);
  }
};

const loadChat = (chatId: number) => {
  const chat = chatHistories.value.find((c) => c.id === chatId);
  if (chat) {
    currentChatId.value = chatId;
    messages.value =
      chat.messages.length > 0
        ? [...chat.messages]
        : [
            {
              id: 1,
              role: "assistant",
              content: "Chat loaded. How can I help you?",
              timestamp: new Date(),
            },
          ];
  }
};

const startNewChat = () => {
  currentChatId.value = null;
  messages.value = [
    {
      id: 1,
      role: "assistant",
      content: "New chat started. How can I help you today?",
      timestamp: new Date(),
    },
  ];
  selectedContent.value = [];
};

definePageMeta({
  layout: "dashboard",
});
</script>
