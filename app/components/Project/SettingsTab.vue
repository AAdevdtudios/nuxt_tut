<template>
  <div class="max-w-2xl space-y-6">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Project Settings</h3>
      </template>

      <div class="space-y-6">
        <UFormField label="Project Name">
          <UInput
            v-model="form.title"
            placeholder="Enter project name"
            variant="soft"
            size="xl"
            class="mt-2 w-full"
          />
        </UFormField>

        <UFormField label="Description">
          <UTextarea
            v-model="form.description"
            placeholder="Enter project description"
            :rows="3"
            variant="soft"
            size="xl"
            class="mt-2 w-full"
          />
        </UFormField>

        <div>
          <UFormField label="Icon" />
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton
              v-for="option in iconOptions"
              :key="option.id"
              :icon="option.icon"
              :variant="form.icons === option.id ? 'solid' : 'ghost'"
              class="flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all"
              :class="form.icons === option.id ? 'border-primary' : 'border-default'"
              @click="form.icons = option.id"
            />
          </div>
        </div>

        <div>
          <UFormField label="Color" />
          <ColorPresets v-model="form.color" :show-label="false" />
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <UFormField label="Start Date">
            <UInput
              v-model="form.startDate"
              type="date"
              variant="soft"
              class="mt-2 w-full"
            />
          </UFormField>
          <UFormField label="End Date">
            <UInput
              v-model="form.endDate"
              type="date"
              variant="soft"
              class="mt-2 w-full"
            />
          </UFormField>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            :loading="isSaving"
            :disabled="!hasChanges"
            icon="i-lucide-save"
            size="lg"
            @click="handleSaveSettings"
          >
            Save Changes
          </UButton>
          <UButton
            variant="ghost"
            :disabled="!hasChanges || isSaving"
            @click="resetForm"
          >
            Reset
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard class="border-red-200/50 bg-red-50/50 dark:bg-red-950/20">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Danger Zone</h3>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Once you delete a project, there is no going back.
        </p>
        <UModal v-model:open="showDeleteConfirm">
          <UButton size="xl" variant="outline" color="error" label="Delete Project" />
          <template #content>
            <UCard class="p-6 text-center">
              <div
                class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"
              >
                <UIcon name="i-lucide-trash-2" class="text-xl" />
              </div>
              <h3 class="mt-4 text-lg font-semibold">Delete Project?</h3>
              <p class="mt-2 text-sm text-muted-foreground">
                This will permanently delete "{{ form.title || projectName }}".
              </p>
              <div class="mt-6 flex gap-3">
                <UButton class="flex-1" variant="soft" @click="showDeleteConfirm = false">
                  Cancel
                </UButton>
                <UButton class="flex-1" color="error" :loading="isDeleting" @click="handleDeleteProject">
                  Delete
                </UButton>
              </div>
            </UCard>
          </template>
        </UModal>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { ProjectIcon, ProjectUpdateRequest } from "~/types/project.types";
import type { NormalizedProject } from "~/stores/projects";
import { ICONS } from "~/constants/projects.const";
import ColorPresets from "~/components/ColorPresets.vue";
import { useProjectStore } from "~/stores/projects";

type ProjectPreview = Partial<{
  title: string;
  description: string | null;
  icons: ProjectIcon;
  color: string;
  start: string;
  end: string;
}>;

const props = defineProps<{
  projectId: string;
  projectName?: string;
  project?: NormalizedProject | null;
}>();

const emit = defineEmits<{
  (e: "project-preview-changed", value: ProjectPreview): void;
}>();

const toast = useToast();
const router = useRouter();
const projectStore = useProjectStore();

const showDeleteConfirm = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);

const iconOptions = Object.entries(ICONS).map(([id, icon]) => ({
  id: id as ProjectIcon,
  icon,
}));

const form = reactive({
  title: "",
  description: "",
  icons: "folder" as ProjectIcon,
  color: "a78bfa",
  startDate: "",
  endDate: "",
});

const initial = reactive({
  title: "",
  description: "",
  icons: "folder" as ProjectIcon,
  color: "a78bfa",
  startDate: "",
  endDate: "",
});

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function syncFromProject(project?: NormalizedProject | null) {
  const title = project?.title || "";
  const description = project?.description || "";
  const icons = (project?.icons || "folder") as ProjectIcon;
  const color = (project?.color || "a78bfa").replace(/^#/, "");
  const startDate = toDateInput(project?.start);
  const endDate = toDateInput(project?.end);

  form.title = title;
  form.description = description;
  form.icons = icons;
  form.color = color;
  form.startDate = startDate;
  form.endDate = endDate;

  initial.title = title;
  initial.description = description;
  initial.icons = icons;
  initial.color = color;
  initial.startDate = startDate;
  initial.endDate = endDate;
}

watch(
  () => props.project,
  (project) => {
    syncFromProject(project);
  },
  { immediate: true },
);

const hasChanges = computed(() => {
  return (
    form.title !== initial.title ||
    form.description !== initial.description ||
    form.icons !== initial.icons ||
    form.color !== initial.color ||
    form.startDate !== initial.startDate ||
    form.endDate !== initial.endDate
  );
});

const previewPayload = computed<ProjectPreview>(() => ({
  title: form.title || "Project",
  description: form.description || null,
  icons: form.icons,
  color: form.color,
  start: form.startDate ? new Date(form.startDate).toISOString() : undefined,
  end: form.endDate ? new Date(form.endDate).toISOString() : undefined,
}));

watch(
  previewPayload,
  (value) => {
    emit("project-preview-changed", value);
  },
  { deep: true },
);

function resetForm() {
  form.title = initial.title;
  form.description = initial.description;
  form.icons = initial.icons;
  form.color = initial.color;
  form.startDate = initial.startDate;
  form.endDate = initial.endDate;
}

function buildPatchPayload(): ProjectUpdateRequest {
  const payload: ProjectUpdateRequest = {};

  if (form.title !== initial.title) payload.title = form.title.trim();
  if (form.description !== initial.description) {
    payload.description = form.description.trim();
  }
  if (form.icons !== initial.icons) payload.icons = form.icons;
  if (form.color !== initial.color) payload.color = form.color.replace(/^#/, "");
  if (form.startDate !== initial.startDate && form.startDate) payload.start = form.startDate;
  if (form.endDate !== initial.endDate && form.endDate) payload.end = form.endDate;

  return payload;
}

async function handleSaveSettings() {
  if (!hasChanges.value || !props.projectId) return;
  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    toast.add({
      title: "Invalid dates",
      description: "End date must be on or after start date.",
      color: "error",
    });
    return;
  }

  const payload = buildPatchPayload();
  if (Object.keys(payload).length === 0) return;

  try {
    isSaving.value = true;
    await projectStore.updateProject(props.projectId, payload);
    syncFromProject(projectStore.getProjectById(props.projectId));
    toast.add({
      title: "Saved",
      description: "Project settings updated.",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Update failed",
      description: error?.message || "Could not update project settings.",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
}

async function handleDeleteProject() {
  if (!props.projectId) return;
  try {
    isDeleting.value = true;
    await projectStore.deleteProject(props.projectId);
    showDeleteConfirm.value = false;
    toast.add({
      title: "Project deleted",
      description: "The project has been permanently deleted.",
      color: "success",
    });
    await router.push("/dashboard/projects");
  } catch (error: any) {
    toast.add({
      title: "Delete failed",
      description: error?.message || "Could not delete project.",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}
</script>
