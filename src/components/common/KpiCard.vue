<script setup>
import { useCrmStore } from '@/stores/crmStore'

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  subValue: { type: String, default: '' },
  icon: { type: String, required: true },
  accentBg: { type: String, default: 'bg-blue-50' },
  accentText: { type: String, default: 'text-blue-600' },
  trendPercent: { type: Number, default: null },
  trendLabel: { type: String, default: 'vs prior 30d' }
})

const store = useCrmStore()
</script>

<template>
  <div
    class="crm-card p-5 transition-all duration-150 hover:border-slate-300/90 hover:shadow-xs flex flex-col justify-between gap-3"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
          {{ label }}
        </p>
        <p class="mt-2 text-[1.65rem] font-bold tracking-tight text-slate-900 tabular-nums leading-none">
          {{ value }}
        </p>
        <p v-if="subValue" class="mt-2 text-xs text-slate-500 truncate tabular-nums">
          {{ subValue }}
        </p>
      </div>

      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5"
        :class="[accentBg, accentText]"
      >
        <i :class="[icon, 'text-sm']" />
      </div>
    </div>

    <div
      v-if="store.settings.showKpiTrends && trendPercent !== null && trendPercent !== undefined"
      class="pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs whitespace-nowrap"
    >
      <span
        class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
        :class="
          trendPercent >= 0
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
            : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'
        "
      >
        <i
          class="text-[10px]"
          :class="trendPercent >= 0 ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right'"
        />
        {{ trendPercent >= 0 ? '+' : '' }}{{ trendPercent }}%
      </span>
      <span class="text-slate-400 text-[11px]">{{ trendLabel }}</span>
    </div>
  </div>
</template>
