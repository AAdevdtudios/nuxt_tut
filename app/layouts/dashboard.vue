<template>
  <UDashboardGroup layout="sidebar">
    <DashboardSidebar />
    <UDashboardPanel
      :ui="{
        body: 'p-0 md:p-6',
      }"
    >
      <template #header>
        <DashboardNavBar />
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
