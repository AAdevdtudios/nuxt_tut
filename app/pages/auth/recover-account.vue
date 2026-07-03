<script setup lang="ts">
import * as z from "zod";
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";

definePageMeta({ layout: "auth" });

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
    type: "password",
    label: "Password",
    autocomplete: "current-password",
    placeholder: "Enter your password",
    required: true,
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const auth = useAuthStore();
const toast = useToast();
const pending = ref(false);
const errorMessage = ref("");

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  pending.value = true;
  errorMessage.value = "";

  try {
    await auth.recoverAccount(payload.data);
    await auth.fetchCurrentUser();
    toast.add({
      title: "Account recovered",
      description: "Your account has been restored successfully.",
      color: "success",
    });
    await navigateTo("/dashboard");
  } catch (error: any) {
    errorMessage.value = error?.message || "Could not recover your account.";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <AuthForms
      :fields="fields"
      :schema="schema"
      :loading="pending"
      title="Recover Account"
      icon="i-lucide-rotate-ccw-key"
      @submit="onSubmit"
    >
      <template #description>
        Restore a previously deleted GapAI account.
      </template>
      <template #validation>
        <div v-if="errorMessage" class="text-red-500">
          {{ errorMessage }}
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
