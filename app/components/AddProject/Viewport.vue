<template>
  <div class="flex flex-col gap-4 space-y-4">
    <UFormField
      label="Email"
      description="We'll never share your email with anyone else."
    >
      <UInput placeholder="Enter your email" class="w-full" />
    </UFormField>
    <slot name="actions" />
  </div>
</template>
