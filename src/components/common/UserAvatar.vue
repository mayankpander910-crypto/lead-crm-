<script setup>
import { computed } from 'vue'
import Avatar from 'primevue/avatar'
import { useFormatters } from '@/composables/useFormatters'

const props = defineProps({
  name: { type: String, required: true },
  color: { type: String, default: '#2563eb' },
  size: { type: String, default: 'normal' },
  small: { type: Boolean, default: false }
})

const { getInitials } = useFormatters()
const initials = computed(() => getInitials(props.name))
</script>

<template>
  <Avatar
    :label="initials"
    shape="circle"
    :size="size"
    class="font-semibold select-none shrink-0"
    :class="small ? '!w-7 !h-7 !text-[0.6875rem]' : '!text-xs'"
    :style="{
      backgroundColor: `${color}16`,
      color: color,
      border: `1px solid ${color}30`
    }"
  />
</template>
