<template>
  <div class="px-2">
    <h2 class="text-2xl font-semibold mb-4">Project Practice</h2>
    <UEmpty
      icon="i-lucide-file-question-mark"
      title="No Practice Content Yet"
      :ui="{
        header: 'max-w-lg mx-auto text-center',
      }"
      description="Generate AI-powered questions from your study materials."
      :actions="[
        {
          icon: 'i-lucide-sparkles',
          label: 'Generate Practice Questions',
        },
        {
          icon: 'i-lucide-refresh-cw',
          label: 'Refresh',
          color: 'neutral',
          variant: 'subtle',
        },
      ]"
    />
    <!-- Add more practice content as needed -->
  </div>
</template>
