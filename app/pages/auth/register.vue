<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";
import {
  extractApiFieldErrors,
  formatFieldErrors,
} from "~/utils/validation-errors";

// setup layout
definePageMeta({
  layout: "auth",
});
const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "name",
    type: "text",
    autocomplete: "name",
    label: "Full Name",
    placeholder: "Enter your full name",
    required: true,
  },
  {
    name: "displayName",
    type: "text",
    autocomplete: "username",
    label: "Username",
    placeholder: "Choose a username",
    required: true,
  },
  {
    name: "email",
    type: "email",
    autocomplete: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autocomplete: "password",
    placeholder: "Enter your password",
    required: true,
  },
  {
    name: "remember",
    label: "Remember me",
    type: "checkbox",
  },
];

const schema = z.object({
  name: z.string("Full name is required").min(3, "Must be at least 3 characters"),
  displayName: z
    .string("Username is required")
    .min(2, "Must be at least 2 characters")
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, underscores, or hyphens"),
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const auth = useAuthStore();
const authFormRef = ref<{
  setFieldErrors: (errors: Array<{ name: string; message: string }>) => void;
  clearFieldErrors: () => void;
} | null>(null);

const showError = ref(false);
const pending = ref(false);
const errorMessage = ref("");

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  showError.value = false;
  pending.value = true;
  authFormRef.value?.clearFieldErrors();
  try {
    await auth.register(payload.data);
    await auth.fetchCurrentUser();
    toast.add({
      title: "Success",
      description: "Account created successfully",
    });
    await navigateTo("/");
  } catch (error: any) {
    const fieldErrors = extractApiFieldErrors(error, [
      "displayName",
      "name",
      "email",
      "password",
    ]);

    if (fieldErrors.length) {
      authFormRef.value?.setFieldErrors(fieldErrors);
      const summary = formatFieldErrors(fieldErrors);
      errorMessage.value = summary;
      showError.value = true;
      toast.add({
        title: "Validation failed",
        description: summary,
        color: "error",
      });
    } else {
      errorMessage.value =
        error?.message || "Registration failed. Please try again.";
      showError.value = true;
      toast.add({
        title: "Registration failed",
        description: errorMessage.value,
        color: "error",
      });
    }
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
      title="Create an account"
      icon="i-lucide-user-plus"
      @submit="onSubmit"
    >
      <template #description>
        Already have an account?
        <ULink to="/auth/login" class="text-primary font-medium">Log in</ULink>.
      </template>
      <template #validation>
        <div v-if="showError" class="text-red-500">
          {{ errorMessage || "Registration failed. Please try again." }}
        </div>
      </template>
      <template #footer>
        By creating an account, you agree to our
        <ULink to="/terms" class="text-primary font-medium"
          >Terms of Service</ULink
        >
        and
        <ULink to="/privacy" class="text-primary font-medium"
          >Privacy Policy</ULink
        >.
      </template>
    </AuthForms>
    <AuthGoogleButton />
  </div>
</template>
