<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
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
    placeholder: "Enter your email",
    required: true,
  },
];
const schema = z.object({
  email: z.email("Invalid email"),
});
type Schema = z.output<typeof schema>;
function onSubmit(payload: FormSubmitEvent<Schema>) {
  console.log("Submitted", payload);
  toast.add({
    title: "Success",
    description: "Password reset link has been sent to your email.",
  });
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <AuthForms
      :fields="fields"
      :schema="schema"
      title="Forgot Password"
      icon="i-lucide-lock-open"
      @submit="onSubmit"
    >
      <template #description>
        Enter your email address below and we'll send you a link to reset your
        password.
      </template>
      <template #footer>
        <ULink to="/auth/login" class="text-primary font-medium"
          >Back to Login</ULink
        >.
      </template>
    </AuthForms>
  </div>
</template>
