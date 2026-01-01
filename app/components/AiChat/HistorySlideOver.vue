<template>
  <USlideover
    side="left"
    size="w-64"
    title="Chat history"
    description="Your previous AI chats"
    :close="{ onClick: () => emit('close', false) }"
  >
    <template #body>
      <div class="p-2">
        <UButton
          @click="emit('newChat')"
          class="mb-2 w-full"
          color="primary"
          icon="i-lucide-sparkles"
          label="New Chat"
        />
        <div class="space-y-1">
          <button
            v-for="chat in chats"
            :key="chat.id"
            @click="emit('loadChat', chat.id)"
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
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { ChatHistory } from "~/types";

defineProps<{
  chats: ChatHistory[];
  currentChatId: number | null;
}>();

const emit = defineEmits<{
  (e: "close", value: boolean): void;
  (e: "newChat"): void;
  (e: "loadChat", chatId: number): void;
}>();
</script>
