<template>
  <div class="max-w-2xl space-y-6">
    <!-- Project Settings Card -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Project Settings</h3>
      </template>

      <div class="space-y-6">
        <!-- Project Name -->
        <div>
          <UFormField label="Project Name">
            <UInput
              v-model="settingsForm.name"
              placeholder="Enter project name"
              variant="soft"
              size="xl"
              class="w-full mt-2"
            />
          </UFormField>
        </div>

        <!-- Description -->
        <div>
          <UFormField label="Description">
            <UTextarea
              v-model="settingsForm.description"
              placeholder="Enter project description"
              :rows="3"
              variant="soft"
              size="xl"
              class="w-full mt-2"
            />
          </UFormField>
        </div>

        <!-- Icon Selector -->
        <div>
          <UFormField label="Icon">
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="option in iconOptions"
                :key="option.id"
                @click="settingsForm.icon = option.id"
                :active="settingsForm.icon === option.id"
                :icon="option.icon"
                :active-class="
                  settingsForm.icon === option.id ? 'border-primary' : ''
                "
                :variant="settingsForm.icon === option.id ? 'solid' : 'ghost'"
                class="flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all"
              />
            </div>
          </UFormField>
        </div>

        <!-- Color Selector -->
        <div>
          <UFormField label="Color">
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="color in colorOptions"
                :key="color"
                @click="settingsForm.color = color"
                :active="settingsForm.color === color"
                :active-class="
                  settingsForm.color === color
                    ? 'ring-2 ring-foreground ring-offset-2'
                    : ''
                "
                :style="{ backgroundColor: color }"
                class="h-8 w-8 rounded-lg transition-all"
              />
            </div>
          </UFormField>
        </div>

        <!-- Goal -->
        <div>
          <UFormField label="Goal">
            <UInput
              v-model="settingsForm.goal"
              placeholder="What do you want to achieve?"
              class="w-full mt-2"
              size="xl"
              variant="soft"
            />
          </UFormField>
        </div>

        <!-- Study Hours Per Week -->
        <div>
          <label class="block text-sm font-medium mb-3"
            >Study Hours Per Week: {{ settingsForm.studyHoursPerWeek }}h</label
          >
          <input
            v-model.number="settingsForm.studyHoursPerWeek"
            type="range"
            min="1"
            max="40"
            class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div class="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1h</span>
            <span>40h</span>
          </div>
        </div>

        <!-- Tags -->
        <div>
          <UFormField label="Tags (comma separated)">
            <UInput
              v-model="settingsForm.tags"
              placeholder="e.g., Physics, Quantum Mechanics, Science"
              class="w-full mt-2"
              size="xl"
              variant="soft"
            />
          </UFormField>
        </div>

        <!-- Save Button -->
        <UButton
          @click="handleSaveSettings"
          icon="i-lucide-save"
          size="lg"
          class="w-full md:w-auto"
        >
          Save Changes
        </UButton>
      </div>
    </UCard>

    <!-- Danger Zone -->
    <UCard class="border-red-200/50 bg-red-50/50 dark:bg-red-950/20">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Danger Zone</h3>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Once you delete a project, there is no going back. Please be certain.
        </p>
        <UModal>
          <UButton
            size="xl"
            variant="outline"
            color="error"
            label="Delete Project"
          />
          <template #content>
            <UCard class="p-6 text-center">
              <div
                class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"
              >
                <UIcon name="i-lucide-trash-2" class="text-xl" />
              </div>
              <h3 class="mt-4 text-lg font-semibold">Delete Project?</h3>
              <p class="mt-2 text-sm text-muted-foreground">
                This will permanently delete "{{ projectName }}" and all its
                contents. This action cannot be undone.
              </p>

              <div class="mt-6 flex gap-3">
                <UButton
                  class="flex-1"
                  variant="soft"
                  @click="showDeleteConfirm = false"
                  >Cancel</UButton
                >
                <UButton
                  class="flex-1"
                  color="error"
                  @click="handleDeleteProject"
                  >Delete</UButton
                >
              </div>
            </UCard>
          </template>
        </UModal>
      </div>
    </UCard>

    <!-- Delete Confirmation Modal -->
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

// Props
defineProps<{
  projectName?: string;
}>();

// Icon options
const iconOptions = [
  { id: "graduation-cap", icon: "i-lucide-graduation-cap" },
  { id: "file-text", icon: "i-lucide-file-text" },
  { id: "atom", icon: "i-lucide-atom" },
  { id: "presentation", icon: "i-lucide-presentation" },
  { id: "book-open", icon: "i-lucide-book-open" },
  { id: "folder", icon: "i-lucide-folder-kanban" },
  { id: "target", icon: "i-lucide-target" },
  { id: "sparkles", icon: "i-lucide-sparkles" },
];

// Color options
const colorOptions = [
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
];

// State
const showDeleteConfirm = ref(false);

const settingsForm = reactive({
  name: "Advanced Physics",
  description:
    "Comprehensive study materials for quantum mechanics and relativity",
  icon: "graduation-cap",
  color: "#a855f7",
  goal: "Master quantum mechanics principles and pass the final exam with 85%+",
  studyHoursPerWeek: 15,
  tags: "Physics, Quantum Mechanics, Science",
});

const handleSaveSettings = () => {
  toast.add({
    title: "Success",
    description: "Project settings saved successfully",
    color: "error",
  });
  // Handle actual save logic here
};

const handleDeleteProject = () => {
  toast.add({
    title: "Project Deleted",
    description: "The project has been permanently deleted",
    color: "error",
  });
  showDeleteConfirm.value = false;
  // Navigate away or handle deletion
};
</script>
