<script setup lang="ts">
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

defineProps<{
  submitted: boolean;
  form: {
    subject: string;
    message: string;
    priority: string;
    module: string;
  };
  modules: Array<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  "update:form": [
    value: {
      subject: string;
      message: string;
      priority: string;
      module: string;
    },
  ];
  submit: [];
}>();
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <UCard class="border-default text-center">
        <div class="flex flex-col items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
          >
            <UIcon
              name="i-lucide-message-circle"
              class="h-6 w-6 text-primary"
            />
          </div>
          <h4 class="text-sm font-semibold">Live Chat</h4>
          <p class="text-xs text-muted-foreground">
            Chat with our team during business hours.
          </p>
          <span
            class="flex items-center gap-1.5 text-xs font-medium text-green-600"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
            Online now
          </span>
        </div>
      </UCard>

      <UCard class="border-default text-center">
        <div class="flex flex-col items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
          >
            <UIcon name="i-lucide-mail" class="h-6 w-6 text-primary" />
          </div>
          <h4 class="text-sm font-semibold">Email</h4>
          <p class="text-xs text-muted-foreground">
            Send a message and expect a response within 24 hours.
          </p>
          <span class="text-xs font-medium text-primary"
            >support@trygap.com</span
          >
        </div>
      </UCard>

      <UCard class="border-default text-center">
        <div class="flex flex-col items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
          >
            <UIcon name="i-lucide-book-open" class="h-6 w-6 text-primary" />
          </div>
          <h4 class="text-sm font-semibold">Docs</h4>
          <p class="text-xs text-muted-foreground">
            Browse guides and reference material for the platform.
          </p>
          <UButton color="primary" variant="ghost">Visit Docs</UButton>
        </div>
      </UCard>
    </div>

    <UCard class="border-default">
      <template #header>
        <div v-if="submitted" class="flex flex-col items-center gap-3 py-6">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-green-100"
          >
            <UIcon name="i-lucide-check" class="h-7 w-7 text-green-600" />
          </div>
          <div class="text-center">
            <h3 class="text-lg font-semibold">Message sent</h3>
            <p class="text-sm text-muted-foreground">
              Our support team will respond within 24 hours.
            </p>
          </div>
        </div>
        <div v-else>
          <h3 class="text-lg font-semibold">Send a Message</h3>
          <p class="text-sm text-muted-foreground">
            Describe your issue or question in detail.
          </p>
        </div>
      </template>

      <div v-if="!submitted" class="space-y-5">
        <div class="grid grid-cols-3 w-full">
          <div class="space-y-2">
            <UFormField label="Priority">
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="priority in PRIORITY_OPTIONS"
                  :key="priority.value"
                  size="lg"
                  :variant="
                    form.priority === priority.value ? 'soft' : 'outline'
                  "
                  :color="
                    form.priority === priority.value &&
                    priority.value === 'urgent'
                      ? 'error'
                      : form.priority === priority.value
                        ? 'primary'
                        : 'neutral'
                  "
                  @click="
                    emit('update:form', {
                      ...form,
                      priority: priority.value,
                    })
                  "
                >
                  {{ priority.label }}
                </UButton>
              </div>
            </UFormField>
          </div>

          <UFormField label="Module">
            <USelect
              :model-value="form.module"
              :items="modules"
              value-key="value"
              option-attribute="label"
              placeholder="Select module"
              size="lg"
              class="w-full"
              @update:model-value="
                emit('update:form', {
                  ...form,
                  module: $event,
                })
              "
            />
          </UFormField>

          <UFormField label="Subject" class="col-span-2">
            <UInput
              :model-value="form.subject"
              placeholder="What do you need help with?"
              size="lg"
              class="w-full"
              @update:model-value="
                emit('update:form', {
                  ...form,
                  subject: $event,
                })
              "
            />
          </UFormField>
        </div>

        <UFormField label="Message">
          <UTextarea
            :model-value="form.message"
            :rows="5"
            placeholder="Describe your issue or question in detail..."
            size="lg"
            class="w-full"
            @update:model-value="
              emit('update:form', {
                ...form,
                message: $event,
              })
            "
          />
        </UFormField>
      </div>

      <template v-if="!submitted" #footer>
        <div class="flex justify-end">
          <UButton
            icon="i-lucide-send"
            size="lg"
            color="primary"
            :disabled="!form.subject.trim() || !form.message.trim()"
            @click="emit('submit')"
          >
            Send Message
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
