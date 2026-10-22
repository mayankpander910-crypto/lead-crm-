<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import ChartCard from '@/components/common/ChartCard.vue'
import { BASE_TOOLTIP_STYLE } from '@/utils/chartSetup'
import { PIPELINE_STAGES } from '@/utils/constants'
import { activeThemeMeta } from '@/utils/themeManager'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()

const stageSummary = computed(() => {
  const scale = activeThemeMeta.value.chartScale
  return PIPELINE_STAGES.map((stage, index) => {
    const matching = store.leads.filter((l) => l.status === stage)
    const totalValue = matching.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
    const color =
      stage === 'Won'
        ? '#059669'
        : stage === 'Lost'
          ? '#94a3b8'
          : scale[index % (scale.length - 1)]

    return {
      stage,
      count: matching.length,
      value: totalValue,
      color
    }
  })
})

const chartData = computed(() => ({
  labels: stageSummary.value.map((s) => s.stage),
  datasets: [
    {
      label: 'Leads',
      data: stageSummary.value.map((s) => s.count),
      backgroundColor: stageSummary.value.map((s) => s.color),
      borderRadius: 5,
      barThickness: 16
    }
  ]
}))

const chartOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...BASE_TOOLTIP_STYLE,
      callbacks: {
        afterBody: (items) => {
          const idx = items[0]?.dataIndex ?? 0
          const val = stageSummary.value[idx]?.value ?? 0
          return `Stage Value: $${val.toLocaleString()}`
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { precision: 0, color: '#64748b', font: { size: 11 } },
      grid: { color: '#f1f5f9' },
      border: { display: false }
    },
    y: {
      grid: { display: false },
      ticks: { color: '#334155', font: { size: 11, weight: 500 } },
      border: { display: false }
    }
  }
}))
</script>

<template>
  <ChartCard
    title="Sales Pipeline Stages"
    subtitle="Active deal count across funnel stages (hover for stage USD value)"
    :is-empty="store.leads.length === 0"
  >
    <Bar :data="chartData" :options="chartOptions" />
  </ChartCard>
</template>
