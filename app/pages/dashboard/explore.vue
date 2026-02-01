<template>
  <DashboardBodyLayout
    title="Explore"
    description="Discover new topics and study materials"
  >
    <div class="space-y-6">
      <!-- Search Bar -->
      <div class="relative">
        <UInput
          v-model="searchQuery"
          placeholder="Search for topics, courses, or materials..."
          icon="i-lucide-search"
          class="w-full my-2"
        />
      </div>

      <!-- Categories -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        <UButton
          @click="
            () => {
              selectedCategory = 'all';
              fetchExplores();
            }
          "
          class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :variant="selectedCategory === 'all' ? 'solid' : 'ghost'"
        >
          All
        </UButton>
        <UButton
          v-for="category in categories"
          :key="category.id"
          @click="
            () => {
              selectedCategory = category.slug;
              fetchExplores();
            }
          "
          class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize"
          :variant="selectedCategory === category.slug ? 'solid' : 'ghost'"
        >
          {{ category.name }}
        </UButton>
      </div>

      <!-- Explores/Materials -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-xl font-semibold text-foreground">
            Available Resources
          </h3>
          <USelect
            v-model="pageSize"
            :items="
              pageSizes.map((size) => ({ label: size.toString(), value: size }))
            "
            class="w-24"
            placeholder="Page Size"
            @update:model-value="
              (val) => {
                page = 1;
                pageSize = val;
                fetchExplores();
              }
            "
          />
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <UIcon
            name="i-lucide-loader"
            class="h-8 w-8 animate-spin text-primary"
          />
        </div>
        <UEmpty
          v-else-if="explores.length === 0 && !loading"
          icon="i-lucide-inbox"
          title="No resources found"
          description="Try adjusting your search or category filters"
          :actions="[
            {
              label: 'Refresh',
              variant: 'outline',
              color: 'primary',
              onClick: () => fetchExplores(),
            },
          ]"
        />

        <div v-else class="space-y-3">
          <div
            v-for="item in explores"
            :key="item.id"
            class="flex items-center justify-between rounded-lg border border-default bg-card py-2 px-4 transition-all hover:border-primary"
          >
            <div class="flex items-center gap-3">
              <UIcon
                :name="'i-lucide-book-open'"
                class="size-20 md:size-5 text-primary"
              />
              <div class="flex flex-col">
                <span
                  class="text-sm md:text-xl font-semibold text-card-foreground"
                >
                  {{ item.Title }}
                </span>
                <p class="mt-1 text-xs text-muted line-clamp-2 md:line-clamp-3">
                  {{ item.Description }}
                </p>
                <div
                  class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:gap-3"
                >
                  <span class="rounded-full bg-muted px-2 py-0.5">{{
                    item.Language
                  }}</span>
                  <span class="hidden md:inline">•</span>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-download" class="h-3 w-3" />
                    {{ Number(item.Downloads).toLocaleString() }} downloads
                  </span>
                  <span class="hidden md:inline">•</span>
                  <span class="text-xs">{{ item.Copyright }}</span>
                </div>
              </div>
            </div>
            <UButton
              @click="openExplore(item.url)"
              class="flex items-center gap-2 shrink-0 ml-4"
              color="primary"
            >
              <span class="hidden sm:inline">View</span>
              <UIcon name="i-lucide-external-link" class="h-4 w-4" />
            </UButton>
          </div>

          <!-- Pagination -->
          <div class="flex justify-center mt-8">
            <UPagination
              v-model:page="page"
              :total="total"
              active-color="primary"
              active-variant="subtle"
            />
          </div>
        </div>
      </div>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";

definePageMeta({
  layout: "dashboard",
});

interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Explore {
  id: number;
  documentId: string;
  Title: string;
  Description: string;
  Downloads: string;
  Copyright: string;
  url: string;
  slug: string;
  Language: string;
  Author: string;
}

const searchQuery = ref("");
const selectedCategory = ref("all");
const categories = ref<Category[]>([]);
const explores = ref<Explore[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const toast = useToast();
const pageSizes = [5, 10, 20, 50];
// Pagination state
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

// Fetch categories from API endpoint
const fetchCategories = async () => {
  try {
    loading.value = true;
    const authStore = useAuthStore();
    const response = await $fetch<{
      success: boolean;
      data: { data: Category[] };
    }>("/api/categories", {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    if (response.success) {
      categories.value = response.data.data || [];
    } else {
      throw new Error("Failed to load categories");
    }
  } catch (err) {
    error.value = "Failed to load categories";
    toast.add({
      title: "Error",
      description: "Failed to load categories",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Fetch explores from API endpoint with pagination, search, and filters
const fetchExplores = async () => {
  try {
    loading.value = true;
    // const authStore = useAuthStore();
    const response = await $fetch<{
      success: boolean;
      data: {
        items: Explore[];
        pagination: {
          page: number;
          pageSize: number;
          pageCount: number;
          total: number;
        };
      };
    }>("/api/explores", {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        search: searchQuery.value || undefined,
        category: selectedCategory.value || undefined,
      },
    });
    console.log(response["data"]);
    console.log(response.data.pagination);

    if (response.success) {
      explores.value = response.data.items || [];
      total.value = response.data.pagination?.total || 0;
    } else {
      throw new Error("Failed to load explores");
    }
  } catch (err) {
    error.value = "Failed to load explores";
    toast.add({
      title: "Error",
      description: "Failed to load explores",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Get unique languages from explores
const uniqueLanguages = computed(() => {
  const languages = new Set(explores.value.map((e) => e.Language));
  return Array.from(languages).sort();
});

// Watch for page changes and refetch explores
watch(page, () => {
  fetchExplores();
});

// Reset page when filters or search change
watch([searchQuery, selectedCategory], () => {
  page.value = 1;
  fetchExplores();
});

// Load data on mount
onMounted(() => {
  fetchCategories();
  fetchExplores();
});

const openExplore = (url: string) => {
  window.open(url, "_blank");
};
</script>
