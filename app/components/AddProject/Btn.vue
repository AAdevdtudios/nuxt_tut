<script setup lang="ts">
import { ref } from "vue";
import type { LibraryType, LibraryCreateRequest } from "~/types";

interface FormData {
  title: string;
  url: string;
  file: File | null;
  notes: string;
}

const isOpen = ref(false);
const selectedType = ref<string | null>(null);
const step = ref<"select" | "form" | "success">("select");
const isSubmitting = ref(false);
const router = useRouter();
const formData = ref<FormData>({
  title: "",
  url: "",
  file: null,
  notes: "",
});

// Initialize composables
const toast = useToast();
const library = useLibrary({
  onError: (error: string, details?: string[]) => {
    toast.add({
      title: "Error",
      description: error,
      color: "error",
    });
  },
  onSuccess: (message: string) => {
    toast.add({
      title: "Success",
      description: message,
      color: "success",
    });
  },
});

const validation = useLibraryValidation();

const contentTypes = [
  {
    icon: "i-lucide-file-text",
    label: "Upload Document",
    description: "PDF files only",
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
  if (type === "explore") {
    isOpen.value = false;
    router.push("/dashboard/explore");
    return;
  }
  if (type === "note") {
    isOpen.value = false;
    router.push("/dashboard/notes/new");
    return;
  }
  selectedType.value = type;
  step.value = "form";
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  const libraryType = mapTypeToLibraryType(selectedType.value);

  try {
    if (!libraryType) {
      toast.add({
        title: "Validation Error",
        description: "Please choose a content type first",
        color: "error",
      });
      isSubmitting.value = false;
      return;
    }

    const payload: LibraryCreateRequest = {
      title: formData.value.title.trim(),
      libraryType,
    };

    // Handle type-specific data
    if (selectedType.value === "document" && formData.value.file) {
      payload.file = formData.value.file;
    } else if (selectedType.value === "website") {
      try {
        const parsed = new URL(formData.value.url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          toast.add({
            title: "Validation Error",
            description: "URL must start with http:// or https://",
            color: "error",
          });
          isSubmitting.value = false;
          return;
        }
        if (parsed.pathname.toLowerCase().endsWith(".epub")) {
          toast.add({
            title: "Validation Error",
            description: "EPUB links are not supported. Use a website or PDF link.",
            color: "error",
          });
          isSubmitting.value = false;
          return;
        }
        payload.url = formData.value.url.trim();
      } catch {
        toast.add({
          title: "Validation Error",
          description: "Please enter a valid URL",
          color: "error",
        });
        isSubmitting.value = false;
        return;
      }
    } else if (selectedType.value === "note") {
      payload.content = formData.value.notes.trim();
    }

    if (!validation.validateCreate(payload)) {
      validation.errors.value.forEach((err) => {
        toast.add({
          title: "Validation Error",
          description: `${err.field}: ${err.message}`,
          color: "error",
        });
      });
      isSubmitting.value = false;
      return;
    }

    await library.createLibrary(payload);

    step.value = "success";
    setTimeout(() => {
      isOpen.value = false;
      resetForm();
    }, 1500);
  } catch {
    // Error is already handled by composable's onError callback
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * Maps form type selection to library type enum
 */
const mapTypeToLibraryType = (type: string | null): LibraryType | null => {
  switch (type) {
    case "document":
      return "doc";
    case "website":
      return "url";
    case "note":
      return "note";
    default:
      return null;
  }
};

/**
 * Reset form to initial state
 */
const resetForm = () => {
  step.value = "select";
  selectedType.value = null;
  formData.value = { title: "", url: "", file: null, notes: "" };
  validation.clearErrors();
};

const handleClose = () => {
  isOpen.value = false;
  setTimeout(() => {
    resetForm();
  }, 200);
};
</script>

<template>
  <UModal
    v-model="isOpen"
    :modal="false"
    :overlay="true"
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
        <!-- Title Input -->
        <div class="w-full">
          <UFormField label="Title" :error="validation.getFieldError('title')">
            <UInput
              v-model="formData.title"
              class="w-full"
              placeholder="Enter title..."
              :ui="{
                base: validation.hasFieldError('title') ? 'border-red-500' : '',
              }"
            />
          </UFormField>
        </div>

        <!-- Document Upload -->
        <div v-if="selectedType === 'document'" class="w-full">
          <UFormField label="Upload File">
            <UFileUpload
              v-model="formData.file"
              color="neutral"
              highlight
              label="Drop your file here"
              description="PDF files only"
              accept="application/pdf,.pdf"
              class="w-full min-h-48"
            />
            <p v-if="formData.file" class="mt-2 text-sm text-muted-foreground">
              Selected: {{ formData.file.name }}
            </p>
          </UFormField>
        </div>

        <!-- Website -->
        <div v-if="selectedType === 'website'" class="w-full">
          <UFormField
            label="Website URL"
            :error="validation.getFieldError('url')"
          >
            <UInput
              v-model="formData.url"
              type="url"
              placeholder="https://example.com/article"
              class="w-full"
              :ui="{
                base: validation.hasFieldError('url') ? 'border-red-500' : '',
              }"
            />
          </UFormField>
        </div>

        <!-- Note -->
        <div v-if="selectedType === 'note'" class="w-full">
          <UFormField
            label="Your Note"
            :error="validation.getFieldError('content')"
          >
            <AddProjectEditorExample v-model="formData.notes" />
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
          <UButton
            @click="step = 'select'"
            variant="outline"
            :disabled="isSubmitting"
          >
            Back
          </UButton>
          <UButton
            @click="handleSubmit"
            color="primary"
            :loading="isSubmitting"
            :disabled="!formData.title.trim() || isSubmitting"
          >
            {{ isSubmitting ? "Adding to Library..." : "Add to Library" }}
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
