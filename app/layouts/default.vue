<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Home",
    to: "/",
    icon: "i-lucide-home",
    active: route.path === "/",
  },
  {
    label: "About",
    to: "/about",
    icon: "i-lucide-box",
    active: route.path === "/about",
  },
  {
    label: "Figma",
    icon: "i-simple-icons-figma",
    to: "https://go.nuxt.com/figma-ui",
    target: "_blank",
  },
  {
    label: "Releases",
    icon: "i-lucide-rocket",
    to: "https://github.com/nuxt/ui/releases",
    target: "_blank",
  },
]);
</script>

<template>
  <UMain>
    <UHeader>
      <template #title>
        <UButton
          color="neutral"
          variant="ghost"
          to="/"
          icon="i-simple-icons-nuxtdotjs"
          aria-label="Nuxt UI Home"
        />
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UColorModeButton />

        <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
          <UButton
            color="neutral"
            variant="ghost"
            to="https://github.com/nuxt/ui"
            target="_blank"
            icon="i-simple-icons-github"
            aria-label="GitHub"
          />
        </UTooltip>
      </template>

      <template #body>
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>
    <UContainer as="main" class="my-8">
      <slot />
    </UContainer>
  </UMain>
</template>
