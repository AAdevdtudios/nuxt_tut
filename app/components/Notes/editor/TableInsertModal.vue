<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  rows: number;
  cols: number;
  withHeaderRow: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:rows": [value: number];
  "update:cols": [value: number];
  "update:withHeaderRow": [value: boolean];
  submit: [];
}>();
</script>

<template>
  <UModal
    :open="props.open"
    title="Insert table"
    @update:open="(value) => emit('update:open', value)"
  >
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Rows">
            <UInputNumber
              :model-value="props.rows"
              :min="1"
              :max="20"
              @update:model-value="(value) => emit('update:rows', Number(value) || 1)"
            />
          </UFormField>
          <UFormField label="Columns">
            <UInputNumber
              :model-value="props.cols"
              :min="1"
              :max="10"
              @update:model-value="(value) => emit('update:cols', Number(value) || 1)"
            />
          </UFormField>
        </div>

        <div class="flex items-center justify-between rounded-lg border border-default p-3">
          <span class="text-sm">Header row</span>
          <USwitch
            :model-value="props.withHeaderRow"
            @update:model-value="(value) => emit('update:withHeaderRow', Boolean(value))"
          />
        </div>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" variant="outline" color="neutral" @click="emit('update:open', false)" />
          <UButton label="Insert table" color="primary" icon="i-lucide-table-2" @click="emit('submit')" />
        </div>
      </div>
    </template>
  </UModal>
</template>
