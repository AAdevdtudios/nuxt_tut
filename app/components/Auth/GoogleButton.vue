<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "~/stores/auth";

const props = defineProps<{
  redirect?: string;
}>();

const config = useRuntimeConfig();
const clientId = (config.public.GOOGLE_CLIENT_ID as string) || "";

const auth = useAuthStore();
const toast = useToast();
const buttonHost = ref<HTMLDivElement | null>(null);
const isProcessing = ref(false);
const deletedAccount = ref(false);

async function handleCredential(response: { credential?: string }) {
  if (!response?.credential || isProcessing.value) return;
  isProcessing.value = true;
  deletedAccount.value = false;
  try {
    const session = await $fetch<any>("/api/auth/google", {
      method: "POST",
      body: { idToken: response.credential },
    });
    auth.setSession(session);
    await auth.fetchCurrentUser();
    await navigateTo(props.redirect || "/dashboard");
  } catch (error: any) {
    const message =
      error?.data?.error ||
      error?.data?.statusMessage ||
      error?.message ||
      "Google sign-in failed.";
    deletedAccount.value = /account is deleted/i.test(String(message));
    toast.add({ title: "Google sign-in failed", description: String(message), color: "error" });
  } finally {
    isProcessing.value = false;
  }
}

onMounted(() => {
  if (!clientId || !buttonHost.value) return;

  const render = () => {
    const google = (window as any).google;
    if (!google?.accounts?.id || !buttonHost.value) return;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });
    google.accounts.id.renderButton(buttonHost.value, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      shape: "pill",
    });
  };

  if ((window as any).google?.accounts?.id) {
    render();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = render;
  document.head.appendChild(script);
});
</script>

<template>
  <div v-if="clientId" class="flex w-full flex-col items-center gap-3">
    <div class="flex w-full max-w-sm items-center gap-3">
      <div class="h-px flex-1 bg-[var(--ga-border,#e5e7eb)]" />
      <span class="text-xs text-muted-foreground">or</span>
      <div class="h-px flex-1 bg-[var(--ga-border,#e5e7eb)]" />
    </div>
    <div ref="buttonHost" class="flex justify-center" />
    <UButton
      v-if="deletedAccount"
      to="/auth/recover-account"
      icon="i-lucide-rotate-ccw"
      color="primary"
      variant="soft"
      class="rounded-xl"
    >
      Recover your account
    </UButton>
  </div>
</template>
