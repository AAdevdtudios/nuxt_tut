<template>
  <UDashboardGroup class="top-15">
    <NotesWorkspaceSidebar />

    <UDashboardPanel
      :ui="{
        root: 'min-h-[calc(100dvh-60px)]',
        body: 'p-0',
      }"
    >
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
