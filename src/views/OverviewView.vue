<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import KpiCard from '@/components/common/KpiCard.vue'
import LeadTrendChart from '@/components/dashboard/LeadTrendChart.vue'
import PipelineStageChart from '@/components/dashboard/PipelineStageChart.vue'
import LeadSourceChart from '@/components/dashboard/LeadSourceChart.vue'
import RegionalLeadsChart from '@/components/dashboard/RegionalLeadsChart.vue'
import RecentLeadsTable from '@/components/dashboard/RecentLeadsTable.vue'
import UpcomingFollowUps from '@/components/dashboard/UpcomingFollowUps.vue'
import RecentActivityTimeline from '@/components/dashboard/RecentActivityTimeline.vue'
import { activeThemeMeta } from '@/utils/themeManager'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const router = useRouter()
const { formatCurrency, formatCompactCurrency } = useFormatters()

const subtitleText = computed(() => {
  if (store.permissions.isAdmin) {
    return 'Organization-wide summary across all territories, sales representatives, and pipeline stages.'
  }
  if (store.permissions.isManager) {
    return 'Team oversight summary tracking multi-rep conversion velocity, deal stages, and scheduled follow-ups.'
  }
  return `Personal sales portal for ${store.currentUser.region} — tracking your assigned leads, pipeline deals, and daily tasks.`
})

const quotaPercent = computed(() => {
  const quota = store.currentUser.monthlyQuota || 150000
  const won = store.kpiMetrics.totalWonValue
  return Math.min(100, Math.round((won / quota) * 100))
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-lg font-semibold tracking-tight text-slate-900">
            Welcome back, {{ store.currentUser.name.split(' ')[0] }}
          </h2>
          <span
            class="inline-flex items-center rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold"
            :class="
              store.permissions.isAdmin
                ? 'bg-slate-900 text-white'
                : store.permissions.isManager
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                  : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
            "
          >
            {{ store.permissions.roleBadge }}
          </span>
        </div>
        <p class="mt-0.5 text-xs text-slate-500">
          {{ subtitleText }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          v-if="store.permissions.canViewTeam"
          label="Team Workload"
          icon="pi pi-building"
          severity="secondary"
          outlined
          size="small"
          class="!rounded-lg !bg-white !text-xs"
          @click="router.push('/team')"
        />
        <Button
          label="Schedule Task"
          icon="pi pi-calendar-plus"
          severity="secondary"
          outlined
          size="small"
          class="!rounded-lg !bg-white !text-xs"
          @click="store.openTaskDrawer()"
        />
        <Button
          :label="store.permissions.isWorker ? 'My Pipeline' : 'Open Pipeline'"
          icon="pi pi-objects-column"
          severity="secondary"
          outlined
          size="small"
          class="!rounded-lg !bg-white !text-xs"
          @click="router.push('/pipeline')"
        />
      </div>
    </div>

    <div
      v-if="store.permissions.isWorker && store.currentUser.monthlyQuota > 0"
      class="crm-card p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="space-y-0.5">
        <p class="text-xs font-semibold text-slate-900">
          Personal Quota Attainment · {{ store.currentUser.region }}
        </p>
        <p class="text-xs text-slate-500">
          Closed Won <strong class="text-emerald-700">{{ formatCurrency(store.kpiMetrics.totalWonValue) }}</strong>
          against target of <strong class="text-slate-800">{{ formatCurrency(store.currentUser.monthlyQuota) }}</strong>
        </p>
      </div>

      <div class="w-full sm:w-72 space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-slate-500">Attainment</span>
          <span class="font-bold text-slate-900 tabular-nums">{{ quotaPercent }}%</span>
        </div>
        <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :style="{ width: `${quotaPercent}%`, backgroundColor: activeThemeMeta.hex }"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        :label="store.permissions.isWorker ? 'Assigned Leads' : 'Total Leads'"
        :value="store.kpiMetrics.totalLeads"
        :sub-value="`${formatCompactCurrency(store.kpiMetrics.activePipelineValue)} active pipeline`"
        icon="pi pi-users"
        accent-bg="bg-blue-50"
        accent-text="text-blue-600"
        :trend-percent="store.kpiMetrics.trends.totalLeads"
      />

      <KpiCard
        label="New Leads"
        :value="store.kpiMetrics.newLeads"
        sub-value="Awaiting initial outreach"
        icon="pi pi-inbox"
        accent-bg="bg-sky-50"
        accent-text="text-sky-600"
        :trend-percent="store.kpiMetrics.trends.newLeads"
      />

      <KpiCard
        label="Qualified Leads"
        :value="store.kpiMetrics.qualifiedLeads"
        sub-value="Qualified, Proposal & Neg."
        icon="pi pi-verified"
        accent-bg="bg-slate-100"
        accent-text="text-slate-700"
        :trend-percent="store.kpiMetrics.trends.qualifiedLeads"
      />

      <KpiCard
        label="Won Deals"
        :value="store.kpiMetrics.wonDealsCount"
        :sub-value="`${formatCompactCurrency(store.kpiMetrics.totalWonValue)} closed revenue`"
        icon="pi pi-trophy"
        accent-bg="bg-emerald-50"
        accent-text="text-emerald-600"
        :trend-percent="store.kpiMetrics.trends.wonDeals"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <LeadTrendChart />
      <PipelineStageChart />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <LeadSourceChart />
      <RegionalLeadsChart />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <div class="xl:col-span-7 space-y-5">
        <RecentLeadsTable />
        <UpcomingFollowUps />
      </div>

      <div class="xl:col-span-5">
        <RecentActivityTimeline />
      </div>
    </div>
  </div>
</template>
