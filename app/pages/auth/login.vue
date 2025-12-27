<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import type { AuthResponse, User } from "~/types";
import { useAuthStore } from "~/stores/auth";

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

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
    onClick: () => {
      toast.add({ title: "Google", description: "Login with Google" });
    },
  },
  {
    label: "GitHub",
    icon: "i-simple-icons-github",
    onClick: () => {
      toast.add({ title: "GitHub", description: "Login with GitHub" });
    },
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

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  showError.value = false;
  pending.value = true;
  try {
    await auth.login(payload.data);
    toast.add({
      title: "Success",
      description: "Logged in successfully",
    });
    await navigateTo("/");
  } catch (error: any) {
    errorMessage.value = error?.message || "Login failed. Please try again.";
    showError.value = true;
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <AuthForms
      :fields="fields"
      :providers="providers"
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
