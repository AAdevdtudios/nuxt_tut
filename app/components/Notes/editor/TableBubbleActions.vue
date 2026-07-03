<script setup lang="ts">
type ButtonColor =
  | "error"
  | "success"
  | "primary"
  | "secondary"
  | "info"
  | "warning"
  | "neutral";

const props = defineProps<{
  visible: boolean;
  left: number;
  top: number;
  actions: { key: string; label: string; icon: string; color: ButtonColor }[];
}>();

const emit = defineEmits<{
  action: [key: string];
}>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.visible"
      class="pointer-events-auto fixed z-120 -translate-x-1/2 space-x-2 rounded-full border border-default bg-default/95 px-3 py-1 text-xs shadow-md backdrop-blur"
      :style="{ left: `${props.left}px`, top: `${props.top}px` }"
      @mousedown.stop
      @click.stop
    >
      <UTooltip
        v-for="action in props.actions"
        :key="action.key"
        :text="action.label"
        :delay="{ show: 500, hide: 0 }"
      >
        <UButton
          size="xs"
          variant="soft"
          :color="action.color"
          :icon="action.icon"
          @mousedown.prevent.stop
          @click="emit('action', action.key)"
        />
      </UTooltip>
    </div>
  </Teleport>
</template>
