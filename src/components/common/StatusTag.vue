<script setup>
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { PRIORITY_META, STAGE_META } from '@/utils/constants'

const props = defineProps({
  value: { type: String, required: true },
  variant: { type: String, default: 'stage' }
})

const severity = computed(() => {
  if (props.variant === 'stage') {
    const meta = STAGE_META[props.value]
    return meta?.severity ?? 'info'
  }
  if (props.variant === 'priority') {
    const meta = PRIORITY_META[props.value]
    return meta?.severity ?? 'secondary'
  }
  if (props.variant === 'task') {
    if (props.value === 'Completed') return 'success'
    if (props.value === 'Overdue') return 'danger'
    return 'info'
  }
  if (props.variant === 'role') {
    if (props.value === 'Admin') return 'contrast'
    if (props.value === 'Sales Manager') return 'info'
    return 'secondary'
  }
  if (props.variant === 'userStatus') {
    return props.value === 'Active' ? 'success' : 'warn'
  }
  return 'secondary'
})

const dotColor = computed(() => {
  if (props.variant === 'stage') {
    return STAGE_META[props.value]?.dotColor ?? '#2563eb'
  }
  return null
})
</script>

<template>
  <Tag :value="value" :severity="severity" rounded class="!text-xs !font-medium !px-2.5 !py-0.5 !whitespace-nowrap shrink-0">
    <template #icon>
      <span
        v-if="dotColor"
        class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
        :style="{ backgroundColor: dotColor }"
      />
    </template>
  </Tag>
</template>
