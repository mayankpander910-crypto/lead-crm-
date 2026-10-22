<script setup>
import Button from 'primevue/button'

defineProps({
  icon: { type: String, default: 'pi pi-inbox' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  actionIcon: { type: String, default: 'pi pi-plus' },
  compact: { type: Boolean, default: false }
})

defineEmits(['action'])
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center px-6"
    :class="compact ? 'py-8' : 'py-14'"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200/70"
    >
      <i :class="[icon, 'text-lg']" />
    </div>
    <h4 class="mt-3.5 text-sm font-semibold text-slate-900">{{ title }}</h4>
    <p v-if="description" class="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
      {{ description }}
    </p>
    <div v-if="actionLabel" class="mt-4">
      <Button
        :label="actionLabel"
        :icon="actionIcon"
        size="small"
        @click="$emit('action')"
      />
    </div>
  </div>
</template>
