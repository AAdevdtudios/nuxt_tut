<template>
  <div class="flex flex-col gap-4 space-y-4">
    <UFormField label="Title" description="Enter the title of your project">
      <UInput placeholder="Project Title" class="w-full" />
    </UFormField>
    <slot name="actions" />
  </div>
</template>
