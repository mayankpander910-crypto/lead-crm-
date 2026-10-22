<script setup>
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import ChartCard from '@/components/common/ChartCard.vue'
import { BASE_TOOLTIP_STYLE } from '@/utils/chartSetup'
import { activeThemeMeta } from '@/utils/themeManager'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const granularity = ref('monthly')

const bucketedSeries = computed(() => {
  if (store.leads.length === 0) {
    return { labels: [], counts: [], values: [] }
  }

  if (granularity.value === 'monthly') {
    const anchor = new Date()
    const months = []

    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      months.push({ key, label, count: 0, value: 0 })
    }

    const indexMap = new Map(months.map((m, idx) => [m.key, idx]))
    for (const lead of store.leads) {
      const ym = lead.createdAt?.slice(0, 7)
      const idx = ym ? indexMap.get(ym) : undefined
      if (idx !== undefined) {
        months[idx].count += 1
        months[idx].value += Number(lead.dealValue) || 0
      }
    }

    return {
      labels: months.map((m) => m.label),
      counts: months.map((m) => m.count),
      values: months.map((m) => m.value)
    }
  }

  const now = new Date()
  const dayMs = 86_400_000
  const buckets = []

  for (let i = 5; i >= 0; i--) {
    const end = now.getTime() - i * 14 * dayMs
    const start = end - 14 * dayMs
    const dEnd = new Date(end)
    buckets.push({
      label: dEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      start,
      end,
      count: 0,
      value: 0
    })
  }

  for (const lead of store.leads) {
    const ts = new Date(`${lead.createdAt}T12:00:00`).getTime()
    for (const b of buckets) {
      if (ts > b.start && ts <= b.end + dayMs) {
        b.count += 1
        b.value += Number(lead.dealValue) || 0
        break
      }
    }
  }

  return {
    labels: buckets.map((b) => b.label),
    counts: buckets.map((b) => b.count),
    values: buckets.map((b) => b.value)
  }
})

const chartData = computed(() => ({
  labels: bucketedSeries.value.labels,
  datasets: [
    {
      label: 'New Leads',
      data: bucketedSeries.value.counts,
      borderColor: activeThemeMeta.value.hex,
      backgroundColor: activeThemeMeta.value.hexMuted,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: activeThemeMeta.value.hex,
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.25,
      fill: true,
      tension: 0.32
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...BASE_TOOLTIP_STYLE,
      callbacks: {
        afterBody: (items) => {
          const idx = items[0]?.dataIndex ?? 0
          const val = bucketedSeries.value.values[idx] ?? 0
          return `Pipeline Added: $${val.toLocaleString()}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 11 } },
      border: { display: false }
    },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 2, precision: 0, color: '#64748b', font: { size: 11 } },
      grid: { color: '#f1f5f9' },
      border: { display: false }
    }
  }
}))
</script>

<template>
  <ChartCard
    title="Lead Creation Trend"
    subtitle="Monthly acquisition velocity across active territories"
    :is-empty="store.leads.length === 0"
  >
    <template #actions>
      <div class="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
        <button
          type="button"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer"
          :class="
            granularity === 'monthly'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="granularity = 'monthly'"
        >
          Monthly
        </button>
        <button
          type="button"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer"
          :class="
            granularity === 'biweekly'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="granularity = 'biweekly'"
        >
          Bi-weekly
        </button>
      </div>
    </template>

    <Line :data="chartData" :options="chartOptions" />
  </ChartCard>
</template>
