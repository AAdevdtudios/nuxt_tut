<template>
  <div class="features-page">
    <Head>
      <Title>Features - GapAi</Title>
    </Head>

    <NuxtLayout name="default">
      <div class="features-content">
        <div class="page-header">
          <h1>Powerful Features for Every Plan</h1>
          <p>Choose the right plan with the features you need</p>
        </div>

        <!-- Feature Categories -->
        <section class="features-section">
          <div class="category-filters">
            <button
              v-for="category in categories"
              :key="category"
              @click="selectedCategory = category"
              :class="{ active: selectedCategory === category }"
              class="filter-btn"
            >
              {{ category }}
            </button>
          </div>

          <div class="features-grid">
            <div
              v-for="feature in filteredFeatures"
              :key="feature.id"
              class="feature-card"
            >
              <div class="feature-header">
                <Icon :name="feature.icon" class="feature-icon" />
                <h3>{{ feature.name }}</h3>
              </div>
              <p class="feature-description">{{ feature.description }}</p>

              <div class="feature-availability">
                <div
                  v-for="plan in plans"
                  :key="plan.id"
                  class="plan-availability"
                >
                  <span class="plan-name">{{ plan.name }}</span>
                  <div
                    v-if="hasFeature(plan.id, feature.id)"
                    class="feature-badge available"
                  >
                    <Icon name="lucide:check" />
                    <span v-if="feature.limits && feature.limits[plan.id]">
                      {{ feature.limits[plan.id] }}
                    </span>
                  </div>
                  <div v-else class="feature-badge unavailable">
                    <Icon name="lucide:x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Comparison Table -->
        <section class="comparison-section">
          <h2>Full Feature Comparison</h2>
          <div class="comparison-table-wrapper">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th v-for="plan in plans" :key="plan.id" class="plan-column">
                    <div class="plan-header">
                      <span class="plan-name">{{ plan.name }}</span>
                      <span class="plan-price">£{{ plan.price }}/mo</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="feature in allFeatures" :key="feature.id">
                  <td class="feature-name">
                    <Icon :name="feature.icon" class="small-icon" />
                    {{ feature.name }}
                  </td>
                  <td v-for="plan in plans" :key="plan.id" class="center">
                    <template v-if="hasFeature(plan.id, feature.id)">
                      <Icon name="lucide:check" class="check-icon" />
                      <span
                        v-if="feature.limits && feature.limits[plan.id]"
                        class="limit"
                      >
                        {{ feature.limits[plan.id] }}
                      </span>
                    </template>
                    <Icon v-else name="lucide:x" class="x-icon" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
          <h2>Ready to get started?</h2>
          <p>Choose your plan and start learning today</p>
          <NuxtLink to="/billing" class="btn btn-primary">
            View Pricing
          </NuxtLink>
        </section>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { PRICING_PLANS, FEATURES } from "~/constants/features";
import type { Feature, PricingPlan } from "~/types/features.types";

useHead({
  title: "Features - GapAi",
});

const selectedCategory = ref<string>("All");
const plans = computed(() => PRICING_PLANS);
const allFeatures = computed(() => Object.values(FEATURES));
const categories = computed(() => {
  const cats = ["All", ...new Set(allFeatures.value.map((f) => f.category))];
  return cats.map((c) => {
    if (c === "starter") return "All";
    if (c === "pro") return "Pro & Up";
    if (c === "enterprise") return "Enterprise Only";
    return c;
  });
});

const filteredFeatures = computed(() => {
  if (selectedCategory.value === "All") {
    return allFeatures.value;
  }
  if (selectedCategory.value === "Pro & Up") {
    return allFeatures.value.filter((f) => f.category === "pro");
  }
  if (selectedCategory.value === "Enterprise Only") {
    return allFeatures.value.filter((f) => f.category === "enterprise");
  }
  return allFeatures.value;
});

const hasFeature = (planId: string, featureId: string): boolean => {
  const plan = plans.value.find((p) => p.id === planId);
  if (!plan) return false;
  return plan.features.some((f) => f.id === featureId);
};
</script>

<style scoped>
.features-page {
  min-height: 100vh;
  background: #f9fafb;
}

.features-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 60px;
}

.page-header h1 {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 18px;
  color: #6b7280;
}

/* Category Filters */
.category-filters {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
}

.filter-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.filter-btn:hover:not(.active) {
  border-color: #3b82f6;
  color: #3b82f6;
}

/* Features Section */
.features-section {
  margin-bottom: 80px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.1);
  transform: translateY(-5px);
}

.feature-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.feature-icon {
  width: 24px;
  height: 24px;
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.feature-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.feature-availability {
  display: grid;
  gap: 12px;
}

.plan-availability {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid #f3f4f6;
}

.plan-availability:first-child {
  border-top: none;
}

.plan-name {
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
}

.feature-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.feature-badge.available {
  color: #10b981;
  font-weight: 600;
}

.feature-badge.unavailable {
  color: #d1d5db;
}

.feature-badge :deep(svg) {
  width: 16px;
  height: 16px;
}

/* Comparison Section */
.comparison-section {
  margin: 80px 0;
}

.comparison-section h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 30px;
  color: #1f2937;
}

.comparison-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.comparison-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.comparison-table th {
  padding: 20px;
  text-align: left;
  font-weight: 600;
  color: #1f2937;
  border-right: 1px solid #e5e7eb;
}

.comparison-table th:last-child {
  border-right: none;
}

.plan-column {
  text-align: center;
}

.plan-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.plan-name {
  font-weight: 700;
  color: #1f2937;
}

.plan-price {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.comparison-table td {
  padding: 16px 20px;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #f3f4f6;
}

.comparison-table td:last-child {
  border-right: none;
}

.comparison-table tbody tr:hover {
  background: #f9fafb;
}

.feature-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #1f2937;
  background: white;
}

.small-icon {
  width: 16px;
  height: 16px;
  color: #3b82f6;
  flex-shrink: 0;
}

.center {
  text-align: center;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: #10b981;
}

.x-icon {
  width: 20px;
  height: 20px;
  color: #d1d5db;
}

.limit {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* CTA Section */
.cta-section {
  text-align: center;
  margin: 80px 0;
  padding: 60px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.cta-section h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  color: white;
}

.cta-section p {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.btn {
  display: inline-block;
  padding: 14px 32px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .comparison-table-wrapper {
    overflow-x: auto;
  }

  .comparison-table {
    font-size: 12px;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 12px 8px;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
