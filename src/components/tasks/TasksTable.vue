<script setup>
import { computed, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import StatusTag from '@/components/common/StatusTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { LEAD_PRIORITIES } from '@/utils/constants'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const confirm = useConfirm()
const toast = useToast()
const { formatShortDate, formatTime12h, todayIsoDate } = useFormatters()

const activeTab = ref('All')
const employeeFilter = ref('All')
const priorityFilter = ref('All')
const selectedDateFilter = ref(null)

const tabs = computed(() => [
  { key: 'All', label: 'All Tasks', count: store.tasks.length },
  { key: 'Upcoming', label: 'Upcoming', count: store.upcomingTasks.length },
  { key: 'Overdue', label: 'Overdue', count: store.overdueTasks.length },
  { key: 'Completed', label: 'Completed', count: store.completedTasks.length }
])

const employeeOptions = computed(() => [
  { label: 'All Employees', value: 'All' },
  ...store.users.map((u) => ({ label: u.name, value: u.id }))
])

const dueTodayCount = computed(() => {
  const today = todayIsoDate()
  return store.tasks.filter((t) => t.status === 'Pending' && t.dueDate === today).length
})

const filteredTasks = computed(() => {
  const dateFilterIso = selectedDateFilter.value
    ? `${selectedDateFilter.value.getFullYear()}-${String(
        selectedDateFilter.value.getMonth() + 1
      ).padStart(2, '0')}-${String(selectedDateFilter.value.getDate()).padStart(2, '0')}`
    : ''

  return [...store.tasks]
    .filter((task) => {
      const bucket = store.getTaskBucket(task)
      if (activeTab.value !== 'All' && bucket !== activeTab.value) return false
      if (
        store.permissions.canViewAllRecords &&
        employeeFilter.value !== 'All' &&
        task.assignedTo !== employeeFilter.value
      ) {
        return false
      }
      if (priorityFilter.value !== 'All' && task.priority !== priorityFilter.value) return false
      if (dateFilterIso && task.dueDate !== dateFilterIso) return false
      return true
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Pending' ? -1 : 1
      return `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`)
    })
})

function handleToggle(task) {
  const updated = store.toggleTaskCompletion(task.id)
  if (!updated) return
  toast.add({
    severity: updated.status === 'Completed' ? 'success' : 'info',
    summary: updated.status === 'Completed' ? 'Task Completed' : 'Task Reopened',
    detail: `"${updated.title}" is now ${updated.status.toLowerCase()}.`,
    life: 2400
  })
}

function handleDelete(task) {
  confirm.require({
    header: 'Delete Task?',
    message: `Remove "${task.title}" from scheduled reminders?`,
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => {
      store.deleteTask(task.id)
      toast.add({
        severity: 'info',
        summary: 'Task Deleted',
        detail: 'Task removed.',
        life: 2200
      })
    }
  })
}

function clearFilters() {
  activeTab.value = 'All'
  employeeFilter.value = 'All'
  priorityFilter.value = 'All'
  selectedDateFilter.value = null
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="store.overdueTasks.length > 0 || dueTodayCount > 0"
      class="rounded-xl border border-amber-200/90 bg-amber-50/75 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"
        >
          <i class="pi pi-bell text-xs" />
        </div>
        <div>
          <p class="text-xs font-semibold text-amber-950">
            Active Reminders:
            <span v-if="store.overdueTasks.length > 0">
              {{ store.overdueTasks.length }} overdue
            </span>
            <span v-if="store.overdueTasks.length > 0 && dueTodayCount > 0"> · </span>
            <span v-if="dueTodayCount > 0">{{ dueTodayCount }} due today</span>
          </p>
          <p class="text-[11px] text-amber-800/85">
            In-app follow-up alerts stay synchronized locally across sessions.
          </p>
        </div>
      </div>

      <Button
        v-if="store.overdueTasks.length > 0 && activeTab !== 'Overdue'"
        label="View Overdue"
        size="small"
        severity="warn"
        outlined
        class="!rounded-lg !text-xs !bg-white"
        @click="activeTab = 'Overdue'"
      />
    </div>

    <div class="crm-card p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex flex-wrap rounded-lg bg-slate-100 p-1 gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
            :class="
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            "
            @click="activeTab = tab.key"
          >
            <span>{{ tab.label }}</span>
            <span
              class="rounded-full px-1.5 py-0.2 text-[10px] tabular-nums"
              :class="
                tab.key === 'Overdue' && tab.count > 0
                  ? 'bg-rose-100 text-rose-700 font-bold'
                  : 'bg-slate-200/80 text-slate-600'
              "
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <Button
          label="New Task"
          icon="pi pi-plus"
          size="small"
          class="!rounded-lg !text-xs"
          @click="store.openTaskDrawer()"
        />
      </div>

      <div
        class="grid grid-cols-1 gap-2.5 pt-2.5 border-t border-slate-100"
        :class="store.permissions.canViewAllRecords ? 'sm:grid-cols-4' : 'sm:grid-cols-3'"
      >
        <Select
          v-if="store.permissions.canViewAllRecords"
          v-model="employeeFilter"
          :options="employeeOptions"
          option-label="label"
          option-value="value"
          size="small"
          class="!text-xs w-full"
        />

        <Select
          v-model="priorityFilter"
          :options="['All', ...LEAD_PRIORITIES]"
          size="small"
          class="!text-xs w-full"
        >
          <template #value="{ value }">
            <span class="text-xs">Priority: <strong>{{ value }}</strong></span>
          </template>
        </Select>

        <DatePicker
          v-model="selectedDateFilter"
          date-format="yy-mm-dd"
          show-icon
          show-button-bar
          placeholder="Filter by due date"
          size="small"
          class="w-full !text-xs"
        />

        <div class="flex items-center justify-end">
          <Button
            v-if="
              activeTab !== 'All' ||
              employeeFilter !== 'All' ||
              priorityFilter !== 'All' ||
              selectedDateFilter !== null
            "
            label="Clear Filters"
            icon="pi pi-filter-slash"
            text
            severity="secondary"
            size="small"
            class="!text-xs"
            @click="clearFilters"
          />
        </div>
      </div>
    </div>

    <div class="crm-card overflow-hidden">
      <EmptyState
        v-if="filteredTasks.length === 0"
        icon="pi pi-check-square"
        title="No matching tasks"
        description="No tasks match the active filter view. Create a reminder or clear filters."
        action-label="New Task"
        @action="store.openTaskDrawer()"
      />

      <DataTable
        v-else
        :value="filteredTasks"
        data-key="id"
        paginator
        :rows="10"
        :rows-per-page-options="[10, 20, 50]"
        responsive-layout="scroll"
        class="crm-table"
      >
        <Column header="Done" style="width: 3rem">
          <template #body="{ data }">
            <Checkbox
              :model-value="data.status === 'Completed'"
              binary
              @update:model-value="handleToggle(data)"
            />
          </template>
        </Column>

        <Column field="title" header="Task & Agenda" sortable>
          <template #body="{ data }">
            <div class="max-w-[205px] xl:max-w-[235px]">
              <p
                class="text-xs font-semibold truncate"
                :class="
                  data.status === 'Completed'
                    ? 'line-through text-slate-400'
                    : 'text-slate-900'
                "
              >
                {{ data.title }}
              </p>
              <p v-if="data.description" class="mt-0.5 text-[11px] text-slate-500 truncate">
                {{ data.description }}
              </p>
            </div>
          </template>
        </Column>

        <Column header="Related Account">
          <template #body="{ data }">
            <button
              v-if="data.leadId && store.getLeadById(data.leadId)"
              type="button"
              class="inline-flex items-center gap-1.5 text-xs font-medium crm-accent-text hover:underline cursor-pointer whitespace-nowrap"
              @click="store.openLeadDetailDrawer(data.leadId)"
            >
              <i class="pi pi-building text-[11px]" />
              <span class="truncate max-w-[145px]">{{ store.getLeadById(data.leadId)?.company }}</span>
            </button>
            <span v-else class="text-xs text-slate-400">General</span>
          </template>
        </Column>

        <Column field="dueDate" header="Due Schedule" sortable>
          <template #body="{ data }">
            <div class="text-xs tabular-nums whitespace-nowrap">
              <p
                :class="
                  store.getTaskBucket(data) === 'Overdue'
                    ? 'font-semibold text-rose-600'
                    : 'text-slate-800'
                "
              >
                {{ formatShortDate(data.dueDate) }}
              </p>
              <p class="text-[11px] text-slate-400">{{ formatTime12h(data.dueTime) }}</p>
            </div>
          </template>
        </Column>

        <Column field="priority" header="Priority" sortable>
          <template #body="{ data }">
            <StatusTag :value="data.priority" variant="priority" />
          </template>
        </Column>

        <Column header="Status">
          <template #body="{ data }">
            <StatusTag :value="store.getTaskBucket(data)" variant="task" />
          </template>
        </Column>

        <Column field="assignedTo" header="Owner" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-1.5 whitespace-nowrap">
              <UserAvatar
                :name="store.getUserName(data.assignedTo)"
                :color="store.getUserById(data.assignedTo)?.avatarColor ?? '#64748b'"
                small
              />
              <span class="text-xs text-slate-700">
                {{ store.getUserName(data.assignedTo).split(' ')[0] }}
              </span>
            </div>
          </template>
        </Column>

        <Column header="Actions" align-frozen="right" frozen style="width: 5rem">
          <template #body="{ data }">
            <div class="flex items-center gap-0.5">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                size="small"
                title="Edit Task"
                class="!w-7 !h-7"
                @click="store.openTaskDrawer({ task: data })"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                title="Delete Task"
                class="!w-7 !h-7"
                @click="handleDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
