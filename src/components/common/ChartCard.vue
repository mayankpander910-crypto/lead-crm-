<script setup>
import Card from 'primevue/card'
import EmptyState from './EmptyState.vue'
import { useCrmStore } from '@/stores/crmStore'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  isEmpty: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'No records match the selected filters yet.' },
  heightClass: { type: String, default: 'h-72' }
})

const store = useCrmStore()
</script>

<template>
  <Card
    class="!bg-white !border !border-slate-200 !rounded-xl !shadow-none overflow-hidden"
    :pt="{
      body: { class: '!p-5 flex flex-col gap-4 h-full' },
      content: { class: '!p-0 flex-1 flex flex-col justify-center' }
    }"
  >
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-2 px-5 pt-5">
        <div>
          <h3 class="text-sm font-semibold text-slate-900 leading-snug">{{ title }}</h3>
          <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </template>

    <template #content>
      <EmptyState
        v-if="isEmpty"
        icon="pi pi-chart-bar"
        title="No chart data available"
        :description="emptyMessage"
        compact
      />
      <div v-else :key="store.settings.textSize" class="relative w-full" :class="heightClass">
        <slot />
      </div>
    </template>
  </Card>
</template>
