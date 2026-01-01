<template>
  <DashboardBodyLayout
    title="Projects"
    description="Organize your study materials into focused projects"
  >
    <template #actions>
      <UModal title="Create New Project" v-model="isCreating">
        <UButton
          label="New Project"
          icon="i-lucide-plus"
          color="primary"
          @click="isCreating = true"
        />
        <template #body>
          <div class="flex flex-col gap-4 p-4">
            <UInput
              v-model="newProjectName"
              placeholder="Project Title"
              class="border border-default"
              autofocus
            />
            <UTextarea
              v-model="newProjectDescription"
              placeholder="Project Description"
              class="border border-default"
              :rows="3"
            />
            <div class="flex gap-4">
              <USelect
                v-model="newProjectIcon"
                :items="iconOptions"
                placeholder="Select Icon"
                class="border border-default w-1/2"
                option-variant="icon"
              />
              <USelect
                v-model="newProjectColor"
                :items="colorOptions"
                placeholder="Color"
                class="border border-default w-1/2"
              />
            </div>
            <div>
              <UPopover>
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-calendar"
                  class="w-full justify-start"
                >
                  <template v-if="newProjectDateRange.start">
                    <template v-if="newProjectDateRange.end">
                      {{
                        df.format(
                          newProjectDateRange.start.toDate(getLocalTimeZone())
                        )
                      }}
                      -
                      {{
                        df.format(
                          newProjectDateRange.end.toDate(getLocalTimeZone())
                        )
                      }}
                    </template>
                    <template v-else>
                      {{
                        df.format(
                          newProjectDateRange.start.toDate(getLocalTimeZone())
                        )
                      }}
                    </template>
                  </template>
                  <template v-else> Pick a date range </template>
                </UButton>
                <template #content>
                  <UCalendar
                    v-model="newProjectDateRange"
                    class="p-2"
                    :number-of-months="2"
                    range
                  />
                </template>
              </UPopover>
            </div>
            <div class="flex gap-2 mt-4">
              <UButton color="primary" @click="createProject">Create</UButton>
              <UButton variant="outline" @click="isCreating = false"
                >Cancel</UButton
              >
            </div>
          </div>
        </template>
      </UModal>
    </template>
    <div class="space-y-6">
      <!-- Projects Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="project in projects"
          :key="project.id"
          class="rounded-lg border border-default bg-card p-6 hover:border-primary"
        >
          <div class="flex items-start justify-between">
            <div
              :class="`flex h-12 w-12 items-center justify-center rounded-lg ${project.color} text-white`"
            >
              <UIcon name="i-lucide-folder-kanban" class="h-6 w-6" />
            </div>
            <div class="flex items-center gap-1">
              <UButton icon="i-lucide-edit" variant="ghost" size="xs" />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                size="xs"
                color="error"
                @click="deleteProject(project.id)"
              />
            </div>
          </div>

          <h3 class="mt-4 text-lg font-semibold text-card-foreground">
            {{ project.name }}
          </h3>
          <p class="mt-1 text-sm text-muted-foreground line-clamp-2">
            {{ project.description }}
          </p>

          <div class="mt-4 space-y-3">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <UIcon name="i-lucide-check-circle-2" class="h-4 w-4" />
              <span>{{ project.items }} items</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <UIcon name="i-lucide-calendar" class="h-4 w-4" />
              <span>Due {{ project.dueDate }}</span>
            </div>
          </div>

          <div class="mt-6">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Progress</span>
              <span class="font-medium text-primary"
                >{{ project.progress }}%</span
              >
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all"
                :class="project.color"
                :style="{ width: project.progress + '%' }"
              />
            </div>
          </div>

          <UButton variant="outline" class="w-full justify-center mt-6"
            >View Project</UButton
          >
        </div>
      </div>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { ref, shallowRef } from "vue";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";

definePageMeta({
  layout: "dashboard",
});

type Project = {
  id: number;
  name: string;
  description: string;
  items: number;
  progress: number;
  dueDate: string;
  color: string;
};

const projects = ref<Project[]>([
  {
    id: 1,
    name: "Final Exams Prep",
    description: "Comprehensive exam preparation",
    items: 24,
    progress: 65,
    dueDate: "Apr 15, 2024",
    color: "bg-purple-500",
  },
  {
    id: 2,
    name: "Research Paper",
    description: "Climate change research",
    items: 12,
    progress: 40,
    dueDate: "Apr 30, 2024",
    color: "bg-blue-500",
  },
  {
    id: 3,
    name: "Physics Assignment",
    description: "Thermodynamics problems",
    items: 8,
    progress: 90,
    dueDate: "Mar 28, 2024",
    color: "bg-green-500",
  },
  {
    id: 4,
    name: "Group Presentation",
    description: "Marketing strategy presentation",
    items: 15,
    progress: 25,
    dueDate: "May 5, 2024",
    color: "bg-orange-500",
  },
]);

const isCreating = ref(false);
const newProjectName = ref("");
const newProjectDescription = ref("");
const newProjectIcon = ref("i-lucide-folder-kanban");
const newProjectColor = ref("bg-indigo-500");
const df = new DateFormatter("en-US", { dateStyle: "medium" });
const newProjectDateRange = shallowRef<{
  start: CalendarDate | undefined;
  end: CalendarDate | undefined;
}>({
  start: undefined,
  end: undefined,
});

const iconOptions = [
  { label: "Folder", value: "i-lucide-folder-kanban" },
  { label: "Book", value: "i-lucide-book" },
  { label: "File", value: "i-lucide-file-text" },
  { label: "Flask", value: "i-lucide-flask" },
  { label: "Presentation", value: "i-lucide-presentation" },
];
const colorOptions = [
  { label: "Purple", value: "bg-purple-500" },
  { label: "Blue", value: "bg-blue-500" },
  { label: "Green", value: "bg-green-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Indigo", value: "bg-indigo-500" },
];

function createProject() {
  if (!newProjectName.value.trim()) return;
  let dueDate = "TBD";
  if (newProjectDateRange.value.start) {
    dueDate = df.format(
      newProjectDateRange.value.start.toDate(getLocalTimeZone())
    );
    if (newProjectDateRange.value.end) {
      dueDate +=
        " - " +
        df.format(newProjectDateRange.value.end.toDate(getLocalTimeZone()));
    }
  }
  const newProject: Project = {
    id: projects.value.length + 1,
    name: newProjectName.value,
    description: newProjectDescription.value,
    items: 0,
    progress: 0,
    dueDate,
    color: newProjectColor.value,
  };
  projects.value.push(newProject);
  newProjectName.value = "";
  newProjectDescription.value = "";
  newProjectIcon.value = "i-lucide-folder-kanban";
  newProjectColor.value = "bg-indigo-500";
  newProjectDateRange.value = { start: undefined, end: undefined };
  isCreating.value = false;
}

function formatDate(date: any) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString();
}

function deleteProject(id: number) {
  projects.value = projects.value.filter((p) => p.id !== id);
}
</script>
