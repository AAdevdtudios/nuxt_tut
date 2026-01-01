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
          v-for="category in categories"
          :key="category"
          @click="selectedCategory = category.toLowerCase()"
          :class="
            selectedCategory === category.toLowerCase()
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-foreground hover:bg-accent'
          "
          class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          variant="ghost"
        >
          {{ category }}
        </UButton>
      </div>

      <!-- Trending Topics -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-xl font-semibold text-foreground">Trending Topics</h3>
          <UButton
            variant="link"
            class="flex items-center gap-1 text-sm text-primary"
          >
            <UIcon name="i-lucide-trending-up" class="h-4 w-4" />
            View All
          </UButton>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="topic in trendingTopics"
            :key="topic.id"
            class="rounded-lg border border-default bg-card p-5 hover:border-primary"
          >
            <div class="flex items-start justify-between">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <UIcon name="i-lucide-book-open" class="h-5 w-5" />
              </div>
              <div class="flex items-center gap-1 text-sm text-yellow-500">
                <UIcon name="i-lucide-star" class="h-4 w-4 fill-current" />
                <span>{{ topic.rating }}</span>
              </div>
            </div>
            <h4 class="mt-4 font-semibold text-card-foreground">
              {{ topic.title }}
            </h4>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ topic.category }}
            </p>
            <div
              class="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <UIcon name="i-lucide-users" class="h-4 w-4" />
              <span>{{ topic.users.toLocaleString() }} studying</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommended Content -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-xl font-semibold text-foreground">
            Recommended for You
          </h3>
          <UButton variant="link" class="text-sm text-primary"
            >View All</UButton
          >
        </div>
        <div class="space-y-3">
          <div
            v-for="item in recommendedContent"
            :key="item.id"
            class="flex items-center justify-between rounded-lg border border-default bg-card p-5 hover:border-primary"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <UIcon name="i-lucide-book-open" class="h-6 w-6" />
              </div>
              <div>
                <h4 class="font-semibold text-card-foreground">
                  {{ item.title }}
                </h4>
                <div
                  class="mt-1 flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span class="rounded-full bg-muted px-2 py-0.5">{{
                    item.type
                  }}</span>
                  <span>•</span>
                  <span>{{ item.duration }}</span>
                  <span>•</span>
                  <span>{{ item.level }}</span>
                </div>
              </div>
            </div>
            <UButton class="flex items-center gap-2" color="primary">
              <span>Start</span>
              <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";

definePageMeta({
  layout: "dashboard",
});

const searchQuery = ref("");
const selectedCategory = ref("all");

const categories = [
  "All",
  "Mathematics",
  "Science",
  "History",
  "Languages",
  "Computer Science",
];

const trendingTopics = [
  {
    id: 1,
    title: "Quantum Mechanics",
    category: "Physics",
    users: 1234,
    rating: 4.8,
  },
  {
    id: 2,
    title: "Machine Learning Basics",
    category: "CS",
    users: 2456,
    rating: 4.9,
  },
  {
    id: 3,
    title: "World War II History",
    category: "History",
    users: 987,
    rating: 4.7,
  },
  {
    id: 4,
    title: "Calculus Integration",
    category: "Mathematics",
    users: 1876,
    rating: 4.6,
  },
];

const recommendedContent = [
  {
    id: 1,
    title: "Advanced Algebra Course",
    type: "Course",
    duration: "12 weeks",
    level: "Advanced",
  },
  {
    id: 2,
    title: "Biology Study Guide",
    type: "Guide",
    duration: "50 pages",
    level: "Intermediate",
  },
  {
    id: 3,
    title: "Chemistry Lab Experiments",
    type: "Lab",
    duration: "20 experiments",
    level: "Beginner",
  },
  {
    id: 4,
    title: "Spanish Grammar Masterclass",
    type: "Course",
    duration: "8 weeks",
    level: "All Levels",
  },
];
</script>
