<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import ChartCard from '@/components/common/ChartCard.vue'
import { getBaseTooltipStyle } from '@/utils/chartSetup'
import { activeThemeMeta, scaledFontSize } from '@/utils/themeManager'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()

const regionalStats = computed(() => {
  const byState = new Map()
  for (const lead of store.leads) {
    const state = lead.state || 'Other'
    const existing = byState.get(state) ?? { count: 0, value: 0 }
    existing.count += 1
    existing.value += Number(lead.dealValue) || 0
    byState.set(state, existing)
  }

  return Array.from(byState.entries())
    .map(([state, data]) => ({ state, ...data }))
    .sort((a, b) => b.count - a.count || b.value - a.value)
    .slice(0, 8)
})

const chartData = computed(() => ({
  labels: regionalStats.value.map((r) => r.state),
  datasets: [
    {
      label: 'Leads',
      data: regionalStats.value.map((r) => r.count),
      backgroundColor: activeThemeMeta.value.hex,
      hoverBackgroundColor: activeThemeMeta.value.hexHover,
      borderRadius: 5,
      maxBarThickness: 28
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...getBaseTooltipStyle(),
      callbacks: {
        afterBody: (items) => {
          const idx = items[0]?.dataIndex ?? 0
          const val = regionalStats.value[idx]?.value ?? 0
          return `Total Value: $${val.toLocaleString()}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#475569', font: { size: scaledFontSize(11) } },
      border: { display: false }
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: '#64748b', font: { size: scaledFontSize(11) } },
      grid: { color: '#f1f5f9' },
      border: { display: false }
    }
  }
}))
</script>

<template>
  <ChartCard
    title="Regional Distribution"
    subtitle="Top US territories ranked by active lead count"
    :is-empty="store.leads.length === 0"
  >
    <Bar :data="chartData" :options="chartOptions" />
  </ChartCard>
</template>
