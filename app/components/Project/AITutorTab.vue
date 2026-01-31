<!-- Build a chat view here that supports asking questions and history of chat using UChatPrompt -->
<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui";
const messages = ref([
  {
    id: "6045235a-a435-46b8-989d-2df38ca2eb47",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Hello, how are you?",
      },
    ],
  },
  {
    id: "7a92b3c1-d5f8-4e76-b8a9-3c1e5fb2e0d8",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I am doing well, thank you for asking! How can I assist you today?",
      },
    ],
  },
  {
    id: "9c84d6a7-8b23-4f12-a1d5-e7f3b9c05e2a",
    role: "user",
    parts: [
      {
        type: "text",
        text: "What is the current weather in Tokyo?",
      },
    ],
  },
  {
    id: "b2e5f8c3-a1d9-4e67-b3f2-c9d8e7a6b5f4",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Based on the latest data, Tokyo is currently experiencing sunny weather with temperatures around 24°C (75°F). It's a beautiful day with clear skies.",
      },
    ],
  },
  {
    id: "d4f6e7a8-b9c0-4d1e-8f3a-2b5c6d7e8f9a",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Can you help me with my project on renewable energy?",
      },
    ],
  },
  {
    id: "e5f7a8b9-c0d1-4e2f-9a3b-4c5d6e7f8g9h",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Absolutely! Renewable energy is a fascinating topic. What specific aspects are you interested in?",
      },
    ],
  },
  {
    id: "f6a7b8c9-d0e1-4f2g-9b3c-5d6e7f8g9h0i",
    role: "user",
    parts: [
      {
        type: "text",
        text: "I would like to know more about solar energy and its benefits.",
      },
    ],
  },
  {
    id: "g7b8c9d0-e1f2-4g3h-9c4d-6e7f8g9h0i1j",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Solar energy is a clean and renewable source of power that harnesses energy from the sun. Some benefits include reducing greenhouse gas emissions, lowering electricity bills, and providing energy independence. Would you like information on solar panel installation or advancements in solar technology?",
      },
    ],
  },
  {
    id: "h8c9d0e1-f2g3-4h5i-9d5e-7f8g9h0i1j2k",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Yes, please provide details on solar panel installation.",
      },
    ],
  },
  {
    id: "i9d0e1f2-g3h4-5i6j-9e6f-8g9h0i1j2k3l",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Installing solar panels involves several steps including assessing your energy needs, evaluating your roof's suitability, obtaining necessary permits, and hiring a professional installer. It's important to consider factors like panel orientation, shading, and local regulations. Would you like recommendations for installers in your area?",
      },
    ],
  },
  {
    id: "j0e1f2g3-h4i5-6j7k-9f7g-9h0i1j2k3l4m",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Yes, that would be helpful. Thank you!",
      },
    ],
  },
  {
    id: "k1f2g3h4-i5j6-7k8l-9g8h-0i1j2k3l4m5n",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "You're welcome! Here are some recommended solar panel installers in your area: Solar Solutions Inc., Green Energy Co., and SunPower Experts. Be sure to get multiple quotes and check reviews before making a decision. If you have any more questions, feel free to ask!",
      },
    ],
  },
  {
    id: "l2g3h4i5-j6k7-8l9m-9h9i-1j2k3l4m5n6o",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Will do! Thanks for all your help.",
      },
    ],
  },
  {
    id: "m3h4i5j6-k7l8-9m0n-9i0j-2k3l4m5n6o7p",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Anytime! Good luck with your renewable energy project. Have a great day!",
      },
    ],
  },
]);

const userMessage = ref("");
const selectedModel = ref("gpt-4");
const toast = useToast();
const models = ["gpt-4", "gpt-3.5-turbo", "claude-3", "mistral"];

const handleSendMessage = (prompt: string) => {
  messages.value.push({
    id: Date.now().toString(),
    role: "user",
    parts: [
      {
        type: "text",
        text: prompt,
      },
    ],
  });
  userMessage.value = "";

  // Simulate AI response
  setTimeout(() => {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: "assistant",
      parts: [
        {
          type: "text",
          text: `Response from ${selectedModel.value}: This is a sample answer about your question.`,
        },
      ],
    });
  }, 1000);
};
const expandedMessageId = ref<string | null>(null);

const copyMessage = (message: any) => {
  navigator.clipboard.writeText(
    message?.parts?.map((part: any) => part.text).join("\n") ?? ""
  );
  toast.add({
    title: "Copied",
    description: "Message copied to clipboard",
    duration: 2000,
  });
};

const actionsBtn = [
  {
    label: "Copy to clipboard",
    icon: "i-lucide-copy",
    onClick: (e: MouseEvent, message: any) => {
      copyMessage(message);
    },
  },
];

const handleModelChange = (model: string) => {
  selectedModel.value = model;
};
</script>
<template>
  <div class="px-2">
    <UCard variant="outline">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <h2 class="text-2xl font-semibold">Project AI Tutor</h2>
            <span class="text-sm font-medium text-muted"
              >Ask questions about Final Exams Prep</span
            >
          </div>
          <div class="flex gap-2 items-center">
            <USelect
              :items="models.map((model) => ({ label: model, value: model }))"
              v-model="selectedModel"
              @update:model-value="handleModelChange"
              class="w-48"
            />
            <UButton icon="i-lucide-history" variant="outline" />
          </div>
        </div>
      </template>
      <UScrollArea
        class="h-[calc(100vh-500px)] w-full"
        :ui="{ viewport: 'gap-4 p-4' }"
      >
        <div class="space-y-4">
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex gap-2"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-xs md:max-w-md lg:max-w-lg rounded-lg"
              :class="
                message.role === 'user'
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              "
            >
              <div
                class="flex flex-col gap-2"
                :class="message.role === 'user' ? 'items-end' : 'items-start'"
              >
                <p
                  class="text-sm flex-1 bg-muted p-3 rounded-lg whitespace-pre-wrap"
                >
                  {{ message.parts?.[0]?.text ?? "" }}
                </p>
                <!-- Mobile action button (always visible) -->
                <UButton
                  icon="i-lucide-copy"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="copyMessage(message)"
                />
              </div>
            </div>
          </div>
        </div>
      </UScrollArea>

      <template #footer>
        <UTextarea
          size="lg"
          autoresize
          variant="soft"
          placeholder="Ask about Final Exams Prep..."
          :rows="2"
          :maxrows="10"
          class="w-full"
          v-model="userMessage"
        >
          <template #trailing>
            <UButton
              icon="i-lucide-send"
              color="primary"
              class="ml-2"
              @click="handleSendMessage(userMessage)"
            />
          </template>
        </UTextarea>
      </template>
    </UCard>
  </div>
</template>
