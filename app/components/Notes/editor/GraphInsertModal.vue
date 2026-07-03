<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  type: "bar" | "line";
  labels: string;
  values: string;
  chartTypeItems: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:title": [value: string];
  "update:type": [value: "bar" | "line"];
  "update:labels": [value: string];
  "update:values": [value: string];
  submit: [];
}>();
</script>

<template>
  <UModal :open="props.open" title="Insert chart" @update:open="(value) => emit('update:open', value)">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Title">
          <UInput
            :model-value="props.title"
            placeholder="Weekly Progress"
            @update:model-value="(value) => emit('update:title', String(value || ''))"
          />
        </UFormField>

        <UFormField label="Chart type">
          <USelect
            :model-value="props.type"
            :items="props.chartTypeItems"
            value-key="value"
            class="w-full"
            @update:model-value="(value) => emit('update:type', (value as 'bar' | 'line') || 'bar')"
          />
        </UFormField>

        <UFormField label="Labels (comma separated)">
          <UInput
            :model-value="props.labels"
            placeholder="Mon, Tue, Wed"
            @update:model-value="(value) => emit('update:labels', String(value || ''))"
          />
        </UFormField>

        <UFormField label="Values (comma separated)">
          <UInput
            :model-value="props.values"
            placeholder="45, 62, 70"
            @update:model-value="(value) => emit('update:values', String(value || ''))"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" variant="outline" color="neutral" @click="emit('update:open', false)" />
          <UButton label="Insert chart" color="primary" icon="i-lucide-chart-column-big" @click="emit('submit')" />
        </div>
      </div>
    </template>
  </UModal>
</template>
