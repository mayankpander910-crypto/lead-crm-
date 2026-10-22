<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import ChartCard from '@/components/common/ChartCard.vue'
import { getBaseTooltipStyle } from '@/utils/chartSetup'
import { activeThemeMeta, scaledFontSize } from '@/utils/themeManager'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()

const sourceBreakdown = computed(() => {
  const counts = new Map()
  for (const src of store.settings.leadSources) {
    counts.set(src, 0)
  }
  for (const lead of store.leads) {
    const key = lead.source || 'Other'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const scale = activeThemeMeta.value.chartScale
  return Array.from(counts.entries())
    .map(([source, count], index) => ({
      source,
      count,
      color: scale[index % scale.length]
    }))
    .filter((item) => item.count > 0 || store.settings.leadSources.includes(item.source))
})

const chartData = computed(() => ({
  labels: sourceBreakdown.value.map((s) => s.source),
  datasets: [
    {
      data: sourceBreakdown.value.map((s) => s.count),
      backgroundColor: sourceBreakdown.value.map((s) => s.color),
      borderColor: '#ffffff',
      borderWidth: 2.5,
      hoverOffset: 5
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 14,
        color: '#334155',
        font: { size: scaledFontSize(11), weight: 500 }
      }
    },
    tooltip: {
      ...getBaseTooltipStyle(),
      callbacks: {
        label: (ctx) => {
          const val = Number(ctx.raw) || 0
          const total = store.leads.length || 1
          const pct = Math.round((val / total) * 1000) / 10
          return ` ${ctx.label}: ${val} leads (${pct}%)`
        }
      }
    }
  }
}))
</script>

<template>
  <ChartCard
    title="Lead Sources"
    subtitle="Channel attribution share across inbound & outbound sources"
    :is-empty="store.leads.length === 0"
  >
    <div class="relative h-full w-full flex items-center justify-center">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </ChartCard>
</template>
