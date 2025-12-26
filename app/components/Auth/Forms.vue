<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";

const props = defineProps<{
  fields: AuthFormField[];
  providers?: any[];
  schema: any;
  title?: string;
  icon?: string;
  buttonText?: string;
  loading?: boolean;
}>();

const emit = defineEmits([
  "submit",
  "update:modelValue",
  "error",
  "success",
  // Add more events as needed
]);

function onSubmit(payload: FormSubmitEvent<any>) {
  emit("submit", payload);
}
</script>

<template>
  <UPageCard class="w-full max-w-md">
    <UAuthForm
      :schema="props.schema"
      :fields="props.fields"
      :providers="props.providers"
      :title="props.title"
      :icon="props.icon"
      :loading="props.loading"
      @submit="onSubmit"
      @update:modelValue="() => emit('update:modelValue')"
      @error="() => emit('error')"
      @success="() => emit('success')"
    >
      <template #description>
        <slot name="description" />
      </template>
      <template #password-hint>
        <slot name="password-hint" />
      </template>
      <template #validation>
        <slot name="validation" />
      </template>
      <template #footer>
        <slot name="footer" />
      </template>
    </UAuthForm>
  </UPageCard>
</template>
