<script setup>
import { computed, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import StatusTag from '@/components/common/StatusTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { LEAD_PRIORITIES, PIPELINE_STAGES } from '@/utils/constants'
import { activeThemeMeta } from '@/utils/themeManager'
import { useFormatters } from '@/composables/useFormatters'
import { useCsvExport } from '@/composables/useCsvExport'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const confirm = useConfirm()
const toast = useToast()
const { formatCurrency, formatShortDate, isDateOverdue } = useFormatters()
const { downloadCsv } = useCsvExport()

const statusFilter = ref('All')
const stateFilter = ref('All')
const sourceFilter = ref('All')
const priorityFilter = ref('All')
const ownerFilter = ref('All')

const selectedLeads = ref([])
const bulkStatus = ref(null)
const bulkAssignee = ref(null)

const distinctStates = computed(() => {
  const s = new Set(store.leads.map((l) => l.state).filter(Boolean))
  return ['All', ...Array.from(s).sort()]
})

const statusFilterOptions = computed(() => ['All', ...PIPELINE_STAGES])
const sourceFilterOptions = computed(() => ['All', ...store.settings.leadSources])
const priorityFilterOptions = computed(() => ['All', ...LEAD_PRIORITIES])
const ownerFilterOptions = computed(() => [
  { label: 'All Owners', value: 'All' },
  ...store.users.map((u) => ({ label: u.name, value: u.id }))
])

const hasActiveFilters = computed(() => {
  return (
    Boolean(store.globalSearchQuery.trim()) ||
    statusFilter.value !== 'All' ||
    stateFilter.value !== 'All' ||
    sourceFilter.value !== 'All' ||
    priorityFilter.value !== 'All' ||
    ownerFilter.value !== 'All'
  )
})

const filteredLeads = computed(() => {
  const q = store.globalSearchQuery.trim().toLowerCase()
  return store.leads.filter((lead) => {
    if (statusFilter.value !== 'All' && lead.status !== statusFilter.value) return false
    if (stateFilter.value !== 'All' && lead.state !== stateFilter.value) return false
    if (sourceFilter.value !== 'All' && lead.source !== sourceFilter.value) return false
    if (priorityFilter.value !== 'All' && lead.priority !== priorityFilter.value) return false
    if (
      store.permissions.canViewAllRecords &&
      ownerFilter.value !== 'All' &&
      lead.assignedTo !== ownerFilter.value
    ) {
      return false
    }

    if (q) {
      const ownerName = store.getUserName(lead.assignedTo).toLowerCase()
      const haystack =
        `${lead.name} ${lead.company} ${lead.email} ${lead.phone} ${lead.state} ${lead.city} ${lead.category} ${lead.source} ${ownerName}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

function resetFilters() {
  store.globalSearchQuery = ''
  statusFilter.value = 'All'
  stateFilter.value = 'All'
  sourceFilter.value = 'All'
  priorityFilter.value = 'All'
  ownerFilter.value = 'All'
}

function applyBulkStatus() {
  if (!bulkStatus.value || selectedLeads.value.length === 0) return
  const count = store.bulkUpdateLeads(
    selectedLeads.value.map((l) => l.id),
    { status: bulkStatus.value }
  )
  toast.add({
    severity: 'success',
    summary: 'Bulk Stage Update',
    detail: `Moved ${count} lead(s) to ${bulkStatus.value}.`,
    life: 2800
  })
  bulkStatus.value = null
  selectedLeads.value = []
}

function applyBulkReassign() {
  if (!bulkAssignee.value || selectedLeads.value.length === 0) return
  const targetName = store.getUserName(bulkAssignee.value)
  const count = store.bulkUpdateLeads(
    selectedLeads.value.map((l) => l.id),
    { assignedTo: bulkAssignee.value }
  )
  toast.add({
    severity: 'success',
    summary: 'Leads Reassigned',
    detail: `Assigned ${count} lead(s) to ${targetName}.`,
    life: 2800
  })
  bulkAssignee.value = null
  selectedLeads.value = []
}

function confirmDeleteSingle(lead) {
  confirm.require({
    header: 'Delete Lead?',
    message: `Remove ${lead.name} (${lead.company}) permanently?`,
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => {
      store.deleteLeads([lead.id])
      selectedLeads.value = selectedLeads.value.filter((item) => item.id !== lead.id)
      toast.add({
        severity: 'info',
        summary: 'Lead Deleted',
        detail: `${lead.name} has been deleted.`,
        life: 2500
      })
    }
  })
}

function confirmBulkDelete() {
  if (selectedLeads.value.length === 0) return
  const ids = selectedLeads.value.map((l) => l.id)
  confirm.require({
    header: `Delete ${ids.length} Selected Leads?`,
    message: `This will permanently delete ${ids.length} selected lead record(s).`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: `Delete ${ids.length} Leads`, severity: 'danger' },
    accept: () => {
      store.deleteLeads(ids)
      selectedLeads.value = []
      toast.add({
        severity: 'info',
        summary: 'Bulk Delete Completed',
        detail: `${ids.length} lead(s) removed.`,
        life: 2600
      })
    }
  })
}

function handleExportCsv() {
  const rowsToExport = selectedLeads.value.length > 0 ? selectedLeads.value : filteredLeads.value
  if (rowsToExport.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Nothing to Export',
      detail: 'No matching leads found for CSV export.',
      life: 2400
    })
    return
  }

  downloadCsv('pulsecrm-leads-export.csv', rowsToExport, [
    { header: 'Lead ID', accessor: (r) => r.id },
    { header: 'Full Name', accessor: (r) => r.name },
    { header: 'Company', accessor: (r) => r.company },
    { header: 'Email', accessor: (r) => r.email },
    { header: 'Phone', accessor: (r) => r.phone },
    { header: 'City', accessor: (r) => r.city },
    { header: 'State / Region', accessor: (r) => r.state },
    { header: 'Category', accessor: (r) => r.category },
    { header: 'Source', accessor: (r) => r.source },
    { header: 'Assigned Employee', accessor: (r) => store.getUserName(r.assignedTo) },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Priority', accessor: (r) => r.priority },
    { header: 'Deal Value (USD)', accessor: (r) => r.dealValue },
    { header: 'Next Follow-up', accessor: (r) => r.nextFollowUp },
    { header: 'Created Date', accessor: (r) => r.createdAt },
    { header: 'Notes', accessor: (r) => r.notes }
  ])

  toast.add({
    severity: 'success',
    summary: 'CSV Exported',
    detail: `Downloaded ${rowsToExport.length} lead record(s).`,
    life: 2500
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold tracking-tight text-slate-900">
          {{ store.permissions.isWorker ? 'My Assigned Leads' : 'Lead Directory' }}
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          {{
            store.permissions.isWorker
              ? 'Manage stage progression, notes, and follow-up schedules across leads assigned to you.'
              : 'Filter, sort, assign territories, bulk-update pipeline stages, or export CSV reports.'
          }}
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <span class="text-xs text-slate-500 tabular-nums">
          Showing <strong class="font-semibold text-slate-900">{{ filteredLeads.length }}</strong> of
          {{ store.leads.length }}
        </span>

        <Button
          :label="selectedLeads.length > 0 ? `Export (${selectedLeads.length})` : 'Export CSV'"
          icon="pi pi-download"
          severity="secondary"
          outlined
          size="small"
          class="!rounded-lg !bg-white !text-xs"
          @click="handleExportCsv"
        />
      </div>
    </div>

    <div class="crm-card p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <IconField class="w-full sm:w-80">
          <InputIcon class="pi pi-search !text-xs text-slate-400" />
          <InputText
            v-model="store.globalSearchQuery"
            placeholder="Filter by name, company, email, phone, or state..."
            size="small"
            class="w-full !rounded-lg !text-xs"
          />
        </IconField>

        <Button
          v-if="hasActiveFilters"
          label="Clear Filters"
          icon="pi pi-filter-slash"
          text
          severity="secondary"
          size="small"
          class="!text-xs"
          @click="resetFilters"
        />
      </div>

      <div
        class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-slate-100"
        :class="store.permissions.canViewAllRecords ? 'lg:grid-cols-5' : 'lg:grid-cols-4'"
      >
        <Select
          v-model="statusFilter"
          :options="statusFilterOptions"
          size="small"
          placeholder="Status"
          class="!text-xs w-full"
        >
          <template #value="{ value }">
            <span class="text-xs">Status: <strong>{{ value }}</strong></span>
          </template>
        </Select>

        <Select
          v-model="stateFilter"
          :options="distinctStates"
          size="small"
          placeholder="State / Region"
          class="!text-xs w-full"
        >
          <template #value="{ value }">
            <span class="text-xs truncate">Region: <strong>{{ value }}</strong></span>
          </template>
        </Select>

        <Select
          v-model="sourceFilter"
          :options="sourceFilterOptions"
          size="small"
          placeholder="Source"
          class="!text-xs w-full"
        >
          <template #value="{ value }">
            <span class="text-xs truncate">Source: <strong>{{ value }}</strong></span>
          </template>
        </Select>

        <Select
          v-model="priorityFilter"
          :options="priorityFilterOptions"
          size="small"
          placeholder="Priority"
          class="!text-xs w-full"
        >
          <template #value="{ value }">
            <span class="text-xs">Priority: <strong>{{ value }}</strong></span>
          </template>
        </Select>

        <Select
          v-if="store.permissions.canViewAllRecords"
          v-model="ownerFilter"
          :options="ownerFilterOptions"
          option-label="label"
          option-value="value"
          size="small"
          placeholder="Assigned Rep"
          class="!text-xs w-full col-span-2 sm:col-span-1"
        />
      </div>
    </div>

    <div
      v-if="selectedLeads.length > 0"
      class="rounded-xl bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm"
    >
      <div class="flex items-center gap-2.5 text-xs font-medium">
        <span
          class="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white/15 px-1.5 text-xs font-bold tabular-nums"
        >
          {{ selectedLeads.length }}
        </span>
        <span>selected</span>
        <button
          type="button"
          class="ml-1 text-slate-300 hover:text-white underline cursor-pointer"
          @click="selectedLeads = []"
        >
          Clear
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1.5">
          <Select
            v-model="bulkStatus"
            :options="PIPELINE_STAGES"
            placeholder="Move stage..."
            size="small"
            class="!text-xs !w-36 !bg-white !text-slate-900"
          />
          <Button
            label="Update"
            size="small"
            :disabled="!bulkStatus"
            class="!text-xs"
            @click="applyBulkStatus"
          />
        </div>

        <div v-if="store.permissions.canReassignLeads" class="flex items-center gap-1.5">
          <Select
            v-model="bulkAssignee"
            :options="store.users"
            option-label="name"
            option-value="id"
            placeholder="Assign rep..."
            size="small"
            class="!text-xs !w-36 !bg-white !text-slate-900"
          />
          <Button
            label="Assign"
            severity="secondary"
            size="small"
            :disabled="!bulkAssignee"
            class="!text-xs"
            @click="applyBulkReassign"
          />
        </div>

        <Button
          v-if="store.permissions.canDeleteRecords"
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          class="!text-xs"
          @click="confirmBulkDelete"
        />
      </div>
    </div>

    <div class="crm-card overflow-hidden">
      <EmptyState
        v-if="filteredLeads.length === 0"
        icon="pi pi-search"
        title="No matching leads found"
        description="Adjust your search query or dropdown filters, or create a new lead."
        action-label="Clear Filters"
        action-icon="pi pi-filter-slash"
        @action="resetFilters"
      />

      <DataTable
        v-else
        v-model:selection="selectedLeads"
        :value="filteredLeads"
        data-key="id"
        paginator
        :rows="store.settings.defaultTableRows"
        :rows-per-page-options="[10, 20, 50]"
        removable-sort
        scrollable
        :size="store.settings.compactTables ? 'small' : undefined"
        class="crm-table"
      >
        <Column selection-mode="multiple" header-style="width: 2.75rem" />

        <Column field="name" header="Lead Name" sortable style="min-width: 175px">
          <template #body="{ data }">
            <button
              type="button"
              class="flex items-center gap-2.5 text-left group cursor-pointer"
              @click="store.openLeadDetailDrawer(data.id)"
            >
              <UserAvatar :name="data.name" :color="activeThemeMeta.hex" small />
              <div>
                <p
                  class="text-xs font-semibold text-slate-900 group-hover:underline transition-colors"
                >
                  {{ data.name }}
                </p>
                <p class="text-[11px] text-slate-500 tabular-nums">
                  {{ formatCurrency(data.dealValue) }}
                </p>
              </div>
            </button>
          </template>
        </Column>

        <Column field="company" header="Company" sortable style="min-width: 155px">
          <template #body="{ data }">
            <span class="text-xs font-medium text-slate-800">{{ data.company }}</span>
          </template>
        </Column>

        <Column field="email" header="Email" style="min-width: 185px">
          <template #body="{ data }">
            <a
              :href="`mailto:${data.email}`"
              class="text-xs text-slate-600 hover:underline transition-colors"
            >
              {{ data.email }}
            </a>
          </template>
        </Column>

        <Column field="phone" header="Phone" style="min-width: 138px">
          <template #body="{ data }">
            <span class="text-xs text-slate-600 whitespace-nowrap tabular-nums">
              {{ data.phone }}
            </span>
          </template>
        </Column>

        <Column field="state" header="State / Region" sortable style="min-width: 130px">
          <template #body="{ data }">
            <div>
              <p class="text-xs text-slate-800">{{ data.state }}</p>
              <p class="text-[11px] text-slate-400">{{ data.city }}</p>
            </div>
          </template>
        </Column>

        <Column field="category" header="Category" sortable style="min-width: 125px">
          <template #body="{ data }">
            <span
              class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap"
            >
              {{ data.category }}
            </span>
          </template>
        </Column>

        <Column field="source" header="Source" sortable style="min-width: 115px">
          <template #body="{ data }">
            <span class="text-xs text-slate-600 whitespace-nowrap">{{ data.source }}</span>
          </template>
        </Column>

        <Column field="assignedTo" header="Assigned Rep" sortable style="min-width: 155px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <UserAvatar
                :name="store.getUserName(data.assignedTo)"
                :color="store.getUserById(data.assignedTo)?.avatarColor ?? '#64748b'"
                small
              />
              <span class="text-xs text-slate-700 whitespace-nowrap">
                {{ store.getUserName(data.assignedTo) }}
              </span>
            </div>
          </template>
        </Column>

        <Column field="status" header="Status" sortable style="min-width: 118px">
          <template #body="{ data }">
            <StatusTag :value="data.status" variant="stage" />
          </template>
        </Column>

        <Column field="priority" header="Priority" sortable style="min-width: 98px">
          <template #body="{ data }">
            <StatusTag :value="data.priority" variant="priority" />
          </template>
        </Column>

        <Column field="nextFollowUp" header="Next Follow-up" sortable style="min-width: 120px">
          <template #body="{ data }">
            <span
              v-if="data.nextFollowUp"
              class="inline-flex items-center gap-1 text-xs tabular-nums whitespace-nowrap"
              :class="
                data.status !== 'Won' &&
                data.status !== 'Lost' &&
                isDateOverdue(data.nextFollowUp)
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-600'
              "
            >
              <i
                v-if="
                  data.status !== 'Won' &&
                  data.status !== 'Lost' &&
                  isDateOverdue(data.nextFollowUp)
                "
                class="pi pi-exclamation-circle text-[11px]"
              />
              {{ formatShortDate(data.nextFollowUp) }}
            </span>
            <span v-else class="text-xs text-slate-400">—</span>
          </template>
        </Column>

        <Column header="Actions" align-frozen="right" frozen style="min-width: 100px">
          <template #body="{ data }">
            <div class="flex items-center gap-0.5">
              <Button
                icon="pi pi-eye"
                text
                rounded
                severity="secondary"
                size="small"
                title="View Details"
                class="!w-7 !h-7"
                @click="store.openLeadDetailDrawer(data.id)"
              />
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                size="small"
                title="Edit Lead"
                class="!w-7 !h-7"
                @click="store.openEditLeadDrawer(data)"
              />
              <Button
                v-if="store.permissions.canDeleteRecords"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                title="Delete Lead"
                class="!w-7 !h-7"
                @click="confirmDeleteSingle(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
