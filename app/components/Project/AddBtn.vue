<template>
  <UModal
    title="Create New Project"
    description="Fill out the details below to create a new project."
    size="lg"
  >
    <UButton label="New Project" icon="i-lucide-plus" color="primary" />
    <template #body>
      <div class="flex flex-col gap-4">
        <!-- Title Field -->
        <UFormField label="Project Name">
          <UInput
            v-model="formData.title"
            placeholder="Enter project title"
            class="w-full"
            :maxlength="100"
          />
          <p class="text-xs text-muted-foreground mt-1 text-right">
            {{ (formData.title || "").length }}/100 characters
          </p>
          <p
            v-if="form.getFieldError('title')"
            class="text-sm text-red-500 mt-1"
          >
            {{ form.getFieldError("title") }}
          </p>
        </UFormField>

        <!-- Description Field -->
        <UFormField label="Project Description">
          <UTextarea
            v-model="formData.description"
            placeholder="Describe your project..."
            class="w-full"
            :rows="3"
            :maxlength="500"
          />
          <p class="text-xs text-muted-foreground mt-1 text-right">
            {{ (formData.description || "").length }}/500 characters
          </p>
        </UFormField>

        <!-- Icon & Color Selection (Column Layout) -->
        <UFormField
          as="div"
          label="Select Icon and Color"
          description="Icons and colors to identify projects"
          class="flex flex-col"
        >
          <!-- Icon Picker -->
          <div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="icon in iconOptionsProp"
                :key="icon.value"
                @click="formData.icons = icon.value as any"
                :class="[
                  'flex items-center justify-center p-3 rounded-lg border-2 transition-all',
                  formData.icons === icon.value
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent bg-muted hover:bg-muted/80',
                ]"
                :title="icon.label"
                type="button"
              >
                <UIcon :name="icon.icon" class="h-5 w-5" />
              </button>
            </div>
            <p
              v-if="form.getFieldError('icons')"
              class="text-sm text-red-500 mt-2"
            >
              {{ form.getFieldError("icons") }}
            </p>
          </div>

          <!-- Color Presets -->
          <div>
            <ColorPresets v-model="formData.color" />
            <p
              v-if="form.getFieldError('color')"
              class="text-sm text-red-500 mt-2"
            >
              {{ form.getFieldError("color") }}
            </p>
          </div>
        </UFormField>

        <!-- Date Fields -->
        <UFormField
          label="Project Timeline"
          description="Set start and end dates for your project"
        >
          <div class="flex gap-4 w-full">
            <div class="flex-1">
              <label class="text-sm text-muted-foreground block mb-2"
                >Start Date</label
              >
              <UInput
                v-model="formData.start"
                class="w-full"
                type="date"
                size="lg"
              />
            </div>
            <div class="flex-1">
              <label class="text-sm text-muted-foreground block mb-2"
                >End Date</label
              >
              <UInput
                v-model="formData.end"
                class="w-full"
                type="date"
                size="lg"
              />
            </div>
          </div>
          <p v-if="form.getFieldError('end')" class="text-sm text-red-500 mt-2">
            {{ form.getFieldError("end") }}
          </p>
        </UFormField>

        <!-- Action Buttons -->
        <div class="flex gap-2 mt-4">
          <UButton
            color="primary"
            :loading="form.isSubmitting.value"
            class="flex-1"
            @click="handleSubmit"
            size="lg"
          >
            Create Project
          </UButton>
          <UButton
            variant="outline"
            class="flex-1"
            @click="closeModal"
            size="lg"
          >
            Cancel
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ProjectIcon } from "~/types/project.types";
import { ICONS } from "~/constants/projects.const";
import {
  useProjectForm,
  type ProjectFormData,
} from "~/composables/useProjectForm";
import ColorPresets from "~/components/ColorPresets.vue";

const props = defineProps<{
  modelValue: boolean;
  iconOptions?: Array<{ label: string; value: ProjectIcon }>;
}>();

const emit = defineEmits<{
  (e: "createProject", formData: ProjectFormData): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const form = useProjectForm();
const formData = form.formData;

function handleSubmit() {
  if (!form.validateForm()) return;
  emit("createProject", { ...formData.value });
}

function closeModal() {
  emit("update:modelValue", false);
}

// Use ICONS constant for icon options if not provided
const iconOptionsProp = computed(() => {
  if (props.iconOptions && props.iconOptions.length) {
    // If iconOptions are passed, map to include icon class from ICONS
    return props.iconOptions.map((opt) => ({
      ...opt,
      icon: ICONS[opt.value] || `i-lucide-${opt.value}`,
    }));
  }
  // Default options using ICONS
  return Object.entries(ICONS).map(([value, icon]) => ({
    label: value.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: value as ProjectIcon,
    icon,
  }));
});
</script>
