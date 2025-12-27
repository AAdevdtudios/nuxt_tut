<template>
  <UDashboardGroup layout="sidebar">
    <DashboardSidebar />
    <UDashboardPanel>
      <template #header>
        <DashboardNavBar />
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
