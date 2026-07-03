<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";
import {
  extractApiFieldErrors,
  formatFieldErrors,
} from "~/utils/validation-errors";

definePageMeta({
  layout: "auth",
});

const toast = useToast();
const auth = useAuthStore();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    autocomplete: "email",
    placeholder: "Enter your email",
    required: true,
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
});

type Schema = z.output<typeof schema>;

const pending = ref(false);
const showError = ref(false);
const errorMessage = ref("");
const resetLink = ref("");
const authFormRef = ref<{
  setFieldErrors: (errors: Array<{ name: string; message: string }>) => void;
  clearFieldErrors: () => void;
} | null>(null);

function buildResetLink(token: string) {
  const origin = process.client
    ? window.location.origin
    : "http://localhost:3000";

  return `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  pending.value = true;
  showError.value = false;
  errorMessage.value = "";
  resetLink.value = "";
  authFormRef.value?.clearFieldErrors();

  try {
    const response = await auth.forgotPassword(payload.data.email);

    if (typeof response?.resetToken === "string" && response.resetToken) {
      resetLink.value = buildResetLink(response.resetToken);
    }

    toast.add({
      title: "Check your email",
      description: "If the email exists, a reset link has been sent.",
    });
  } catch (error: any) {
    const fieldErrors = extractApiFieldErrors(error, ["email"]);

    if (fieldErrors.length) {
      authFormRef.value?.setFieldErrors(fieldErrors);
      errorMessage.value = formatFieldErrors(fieldErrors);
      showError.value = true;
    } else {
      errorMessage.value =
        error?.message || "Unable to send reset link. Please try again.";
      showError.value = true;
    }

    toast.add({
      title: "Request failed",
      description: errorMessage.value,
      color: "error",
    });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <AuthForms
      ref="authFormRef"
      :fields="fields"
      :schema="schema"
      :loading="pending"
      title="Forgot Password"
      icon="i-lucide-lock-open"
      @submit="onSubmit"
    >
      <template #description>
        Enter your email address and we’ll send you a password reset link.
      </template>
      <template #validation>
        <div v-if="showError" class="text-red-500">
          {{ errorMessage }}
        </div>
        <div
          v-else-if="resetLink"
          class="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm"
        >
          <p class="font-medium text-default">Reset link</p>
          <a
            :href="resetLink"
            class="break-all text-primary underline underline-offset-4"
          >
            {{ resetLink }}
          </a>
        </div>
      </template>
      <template #footer>
        <ULink to="/auth/login" class="text-primary font-medium">
          Back to Login
        </ULink>
      </template>
    </AuthForms>
  </div>
</template>
