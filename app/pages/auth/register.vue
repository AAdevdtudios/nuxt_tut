<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";

// setup layout
definePageMeta({
  layout: "auth",
});
const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "username",
    type: "text",
    autocomplete: "username",
    label: "User Name",
    placeholder: "Enter your unique user name",
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

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
    onClick: () => {
      toast.add({ title: "Google", description: "Create account with Google" });
    },
  },
  {
    label: "GitHub",
    icon: "i-simple-icons-github",
    onClick: () => {
      toast.add({ title: "GitHub", description: "Create account with GitHub" });
    },
  },
];

const schema = z.object({
  username: z
    .string("User name is required")
    .min(5, "Must be at least 5 characters"),
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const nuxtApp = useNuxtApp();
console.log(nuxtApp.$foo);

const auth = useAuthStore();

const showError = ref(false);
const pending = ref(false);
const errorMessage = ref("");

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  showError.value = false;
  pending.value = true;
  try {
    await auth.register(payload.data);
    toast.add({
      title: "Success",
      description: "Logged in successfully",
    });
    await navigateTo("/");
  } catch (error: any) {
    errorMessage.value =
      error?.message || "Registration failed. Please try again.";
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
  </div>
</template>
