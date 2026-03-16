import { defineNuxtRouteMiddleware, navigateTo } from "#app";

const deprecatedRoutes: Record<string, string> = {
  "/dashboard/ai_chat": "ai-chat",
  "/dashboard/question_generator": "question-generator",
};

export default defineNuxtRouteMiddleware((to) => {
  const feature = deprecatedRoutes[to.path];

  if (!feature) {
    return;
  }

  return navigateTo({
    path: "/dashboard/projects",
    query: {
      deprecated: feature,
    },
  });
});
