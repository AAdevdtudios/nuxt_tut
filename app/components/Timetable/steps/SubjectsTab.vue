<template>
  <div class="space-y-6 my-2">
    <!-- Add subject -->
    <div>
      <label class="font-medium text-md">Subjects</label>
      <p class="text-sm text-gray-600">
        Please enter your subjects for the timetable:
      </p>

      <div class="flex gap-2 mt-2">
        <UInput
          v-model="subjectInput"
          placeholder="e.g. Math"
          class="w-full"
          @keyup.enter="addSubject"
        />

        <UButton
          icon="i-lucide-plus"
          variant="outline"
          :disabled="!subjectInput.trim()"
          @click="addSubject"
        />
      </div>
    </div>

    <!-- Selected subjects -->
    <div v-if="subjects.length">
      <label class="font-medium text-md">Your Subjects</label>
      <p class="text-sm text-gray-600">Selected subjects for your timetable:</p>

      <div class="mt-2 flex flex-wrap gap-2">
        <div
          v-for="subj in subjects"
          :key="subj"
          class="flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-primary"
        >
          <UIcon name="i-lucide-file-text" class="h-3 w-3" />
          <span>{{ subj }}</span>
          <button class="hover:text-primary/70" @click="removeSubject(subj)">
            <UIcon name="i-lucide-x" class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Priority selection -->
    <div v-if="subjects.length">
      <label class="font-medium text-md">Priority Subjects</label>
      <p class="text-sm text-gray-600">
        Select subjects that need extra focus:
      </p>

      <UCheckboxGroup v-model="prioritySubjects" :items="subjects" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SubjectsStepSchema } from "~/schemas/subjects.step.schema";
import type { SubjectsStepData } from "~/schemas/subjects.step.schema";

const isComplete = defineModel<boolean>("isComplete", { required: true });
const data = defineModel<SubjectsStepData | null>("data", { required: true });

const subjectInput = ref("");
const subjects = ref<string[]>([]);
const prioritySubjects = ref<string[]>([]);
const error = ref<string | null>(null);

/* Actions */
function addSubject() {
  const value = subjectInput.value.trim();
  if (!value) return;
  if (subjects.value.includes(value)) return;

  subjects.value.push(value);
  subjectInput.value = "";
}

function removeSubject(subject: string) {
  subjects.value = subjects.value.filter((s) => s !== subject);
  prioritySubjects.value = prioritySubjects.value.filter((p) => p !== subject);
}

/* Step completion + data sync */
onMounted(() => {
  if (data.value) {
    subjects.value = [...data.value.subjects];
    prioritySubjects.value = [...data.value.prioritySubjects];
  }
});

watch(
  () => data.value,
  (value) => {
    if (!value) return;

    subjects.value = [...value.subjects];
    prioritySubjects.value = [...value.prioritySubjects];
  },
  { immediate: true }
);

watch(
  [subjects, prioritySubjects],
  () => {
    const payload = {
      subjects: subjects.value,
      prioritySubjects: prioritySubjects.value,
    };

    // Minimum 3 subjects required
    if (subjects.value.length < 3) {
      if (isComplete.value !== false) isComplete.value = false;
      if (data.value !== null) data.value = null;
      error.value = "Minimum 3 subjects required";
      return;
    }

    const result = SubjectsStepSchema.safeParse(payload);

    if (result.success) {
      if (JSON.stringify(data.value) !== JSON.stringify(result.data)) {
        data.value = result.data;
      }
      if (isComplete.value !== true) isComplete.value = true;
      error.value = null;
    } else {
      if (isComplete.value !== false) isComplete.value = false;
      if (data.value !== null) data.value = null;
      error.value = result.error.issues[0]?.message ?? "Invalid input";
      return;
    }
  },
  { deep: true }
);
</script>
