<template>
  <USlideover title="Notifications">
    <UButton icon="i-lucide-bell" color="neutral" variant="ghost" />

    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-lg">New Message</h3>
            <p class="text-sm text-muted-foreground">You have a new message.</p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-lg">System Update</h3>
            <p class="text-sm text-muted-foreground">
              System will be updated tonight.
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>
