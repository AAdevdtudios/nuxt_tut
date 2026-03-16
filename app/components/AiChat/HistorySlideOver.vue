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
          <div
            v-for="chat in chats"
            :key="chat.id"
            :class="[
              'w-full rounded-lg p-3 text-left transition-colors text-sm',
              currentChatId === chat.id
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent',
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <button
                class="min-w-0 flex-1 text-left"
                @click="emit('loadChat', chat.id)"
              >
                <p class="font-medium line-clamp-1">{{ chat.title }}</p>
              </button>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                @click.stop="emit('deleteChat', chat.id)"
                aria-label="Delete chat"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { ChatHistory } from "~/types";

defineProps<{
  chats: ChatHistory[];
  currentChatId: string | number | null;
}>();

const emit = defineEmits<{
  (e: "close", value: boolean): void;
  (e: "newChat"): void;
  (e: "loadChat", chatId: string | number): void;
  (e: "deleteChat", chatId: string | number): void;
}>();
</script>
