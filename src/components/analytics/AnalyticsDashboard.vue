<script setup>
import { computed, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import KpiCard from '@/components/common/KpiCard.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getBaseTooltipStyle } from '@/utils/chartSetup'
import { PIPELINE_STAGES } from '@/utils/constants'
import { activeThemeMeta, scaledFontSize } from '@/utils/themeManager'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const { formatCurrency, formatCompactCurrency, formatShortDate } = useFormatters()

const timeWindow = ref('all')
const ownerFilter = ref('All')
const categoryFilter = ref('All Categories')

const timeOptions = [
  { label: 'All Recorded History', value: 'all' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Last 30 Days', value: '30d' }
]

const ownerOptions = computed(() => [
  { label: 'All Representatives', value: 'All' },
  ...store.users.map((u) => ({ label: u.name, value: u.id }))
])

const categoryOptions = computed(() => ['All Categories', ...store.settings.leadCategories])

const scopedLeads = computed(() => {
  const now = Date.now()
  const dayMs = 86_400_000
  const cutoff =
    timeWindow.value === '30d'
      ? now - 30 * dayMs
      : timeWindow.value === '90d'
        ? now - 90 * dayMs
        : 0

  return store.leads.filter((lead) => {
    if (
      store.permissions.canViewAllRecords &&
      ownerFilter.value !== 'All' &&
      lead.assignedTo !== ownerFilter.value
    ) {
      return false
    }
    if (categoryFilter.value !== 'All Categories' && categoryFilter.value !== 'All') {
      if (lead.category !== categoryFilter.value) return false
    }
    if (cutoff > 0) {
      const createdTs = new Date(`${lead.createdAt}T12:00:00`).getTime()
      if (createdTs < cutoff) return false
    }
    return true
  })
})

function resetAnalyticsFilters() {
  timeWindow.value = 'all'
  ownerFilter.value = 'All'
  categoryFilter.value = 'All Categories'
}

const summary = computed(() => {
  const total = scopedLeads.value.length
  const qualifiedStages = ['Qualified', 'Proposal', 'Negotiation']
  const qualified = scopedLeads.value.filter((l) => qualifiedStages.includes(l.status)).length
  const won = scopedLeads.value.filter((l) => l.status === 'Won')
  const lost = scopedLeads.value.filter((l) => l.status === 'Lost')

  const wonValue = won.reduce((s, l) => s + (Number(l.dealValue) || 0), 0)
  const pipelineValue = scopedLeads.value
    .filter((l) => l.status !== 'Won' && l.status !== 'Lost')
    .reduce((s, l) => s + (Number(l.dealValue) || 0), 0)

  const conversionRate = total > 0 ? Math.round((won.length / total) * 1000) / 10 : 0
  const closedCount = won.length + lost.length
  const winRate = closedCount > 0 ? Math.round((won.length / closedCount) * 1000) / 10 : 0

  return {
    total,
    qualified,
    wonCount: won.length,
    lostCount: lost.length,
    wonValue,
    pipelineValue,
    conversionRate,
    winRate
  }
})

const monthlySeries = computed(() => {
  const anchor = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    months.push({ key, label, leads: 0, won: 0 })
  }
  const map = new Map(months.map((m, idx) => [m.key, idx]))
  for (const lead of scopedLeads.value) {
    const idx = map.get(lead.createdAt?.slice(0, 7))
    if (idx !== undefined) {
      months[idx].leads += 1
      if (lead.status === 'Won') months[idx].won += 1
    }
  }
  return months
})

const monthlyChartData = computed(() => ({
  labels: monthlySeries.value.map((m) => m.label),
  datasets: [
    {
      label: 'Total Leads',
      data: monthlySeries.value.map((m) => m.leads),
      borderColor: activeThemeMeta.value.hex,
      backgroundColor: activeThemeMeta.value.hexMuted,
      fill: true,
      tension: 0.32,
      borderWidth: 2.25,
      pointRadius: 4
    },
    {
      label: 'Deals Won',
      data: monthlySeries.value.map((m) => m.won),
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.08)',
      fill: false,
      tension: 0.32,
      borderWidth: 2.1,
      pointRadius: 4
    }
  ]
}))

const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { usePointStyle: true, boxWidth: 8, font: { size: scaledFontSize(11) } }
    },
    tooltip: { ...getBaseTooltipStyle() }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: scaledFontSize(11) } }, border: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, font: { size: scaledFontSize(11) } },
      grid: { color: '#f1f5f9' },
      border: { display: false }
    }
  }
}))

const pipelineDist = computed(() => {
  const scale = activeThemeMeta.value.chartScale
  return PIPELINE_STAGES.map((stage, index) => {
    const list = scopedLeads.value.filter((l) => l.status === stage)
    const color =
      stage === 'Won'
        ? '#059669'
        : stage === 'Lost'
          ? '#94a3b8'
          : scale[index % (scale.length - 1)]
    return {
      stage,
      count: list.length,
      value: list.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0),
      color
    }
  })
})

const pipelineChartData = computed(() => ({
  labels: pipelineDist.value.map((p) => p.stage),
  datasets: [
    {
      label: 'Stage Deal Value (USD)',
      data: pipelineDist.value.map((p) => p.value),
      backgroundColor: pipelineDist.value.map((p) => p.color),
      borderRadius: 5,
      maxBarThickness: 28
    }
  ]
}))

const pipelineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...getBaseTooltipStyle(),
      callbacks: {
        label: (ctx) => {
          const item = pipelineDist.value[ctx.dataIndex]
          return ` $${(Number(ctx.raw) || 0).toLocaleString()} (${item?.count ?? 0} leads)`
        }
      }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: scaledFontSize(11) } }, border: { display: false } },
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: scaledFontSize(11) },
        callback: (v) => `$${Math.round(Number(v) / 1000)}k`
      },
      grid: { color: '#f1f5f9' },
      border: { display: false }
    }
  }
}))

const sourcePerformance = computed(() => {
  const map = new Map()
  for (const l of scopedLeads.value) {
    const src = l.source || 'Other'
    const entry = map.get(src) ?? { total: 0, won: 0, value: 0 }
    entry.total += 1
    if (l.status === 'Won') {
      entry.won += 1
      entry.value += Number(l.dealValue) || 0
    }
    map.set(src, entry)
  }
  return Array.from(map.entries())
    .map(([source, stats]) => ({
      source,
      ...stats,
      convRate: stats.total > 0 ? Math.round((stats.won / stats.total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.total - a.total)
})

const sourceChartData = computed(() => ({
  labels: sourcePerformance.value.map((s) => s.source),
  datasets: [
    {
      label: 'Total Leads',
      data: sourcePerformance.value.map((s) => s.total),
      backgroundColor: activeThemeMeta.value.hex,
      borderRadius: 5,
      maxBarThickness: 22
    },
    {
      label: 'Won Deals',
      data: sourcePerformance.value.map((s) => s.won),
      backgroundColor: '#059669',
      borderRadius: 5,
      maxBarThickness: 22
    }
  ]
}))

const sourceChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { usePointStyle: true, boxWidth: 8, font: { size: scaledFontSize(11) } }
    },
    tooltip: {
      ...getBaseTooltipStyle(),
      callbacks: {
        afterBody: (items) => {
          const idx = items[0]?.dataIndex ?? 0
          const row = sourcePerformance.value[idx]
          if (!row) return ''
          return `Conversion: ${row.convRate}% · Won Value: $${row.value.toLocaleString()}`
        }
      }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: scaledFontSize(11) } }, border: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, font: { size: scaledFontSize(11) } },
      grid: { color: '#f1f5f9' },
      border: { display: false }
    }
  }
}))

const regionalPerformance = computed(() => {
  const map = new Map()
  for (const l of scopedLeads.value) {
    const st = l.state || 'Other'
    const entry = map.get(st) ?? { wonVal: 0, openVal: 0, totalCount: 0 }
    entry.totalCount += 1
    if (l.status === 'Won') entry.wonVal += Number(l.dealValue) || 0
    else if (l.status !== 'Lost') entry.openVal += Number(l.dealValue) || 0
    map.set(st, entry)
  }
  return Array.from(map.entries())
    .map(([state, d]) => ({ state, ...d }))
    .sort((a, b) => b.wonVal + b.openVal - (a.wonVal + a.openVal))
    .slice(0, 7)
})

const regionalChartData = computed(() => ({
  labels: regionalPerformance.value.map((r) => r.state),
  datasets: [
    {
      label: 'Won Revenue',
      data: regionalPerformance.value.map((r) => r.wonVal),
      backgroundColor: '#059669',
      borderRadius: 5,
      maxBarThickness: 22
    },
    {
      label: 'Active Pipeline',
      data: regionalPerformance.value.map((r) => r.openVal),
      backgroundColor: activeThemeMeta.value.chartScale[2] ?? '#60a5fa',
      borderRadius: 5,
      maxBarThickness: 22
    }
  ]
}))

const regionalChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { usePointStyle: true, boxWidth: 8, font: { size: scaledFontSize(11) } }
    },
    tooltip: {
      ...getBaseTooltipStyle(),
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: $${(Number(ctx.raw) || 0).toLocaleString()}`
      }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: scaledFontSize(11) } }, border: { display: false } },
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: scaledFontSize(11) },
        callback: (v) => `$${Math.round(Number(v) / 1000)}k`
      },
      grid: { color: '#f1f5f9' },
      border: { display: false }
    }
  }
}))

const employeeStats = computed(() => {
  return store.users
    .map((user) => {
      const assigned = scopedLeads.value.filter((l) => l.assignedTo === user.id)
      const won = assigned.filter((l) => l.status === 'Won')
      const qualified = assigned.filter((l) =>
        ['Qualified', 'Proposal', 'Negotiation'].includes(l.status)
      )
      const wonRevenue = won.reduce((s, l) => s + (Number(l.dealValue) || 0), 0)
      const activeValue = assigned
        .filter((l) => l.status !== 'Won' && l.status !== 'Lost')
        .reduce((s, l) => s + (Number(l.dealValue) || 0), 0)
      const convRate =
        assigned.length > 0 ? Math.round((won.length / assigned.length) * 1000) / 10 : 0

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        avatarColor: user.avatarColor,
        totalLeads: assigned.length,
        qualifiedCount: qualified.length,
        wonCount: won.length,
        wonRevenue,
        activeValue,
        convRate
      }
    })
    .sort((a, b) => b.wonRevenue - a.wonRevenue || b.activeValue - a.activeValue)
})

const employeeChartData = computed(() => ({
  labels: employeeStats.value.map((e) => e.name.split(' ')[0]),
  datasets: [
    {
      label: 'Won Value',
      data: employeeStats.value.map((e) => e.wonRevenue),
      backgroundColor: activeThemeMeta.value.hex,
      borderRadius: 5,
      maxBarThickness: 24
    },
    {
      label: 'Open Pipeline',
      data: employeeStats.value.map((e) => e.activeValue),
      backgroundColor: '#cbd5e1',
      borderRadius: 5,
      maxBarThickness: 24
    }
  ]
}))

const sortedWorkerDeals = computed(() =>
  [...scopedLeads.value].sort((a, b) => (Number(b.dealValue) || 0) - (Number(a.dealValue) || 0))
)
</script>

<template>
  <div class="space-y-6">
    <div class="crm-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <Select
          v-model="timeWindow"
          :options="timeOptions"
          option-label="label"
          option-value="value"
          size="small"
          class="!text-xs w-52"
        />

        <Select
          v-if="store.permissions.canViewAllRecords"
          v-model="ownerFilter"
          :options="ownerOptions"
          option-label="label"
          option-value="value"
          size="small"
          class="!text-xs w-48"
        />

        <Select
          v-model="categoryFilter"
          :options="categoryOptions"
          size="small"
          class="!text-xs w-48"
        />

        <Button
          v-if="
            timeWindow !== 'all' ||
            ownerFilter !== 'All' ||
            (categoryFilter !== 'All Categories' && categoryFilter !== 'All')
          "
          label="Reset"
          icon="pi pi-filter-slash"
          text
          severity="secondary"
          size="small"
          class="!text-xs"
          @click="resetAnalyticsFilters"
        />
      </div>

      <div class="flex items-center gap-2 text-[0.6875rem] text-slate-500">
        <i class="pi pi-info-circle text-slate-400" />
        <span>
          <strong>Conversion</strong> = Won ÷ Total Leads · Closed win rate:
          <strong class="text-slate-700">{{ summary.winRate }}%</strong>
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <KpiCard
        :label="store.permissions.isWorker ? 'My Leads' : 'Total Leads'"
        :value="summary.total"
        :sub-value="`${formatCompactCurrency(summary.pipelineValue)} open`"
        icon="pi pi-users"
        accent-bg="bg-blue-50"
        accent-text="text-blue-600"
      />
      <KpiCard
        label="Qualified Funnel"
        :value="summary.qualified"
        sub-value="Mid & late stages"
        icon="pi pi-filter"
        accent-bg="bg-sky-50"
        accent-text="text-sky-600"
      />
      <KpiCard
        label="Won / Lost"
        :value="`${summary.wonCount} / ${summary.lostCount}`"
        :sub-value="`${summary.winRate}% win rate`"
        icon="pi pi-arrows-h"
        accent-bg="bg-slate-100"
        accent-text="text-slate-700"
      />
      <KpiCard
        label="Won Value"
        :value="formatCompactCurrency(summary.wonValue)"
        :sub-value="formatCurrency(summary.wonValue)"
        icon="pi pi-dollar"
        accent-bg="bg-emerald-50"
        accent-text="text-emerald-600"
      />
      <KpiCard
        label="Conversion"
        :value="`${summary.conversionRate}%`"
        :sub-value="`${summary.wonCount} of ${summary.total} leads`"
        icon="pi pi-percentage"
        accent-bg="bg-amber-50"
        accent-text="text-amber-600"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard
        title="Monthly Lead & Conversion Trends"
        subtitle="New leads captured vs. closed-won deals per month"
        :is-empty="scopedLeads.length === 0"
      >
        <Line :data="monthlyChartData" :options="lineChartOptions" />
      </ChartCard>

      <ChartCard
        title="Pipeline Value Distribution"
        subtitle="Total USD value standing in each sales stage"
        :is-empty="scopedLeads.length === 0"
      >
        <Bar :data="pipelineChartData" :options="pipelineChartOptions" />
      </ChartCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard
        title="Lead Source Performance"
        subtitle="Channel volume vs. closed-won conversion"
        :is-empty="scopedLeads.length === 0"
      >
        <Bar :data="sourceChartData" :options="sourceChartOptions" />
      </ChartCard>

      <ChartCard
        title="Regional Revenue & Pipeline"
        subtitle="Closed-won value vs. open pipeline across top states"
        :is-empty="scopedLeads.length === 0"
      >
        <Bar :data="regionalChartData" :options="regionalChartOptions" />
      </ChartCard>
    </div>

    <div v-if="store.permissions.canViewAllRecords" class="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <div class="xl:col-span-5">
        <ChartCard
          title="Representative Revenue Mix"
          subtitle="Won revenue vs. active open pipeline per rep"
          :is-empty="scopedLeads.length === 0"
          height-class="h-80"
        >
          <Bar :data="employeeChartData" :options="regionalChartOptions" />
        </ChartCard>
      </div>

      <div class="xl:col-span-7 crm-card overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100">
          <h3 class="text-sm font-semibold text-slate-900">Employee Performance Leaderboard</h3>
          <p class="mt-0.5 text-xs text-slate-500">
            Ranked by closed-won revenue across assigned territories
          </p>
        </div>

        <DataTable :value="employeeStats" data-key="id" responsive-layout="scroll" class="crm-table">
          <Column header="Employee">
            <template #body="{ data }">
              <div class="flex items-center gap-2.5 min-w-[8.75rem]">
                <UserAvatar :name="data.name" :color="data.avatarColor" small />
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-slate-900 truncate">{{ data.name }}</p>
                  <p class="text-[0.6875rem] text-slate-400 truncate">{{ data.role }}</p>
                </div>
              </div>
            </template>
          </Column>

          <Column field="totalLeads" header="Leads" sortable>
            <template #body="{ data }">
              <span class="text-xs font-medium tabular-nums">{{ data.totalLeads }}</span>
            </template>
          </Column>

          <Column field="wonCount" header="Won" sortable>
            <template #body="{ data }">
              <StatusTag :value="`${data.wonCount} Won`" variant="stage" />
            </template>
          </Column>

          <Column field="convRate" header="Rate" sortable>
            <template #body="{ data }">
              <span class="text-xs font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                {{ data.convRate }}%
              </span>
            </template>
          </Column>

          <Column field="wonRevenue" header="Won Value" sortable>
            <template #body="{ data }">
              <span class="text-xs font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                {{ formatCurrency(data.wonRevenue) }}
              </span>
            </template>
          </Column>

          <Column field="activeValue" header="Pipeline" sortable>
            <template #body="{ data }">
              <span class="text-xs text-slate-600 tabular-nums whitespace-nowrap">
                {{ formatCompactCurrency(data.activeValue) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <div v-else class="crm-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">
            My Portfolio Opportunities Ranked by Value
          </h3>
          <p class="mt-0.5 text-xs text-slate-500">
            Click any opportunity to log call activity, update follow-ups, or advance pipeline stage.
          </p>
        </div>
        <span class="text-xs font-semibold text-slate-500 tabular-nums">
          {{ sortedWorkerDeals.length }} deals
        </span>
      </div>

      <DataTable :value="sortedWorkerDeals" data-key="id" responsive-layout="scroll" class="crm-table">
        <Column field="name" header="Opportunity" sortable>
          <template #body="{ data }">
            <button
              type="button"
              class="text-left cursor-pointer group"
              @click="store.openLeadDetailDrawer(data.id)"
            >
              <p class="text-xs font-semibold text-slate-900 group-hover:underline">
                {{ data.name }}
              </p>
              <p class="text-[0.6875rem] text-slate-500">{{ data.company }} · {{ data.state }}</p>
            </button>
          </template>
        </Column>

        <Column field="source" header="Source" sortable>
          <template #body="{ data }">
            <span class="text-xs text-slate-600">{{ data.source }}</span>
          </template>
        </Column>

        <Column field="status" header="Stage" sortable>
          <template #body="{ data }">
            <StatusTag :value="data.status" variant="stage" />
          </template>
        </Column>

        <Column field="priority" header="Priority" sortable>
          <template #body="{ data }">
            <StatusTag :value="data.priority" variant="priority" />
          </template>
        </Column>

        <Column field="dealValue" header="Deal Value" sortable>
          <template #body="{ data }">
            <span class="text-xs font-bold text-slate-900 tabular-nums">
              {{ formatCurrency(data.dealValue) }}
            </span>
          </template>
        </Column>

        <Column field="nextFollowUp" header="Next Follow-up" sortable>
          <template #body="{ data }">
            <span class="text-xs text-slate-600 tabular-nums">
              {{ data.nextFollowUp ? formatShortDate(data.nextFollowUp) : '—' }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
