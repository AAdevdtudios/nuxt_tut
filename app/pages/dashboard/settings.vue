<template>
  <DashboardBodyLayout
    title="Settings"
    description="Manage your account and preferences"
  >
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <!-- Profile Settings -->
      <UCard
        :ui="{
          header: 'border-b border-default',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <UIcon name="i-lucide-user" class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-card-foreground">
              Profile Information
            </h3>
          </div>
        </template>
        <div class="space-y-4">
          <UFormField label="Full name">
            <UInput v-model="settings.name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-2">
            <UFormField label="Email Address">
              <UInput v-model="settings.email" disabled class="w-full" />
            </UFormField>
            <UFormField label="Username">
              <UInput v-model="settings.username" disabled class="w-full" />
            </UFormField>
          </div>
        </div>
        <template #footer>
          <div class="w-full flex flex-row-reverse gap-2">
            <UButton variant="solid" @click="handleSave" :disabled="saved">
              {{ saved ? "Saved!" : "Save Changes" }}
            </UButton>
            <!-- Delete Account Button -->
            <UModal
              :ui="{
                body: 'p-6',
                header: 'border-b border-default p-6',
                footer: 'border-t border-default p-6',
              }"
            >
              <UButton variant="ghost" color="error" label="Delete Account" />
              <template #header>
                <h3 class="text-lg font-semibold text-card-foreground">
                  Confirm Account Deletion
                </h3>
              </template>
              <template #body>
                <ul
                  class="list-disc pl-5 space-y-2 text-sm text-muted-foreground"
                >
                  <li>Account removal is final and cannot be reversed.</li>
                  <li>
                    Access to all platform features and services will be lost
                    after deletion.
                  </li>
                  <li>
                    Re-registration with your current email address will not be
                    possible.
                  </li>
                  <li>
                    Most of your data will be erased within 30 days, though some
                    information may be retained as required by law.
                  </li>
                  <li>
                    For more details, please review our support documentation.
                  </li>
                  <li>
                    You must have logged in within the past 10 minutes to
                    proceed. If not, please log in again and return to this
                    page.
                  </li>
                </ul>
              </template>
              <template #footer>
                <UButton variant="solid" color="error">Delete</UButton>
                <UButton variant="ghost" @click="$emit('close')"
                  >Cancel</UButton
                >
              </template>
            </UModal>
          </div>
        </template>
      </UCard>
      <!-- Notification Settings -->

      <UCard
        :ui="{
          header: 'border-b border-default',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <UIcon name="i-lucide-bell" class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-card-foreground">
              Notifications
            </h3>
          </div>
        </template>
        <div class="space-y-4 p-6">
          <UFormField
            label="Email Notifications"
            description="Receive updates via email"
            orientation="horizontal"
          >
            <USwitch v-model="settings.notifications.email" />
          </UFormField>
          <UFormField
            label="Push Notifications"
            description="Receive updates via push notifications"
            orientation="horizontal"
          >
            <USwitch v-model="settings.notifications.push" />
          </UFormField>
          <UFormField
            label="Weekly Notifications"
            description="Receive a weekly progress report"
            orientation="horizontal"
          >
            <USwitch v-model="settings.notifications.weekly" />
          </UFormField>
        </div>
      </UCard>
      <UCard
        :ui="{
          header: 'border-b border-default',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <UIcon name="i-lucide-credit-card" class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-card-foreground">
              Billing Information
            </h3>
          </div>
        </template>
        <div class="p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <UPageCard
            icon="i-lucide-gift"
            class="border border-primary bg-primary/10 text-primary-foreground"
            title="Free plan"
            description="Billed monthly at $29.99"
            to="/"
          />
          <UPageCard
            icon="i-lucide-star"
            class="border border-default text-primary-foreground"
            title="Premium plan"
            description="Billed monthly at $29.99"
            to="/"
          />
          <UPageCard
            icon="i-lucide-award"
            class="border border-default text-primary-foreground"
            title="Basic plan"
            description="Billed monthly at $29.99"
            to="/"
          />
        </div>
        <template #footer>
          <div
            class="w-full flex flex-col-reverse items-center xl:flex-row-reverse gap-2"
          >
            <UButton variant="solid" label="Manage Payment Methods" />
            <UButton variant="ghost" label="View Payment History" />
          </div>
        </template>
      </UCard>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";

definePageMeta({
  layout: "dashboard",
});

const saved = ref(false);
const settings = ref({
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  username: "alexjohnson",
  notifications: {
    email: true,
    push: true,
    weekly: false,
  },
  appearance: {
    theme: "system",
    language: "en",
  },
});
function handleSave() {
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}
</script>
