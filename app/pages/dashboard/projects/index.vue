<template>
  <DashboardBodyLayout
    title="Projects"
    description="Organize your study materials into focused projects"
  >
    <template #actions>
      <ProjectAddBtn
        ref="projectAddBtnRef"
        :model-value="isCreating"
        @update:modelValue="isCreating = $event"
        @create-project="handleCreateProject"
      />
    </template>

    <div class="space-y-6">
      <!-- Loading State -->
      <div v-if="projectStore.isLoading" class="text-center py-12">
        <div class="inline-flex items-center gap-2">
          <UIcon name="i-lucide-loader" class="h-5 w-5 animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="projectStore.error"
        class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive"
      >
        <p class="font-medium">Error loading projects</p>
        <p class="text-sm">{{ projectStore.error }}</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="projectStore.isEmpty"
        class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center"
      >
        <UIcon
          name="i-lucide-folder-open"
          class="h-12 w-12 mx-auto mb-4 text-muted-foreground"
        />
        <p class="text-lg font-medium">No projects yet</p>
        <p class="text-sm text-muted-foreground mt-1">
          Create your first project to get started
        </p>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="project in formattedProjects"
          :key="project.documentId"
          class="rounded-lg border border-default bg-card p-6 hover:border-primary hover:shadow-lg transition-all"
        >
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div
              :class="[
                `flex h-12 w-12 items-center justify-center rounded-lg text-white`,
                project.colorClass,
              ]"
            >
              <UIcon
                :name="projectService.getIconName(project.icons)"
                class="h-6 w-6"
              />
            </div>
            <div class="flex items-center gap-1">
              <UButton
                icon="i-lucide-edit"
                variant="ghost"
                size="xs"
                :to="`/dashboard/projects/${project.documentId}`"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                size="xs"
                color="error"
                @click="handleDeleteProject(project.documentId)"
              />
            </div>
          </div>

          <!-- Title and Description -->
          <h3 class="mt-4 text-lg font-semibold text-card-foreground">
            {{ project.title }}
          </h3>
          <p class="mt-1 text-sm text-muted-foreground line-clamp-2">
            {{ project.description || "No description" }}
          </p>

          <!-- Project Info -->
          <div class="mt-4 space-y-3">
            <!-- Date Range -->
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <UIcon name="i-lucide-calendar" class="h-4 w-4" />
              <span>{{ project.formattedDueDate }}</span>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center gap-2">
              <div
                :class="[
                  'text-xs font-medium px-2 py-1 rounded-full',
                  project.status === 'active'
                    ? 'bg-green-500/20 text-green-700'
                    : project.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-700'
                      : project.status === 'overdue'
                        ? 'bg-red-500/20 text-red-700'
                        : 'bg-[var(--ga-warm-soft)] text-[var(--ga-warm)]',
                ]"
              >
                {{ project.status }}
              </div>
              <span
                v-if="project.daysRemaining > 0"
                class="text-xs text-muted-foreground"
              >
                {{ project.daysRemaining }} days left
              </span>
            </div>

            <!-- Libraries Count -->
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <UIcon name="i-lucide-book" class="h-4 w-4" />
              <span
                >{{ project.librariesCount }} libraries •
                {{ project.notesCount }} notes</span
              >
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-6">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-muted-foreground">Progress</span>
              <span
                class="font-medium"
                :class="
                  project.progress === 100 ? 'text-green-600' : 'text-primary'
                "
              >
                {{ project.progress }}%
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all"
                :class="project.colorClass"
                :style="{ width: project.progress + '%' }"
              />
            </div>
          </div>

          <!-- View Button -->
          <UButton
            variant="outline"
            class="w-full justify-center mt-6"
            :to="`/dashboard/projects/${project.documentId}`"
          >
            View Project
          </UButton>
        </div>
      </div>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useProjectStore } from "~/stores/projects";
import { useStoreInitializer } from "~/composables/useStoreInitializer";
import { ProjectService } from "~/services/projectService";

definePageMeta({
  layout: "newdash",
});

// Pinia stores
const projectStore = useProjectStore();
const projectService = new ProjectService();
const isCreating = ref(false);
const projectAddBtnRef = ref<{
  setFieldErrorsFromApi: (fieldErrors: Record<string, string[]>) => void;
} | null>(null);

// Store initializer for smart data fetching
const { initialize } = useStoreInitializer();

const toast = useToast();

const notify = (message: string, type: "success" | "error" = "success") => {
  toast.add({
    title: type === "success" ? "Success" : "Error",
    description: message,
    color: type === "success" ? "success" : "error",
  });
};

/**
 * Initialize projects on mount (smart: reuses cached data)
 */
onMounted(async () => {
  try {
    await initialize();
  } catch {
    notify("Failed to load projects", "error");
  }
});

/**
 * Handle project creation from AddBtn component
 */
const handleCreateProject = async (projectData: any) => {
  try {
    await projectStore.createProject({
      title: projectData.title,
      description: projectData.description,
      icons: projectData.icons,
      color: projectData.color,
      start: projectData.start,
      end: projectData.end,
      libraries: projectData.libraries,
    });

    isCreating.value = false;
    notify("Project created successfully", "success");
  } catch (error: any) {
    // Extract field errors from API response
    const fieldErrors = error?.data?.fieldErrors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      // Set field errors on form for display below each field
      projectAddBtnRef.value?.setFieldErrorsFromApi(fieldErrors);
      notify("Please check the highlighted fields", "error");
    } else {
      // Fallback to generic error message
      notify(error?.data?.statusMessage || "Failed to create project", "error");
    }
  }
};

/**
 * Handle project deletion
 */
const handleDeleteProject = async (documentId: string) => {
  try {
    await projectStore.deleteProject(documentId);
    notify("Project deleted successfully", "success");
  } catch {
    notify("Failed to delete project", "error");
  }
};

/**
 * Format project for display using ProjectService utilities
 */
const formatProjectForDisplay = (project: any) => {
  return {
    ...project,
    formattedDueDate: projectService.formatDateRange(
      project.start,
      project.end,
    ),
    progress:
      project.progressLevel ??
      projectService.calculateCompletionProgress(
        project.librariesCount,
        project.notesCount,
      ),
    daysRemaining: projectService.daysRemaining(project.end),
    isOverdue: projectService.isOverdue(project.end),
    colorClass: projectService.getColorClass(project.color),
    status: projectService.getStatus(project.start, project.end),
  };
};

/**
 * Computed property for formatted projects (from Pinia store)
 */
const formattedProjects = computed(() => {
  return projectStore.allProjects.map(formatProjectForDisplay);
});
</script>
