<script setup lang="ts">
import { ref } from "vue";

interface FormData {
  title: string;
  url: string;
  file: File | null;
  notes: string;
}

const isOpen = ref(false);
const selectedType = ref<string | null>(null);
const step = ref<"select" | "form" | "success">("select");
const formData = ref<FormData>({
  title: "",
  url: "",
  file: null,
  notes: "",
});

const contentTypes = [
  {
    icon: "i-lucide-file-text",
    label: "Upload Document",
    description: "PDF, DOCX, or TXT files",
    type: "document",
  },
  {
    icon: "i-lucide-link",
    label: "Save Website",
    description: "Add URL to your library",
    type: "website",
  },
  {
    icon: "i-lucide-book-open",
    label: "Create Note",
    description: "Write or paste notes",
    type: "note",
  },
  {
    icon: "i-lucide-compass",
    label: "Explore Content",
    description: "Get content from Explore page",
    type: "explore",
  },
];

const handleBtnSelect = (type: string) => {
  console.log(type);

  if (type === "explore") {
    isOpen.value = false;
    useRouter().push("/dashboard/explore");
    return;
  }
  selectedType.value = type;
  step.value = "form";
};

const handleSubmit = () => {
  step.value = "success";
  setTimeout(() => {
    isOpen.value = false;
    step.value = "select";
    selectedType.value = null;
    formData.value = { title: "", url: "", file: null, notes: "" };
  }, 1500);
};

const handleClose = () => {
  isOpen.value = false;
  setTimeout(() => {
    step.value = "select";
    selectedType.value = null;
    formData.value = { title: "", url: "", file: null, notes: "" };
  }, 200);
};
</script>

<template>
  <UModal
    v-model="isOpen"
    title="Add Content"
    description="Add new content to your library"
  >
    <UButton
      slot="trigger"
      label="Add Content"
      icon="i-lucide-plus"
      color="primary"
    />
    <template #body>
      <!-- Select Step -->
      <div v-if="step === 'select'">
        <div class="grid grid-cols-2 gap-4 mb-6">
          <button
            v-for="type in contentTypes"
            :key="type.type"
            @click="handleBtnSelect(type.type)"
            :class="[
              'flex flex-col items-start gap-3 rounded-lg border border-default p-4 transition-all',
              selectedType === type.type
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:border-primary/50',
            ]"
          >
            <div
              :class="[
                'flex h-12 w-12 items-center justify-center rounded-lg',
                selectedType === type.type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              ]"
            >
              <UIcon :name="type.icon" class="h-6 w-6" />
            </div>
            <div class="flex flex-col items-start">
              <h3 class="font-medium text-card-foreground">
                {{ type.label }}
              </h3>
              <p class="text-sm text-muted-foreground">
                {{ type.description }}
              </p>
            </div>
          </button>
        </div>

        <div class="flex justify-end gap-3">
          <UButton @click="handleClose" variant="outline" label="Cancel" />
          <UButton
            @click="step = 'form'"
            :disabled="!selectedType"
            color="primary"
          >
            Continue
          </UButton>
        </div>
      </div>

      <!-- Form Step -->
      <div
        v-if="step === 'form'"
        class="space-y-4 w-full items-center flex flex-col"
      >
        <!-- Document Upload -->
        <UFormField label="Title" class="w-full">
          <UInput
            v-model="formData.title"
            class="w-full"
            placeholder="Enter title..."
          />
        </UFormField>

        <!-- Document Upload -->
        <div v-if="selectedType === 'document'" class="w-full">
          <UFormField label="Upload File">
            <UFileUpload
              color="neutral"
              highlight
              label="Drop your image here"
              description="SVG, PNG, JPG or GIF (max. 2MB)"
              class="w-full min-h-48"
            />
          </UFormField>
        </div>

        <!-- Website -->
        <div v-if="selectedType === 'website'" class="w-full">
          <UFormField label="Website Url">
            <UInput
              v-model="formData.url"
              type="url"
              placeholder="https://example.com/article"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Note -->
        <div v-if="selectedType === 'note'" class="w-full">
          <UFormField label="Your Note">
            <AddProjectEditorExample />
          </UFormField>
        </div>

        <!-- AI Generated -->
        <div v-if="selectedType === 'ai'" class="w-full">
          <UFormField label="Describe your content">
            <UTextarea
              v-model="formData.notes"
              placeholder="Describe what you want to generate..."
              class="w-full"
              :rows="6"
            />
          </UFormField>
        </div>

        <div class="flex justify-end gap-3">
          <UButton @click="step = 'select'" variant="outline"> Back </UButton>
          <UButton @click="handleSubmit" color="primary">
            Add to Library
          </UButton>
        </div>
      </div>

      <!-- Success Step -->
      <div
        v-if="step === 'success'"
        class="flex flex-col items-center justify-center py-8"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500"
        >
          <UIcon name="i-lucide-check" class="h-8 w-8" />
        </div>
        <h3 class="mt-4 text-xl font-semibold text-card-foreground">
          Content Added!
        </h3>
        <p class="mt-2 text-sm text-muted-foreground">
          Your content has been added to your library
        </p>
      </div>
    </template>
  </UModal>
</template>
