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
    name: "email",
    type: "email",
    label: "Email",
    autocomplete: "email",
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
    autocomplete: "remember-me",
    label: "Remember me",
    type: "checkbox",
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const showError = ref(false);
const pending = ref(false);
const errorMessage = ref("");
const auth = useAuthStore();
const route = useRoute();
const authFormRef = ref<{
  setFieldErrors: (errors: Array<{ name: string; message: string }>) => void;
  clearFieldErrors: () => void;
} | null>(null);

const redirectTarget = computed(() => {
  const redirect = route.query.redirect;

  if (typeof redirect !== "string" || !redirect.startsWith("/")) {
    return "/dashboard";
  }

  return redirect;
});

if (auth.hasSession) {
  try {
    await auth.ensureValidAccessToken();
    await auth.fetchCurrentUser();
    await navigateTo(redirectTarget.value);
  } catch {
    auth.clearSession();
  }
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  showError.value = false;
  pending.value = true;
  authFormRef.value?.clearFieldErrors();
  try {
    await auth.login(payload.data);
    await auth.fetchCurrentUser();
    toast.add({
      title: "Success",
      description: "Logged in successfully",
    });
    await navigateTo(redirectTarget.value);
  } catch (error: any) {
    const fieldErrors = extractApiFieldErrors(error, ["email", "password"]);

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
      errorMessage.value = error?.message || "Login failed. Please try again.";
      showError.value = true;
      toast.add({
        title: "Login failed",
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
      title="Welcome back!"
      icon="i-lucide-log-in"
      @submit="onSubmit"
    >
      <template #description>
        Don't have an account?
        <ULink to="/auth/register" class="text-primary font-medium"
          >Sign up</ULink
        >.
      </template>
      <template #password-hint>
        <ULink
          to="/auth/forgot-password"
          class="text-primary font-medium"
          tabindex="-1"
          >Forgot your password?</ULink
        >
      </template>
      <template #validation>
        <div v-if="showError" class="text-red-500">
          {{ errorMessage || "Login failed. Please try again." }}
        </div>
      </template>
      <template #footer>
        <div class="text-sm text-center text-muted-foreground">
          <ULink to="/auth/recover-account" class="text-primary font-medium">
            Recover a deleted account
          </ULink>
          <span class="mx-2">·</span>
          By logging in, you agree to our
          <ULink to="/terms" class="text-primary font-medium"
            >Terms of Service</ULink
          >
          and
          <ULink to="/privacy" class="text-primary font-medium"
            >Privacy Policy</ULink
          >.
        </div>
      </template>
    </AuthForms>
  </div>
</template>
