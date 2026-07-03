<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";
import {
  extractApiFieldErrors,
  formatFieldErrors,
} from "~/utils/validation-errors";

definePageMeta({
  layout: "auth",
});

const toast = useToast();
const route = useRoute();
const auth = useAuthStore();

const form = reactive({
  token: typeof route.query.token === "string" ? route.query.token : "",
  newPassword: "",
  confirmPassword: "",
});

watch(
  () => route.query.token,
  (value) => {
    if (typeof value === "string" && !form.token) {
      form.token = value;
    }
  },
  { immediate: true },
);

const schema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string("Password is required")
      .min(8, "Must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Schema = z.output<typeof schema>;

const pending = ref(false);
const showError = ref(false);
const errorMessage = ref("");
const hasToken = computed(() => Boolean(form.token));
const formRef = ref<{
  setErrors: (errors: Array<{ name: string; message: string }>) => void;
  clear: () => void;
} | null>(null);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (!form.token) {
    errorMessage.value = "Reset link is invalid or missing its token.";
    showError.value = true;
    return;
  }

  pending.value = true;
  showError.value = false;
  errorMessage.value = "";
  formRef.value?.clear?.();

  try {
    await auth.resetPassword({
      token: payload.data.token,
      newPassword: payload.data.newPassword,
    });

    toast.add({
      title: "Password updated",
      description: "You can now log in with your new password.",
    });

    await navigateTo("/auth/login");
  } catch (error: any) {
    const fieldErrors = extractApiFieldErrors(error, [
      "token",
      "newPassword",
      "confirmPassword",
    ]);

    if (fieldErrors.length) {
      formRef.value?.setErrors(fieldErrors);
      errorMessage.value = formatFieldErrors(fieldErrors);
      showError.value = true;
    } else {
      errorMessage.value =
        error?.message || "Unable to reset password. Please try again.";
      showError.value = true;
    }

    toast.add({
      title: "Reset failed",
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
    <UPageCard class="w-full max-w-md">
      <UForm
        ref="formRef"
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="space-y-1">
          <h1 class="text-xl font-semibold">Reset Password</h1>
          <p class="text-sm text-muted">
            Choose a new password for your account.
          </p>
        </div>

        <div
          v-if="!hasToken"
          class="rounded-md border border-error/20 bg-error/5 p-3 text-sm text-red-500"
        >
          Reset link is invalid or missing its token.
        </div>

        <UFormField label="New Password" name="newPassword" required>
          <UInput
            v-model="form.newPassword"
            type="password"
            placeholder="Enter new password"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Confirm Password" name="confirmPassword" required>
          <UInput
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirm new password"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>

        <div v-if="showError" class="text-sm text-red-500">
          {{ errorMessage }}
        </div>

        <div class="flex items-center justify-between gap-3">
          <ULink to="/auth/login" class="text-sm text-primary font-medium">
            Back to Login
          </ULink>
          <UButton
            type="submit"
            :loading="pending"
            :disabled="!hasToken"
            class="ml-auto"
            label="Reset Password"
          />
        </div>
      </UForm>
    </UPageCard>
  </div>
</template>
