<script setup>
import { computed, ref } from 'vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import KanbanCard from './KanbanCard.vue'
import { LEAD_PRIORITIES, PIPELINE_STAGES, STAGE_META } from '@/utils/constants'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const toast = useToast()
const { formatCompactCurrency, formatCurrency } = useFormatters()

const searchQuery = ref('')
const ownerFilter = ref('All')
const priorityFilter = ref('All')

const draggedLeadId = ref(null)
const dragOverStage = ref(null)

const ownerOptions = computed(() => [
  { label: 'All Representatives', value: 'All' },
  ...store.users.map((u) => ({ label: u.name, value: u.id }))
])

const priorityOptions = ['All', ...LEAD_PRIORITIES]

const filteredLeads = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return store.leads.filter((lead) => {
    if (store.permissions.canViewAllRecords && ownerFilter.value !== 'All' && lead.assignedTo !== ownerFilter.value) {
      return false
    }
    if (priorityFilter.value !== 'All' && lead.priority !== priorityFilter.value) return false
    if (q) {
      const match =
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.category.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
})

const columns = computed(() => {
  return PIPELINE_STAGES.map((stage) => {
    const stageLeads = filteredLeads.value.filter((l) => l.status === stage)
    const totalValue = stageLeads.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
    return {
      stage,
      meta: STAGE_META[stage],
      leads: stageLeads,
      totalValue
    }
  })
})

function moveLeadToStage(leadId, nextStage) {
  const existing = store.getLeadById(leadId)
  if (!existing || existing.status === nextStage) return

  store.updateLead(leadId, { status: nextStage })
  toast.add({
    severity: nextStage === 'Won' ? 'success' : 'info',
    summary: nextStage === 'Won' ? 'Deal Marked Won' : 'Stage Updated',
    detail: `${existing.name} (${existing.company}) moved to ${nextStage}.`,
    life: 2600
  })
}

function handleDragOver(e, stage) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverStage.value = stage
}

function handleDrop(e, targetStage) {
  e.preventDefault()
  const transferId = e.dataTransfer?.getData('text/plain') || draggedLeadId.value
  dragOverStage.value = null
  draggedLeadId.value = null
  if (transferId) {
    moveLeadToStage(transferId, targetStage)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold tracking-tight text-slate-900">
          {{ store.permissions.isWorker ? 'My Pipeline Board' : 'Pipeline Board' }}
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Drag cards between columns or switch stages directly on any opportunity card.
        </p>
      </div>

      <div class="flex items-center gap-4 text-xs">
        <span class="text-slate-500">
          Active Pipeline:
          <strong class="font-semibold text-slate-900 tabular-nums">
            {{ formatCurrency(store.kpiMetrics.activePipelineValue) }}
          </strong>
        </span>
        <span class="text-slate-500">
          Closed Won:
          <strong class="font-semibold text-emerald-700 tabular-nums">
            {{ formatCurrency(store.kpiMetrics.totalWonValue) }}
          </strong>
        </span>
      </div>
    </div>

    <div class="crm-card p-3.5 flex flex-wrap items-center gap-2.5">
      <IconField class="w-full sm:w-64">
        <InputIcon class="pi pi-search !text-xs text-slate-400" />
        <InputText
          v-model="searchQuery"
          placeholder="Filter deal cards..."
          size="small"
          class="w-full !rounded-lg !text-xs"
        />
      </IconField>

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
        v-model="priorityFilter"
        :options="priorityOptions"
        size="small"
        class="!text-xs w-38"
      >
        <template #value="{ value }">
          <span class="text-xs">Priority: <strong>{{ value }}</strong></span>
        </template>
      </Select>
    </div>

    <div class="overflow-x-auto pb-3 -mx-1 px-1">
      <div class="flex gap-3.5 min-w-max">
        <section
          v-for="col in columns"
          :key="col.stage"
          class="w-[17.25rem] shrink-0 rounded-xl border transition-all duration-150 flex flex-col max-h-[calc(100vh-245px)] min-h-[460px]"
          :class="
            dragOverStage === col.stage
              ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-slate-100/75 border-slate-200/85'
          "
          @dragover="handleDragOver($event, col.stage)"
          @dragleave="dragOverStage === col.stage ? (dragOverStage = null) : null"
          @drop="handleDrop($event, col.stage)"
        >
          <div class="p-3.5 border-b border-slate-200/70 bg-white rounded-t-xl">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 rounded-full shrink-0"
                  :style="{ backgroundColor: col.meta.dotColor }"
                />
                <h3 class="text-xs font-semibold text-slate-900">{{ col.stage }}</h3>
                <span
                  class="inline-flex items-center justify-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-slate-600 tabular-nums"
                >
                  {{ col.leads.length }}
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-slate-600 tabular-nums">
                  {{ formatCompactCurrency(col.totalValue) }}
                </span>
                <button
                  type="button"
                  :title="`Add lead in ${col.stage}`"
                  class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  @click="store.openCreateLeadDrawer(col.stage)"
                >
                  <i class="pi pi-plus text-[0.625rem]" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            <KanbanCard
              v-for="lead in col.leads"
              :key="lead.id"
              :lead="lead"
              @drag-start="draggedLeadId = $event"
              @drag-end="
                () => {
                  draggedLeadId = null
                  dragOverStage = null
                }
              "
              @change-stage="moveLeadToStage"
            />

            <div
              v-if="col.leads.length === 0"
              class="rounded-lg border border-dashed border-slate-300/80 py-8 px-4 text-center"
            >
              <p class="text-xs font-medium text-slate-400">No deals in stage</p>
              <button
                type="button"
                class="mt-1.5 text-[0.6875rem] font-medium crm-accent-text hover:underline cursor-pointer"
                @click="store.openCreateLeadDrawer(col.stage)"
              >
                + Add in {{ col.stage }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
