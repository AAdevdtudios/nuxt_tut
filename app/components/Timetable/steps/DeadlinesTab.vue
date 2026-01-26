<script setup lang="ts">
import type {
  DeadlinesStepData,
  ExamDeadline,
  AssignmentDeadline,
  SubjectsStepData,
} from "~/types";

const isComplete = defineModel<boolean>("isComplete", { required: true });
const data = defineModel<DeadlinesStepData | null>("data", { required: true });
const props = defineProps<{ subjects: string[] }>();
const subjects = computed(() => props.subjects || []);

const examSubject = ref("");
const examDate = ref<string>("");
const assignmentSubject = ref("");
const assignmentDate = ref<string>("");

const exams = ref<ExamDeadline[]>([]);
const assignments = ref<AssignmentDeadline[]>([]);

// Initialize from parent data
let updatingFromParent = false;

// Sync parent data to local refs
watch(
  () => data.value,
  (value) => {
    if (!value) return;
    updatingFromParent = true;
    exams.value = [...value.exams];
    assignments.value = [...value.assignments];
    updatingFromParent = false;
  },
  { immediate: true }
);

function syncToParent() {
  if (updatingFromParent) return;
  data.value = {
    exams: exams.value,
    assignments: assignments.value,
  };
  isComplete.value = true;
}

function toISODateString(date: string): `${number}-${number}-${number}` {
  // Accepts yyyy-mm-dd string directly
  return date as `${number}-${number}-${number}`;
}

function addExam() {
  if (!examSubject.value || !examDate.value) return;
  exams.value.push({
    subject: examSubject.value,
    date: toISODateString(examDate.value),
  });
  examSubject.value = "";
  examDate.value = "";
  syncToParent();
}
function removeExam(idx: number) {
  exams.value.splice(idx, 1);
  syncToParent();
}
function addAssignment() {
  if (!assignmentSubject.value || !assignmentDate.value) return;
  assignments.value.push({
    subject: assignmentSubject.value,
    date: toISODateString(assignmentDate.value),
  });
  assignmentSubject.value = "";
  assignmentDate.value = "";
  syncToParent();
}
function removeAssignment(idx: number) {
  assignments.value.splice(idx, 1);
  syncToParent();
}
</script>

<template>
  <div class="space-y-4">
    <!-- Deadlines Step -->
    <div class="flex flex-col gap-2">
      <p class="font-medium text-md">Exam date</p>
      <div class="flex flex-col md:flex-row mt-2 gap-4">
        <USelect
          v-model="examSubject"
          :items="subjects.map((s: string) => ({ label: s, value: s }))"
          placeholder="Select Subject"
          class="w-full"
        />
        <UInput type="date" v-model="examDate" class="w-full" />
        <UButton
          icon="i-lucide-plus"
          class="p-2 rounded w-full md:w-fit items-center justify-center"
          :disabled="!examSubject || !examDate"
          @click="addExam"
        />
      </div>
      <div v-if="exams.length" class="mt-2 space-y-1">
        <div
          v-for="(exam, idx) in exams"
          :key="idx"
          class="flex items-center gap-2 border rounded px-3 py-1 text-sm"
        >
          <span class="font-medium">{{ exam.subject }}</span>
          <span>{{ exam.date }}</span>
          <UButton
            icon="i-lucide-x"
            color="error"
            size="xs"
            @click="removeExam(idx)"
          />
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <p class="font-medium text-md">Assignment date</p>
      <div class="flex flex-col md:flex-row mt-2 gap-4">
        <USelect
          v-model="assignmentSubject"
          :items="subjects.map((s: string) => ({ label: s, value: s }))"
          placeholder="Select Subject"
          class="w-full"
        />
        <UInput type="date" v-model="assignmentDate" class="w-full" />
        <UButton
          icon="i-lucide-plus"
          class="p-2 rounded w-full md:w-fit items-center justify-center"
          :disabled="!assignmentSubject || !assignmentDate"
          @click="addAssignment"
        />
      </div>
      <div v-if="assignments.length" class="mt-2 space-y-1">
        <div
          v-for="(assignment, idx) in assignments"
          :key="idx"
          class="flex items-center gap-2 border rounded px-3 py-1 text-sm"
        >
          <span class="font-medium">{{ assignment.subject }}</span>
          <span>{{ assignment.date }}</span>
          <UButton
            icon="i-lucide-x"
            color="error"
            size="xs"
            @click="removeAssignment(idx)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
