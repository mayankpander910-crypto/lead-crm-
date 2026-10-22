<script setup>
import { computed, reactive, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import KpiCard from '@/components/common/KpiCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { USER_ROLES } from '@/utils/constants'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const toast = useToast()
const { formatCurrency } = useFormatters()

const search = ref('')
const roleFilter = ref('All')
const addDialogOpen = ref(false)

const newMember = reactive({
  name: '',
  email: '',
  password: 'Worker@123',
  role: 'Sales Representative',
  region: 'West Coast',
  department: 'Enterprise Sales',
  monthlyQuota: 140000,
  status: 'Active'
})

const enrichedTeam = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.users
    .map((user) => {
      const assignedLeads = store.allLeads.filter((l) => l.assignedTo === user.id)
      const openTasksCount = store.allTasks.filter(
        (t) => t.assignedTo === user.id && t.status === 'Pending'
      ).length
      const wonValue = assignedLeads
        .filter((l) => l.status === 'Won')
        .reduce((s, l) => s + (Number(l.dealValue) || 0), 0)

      return {
        ...user,
        assignedLeadCount: assignedLeads.length,
        openTasksCount,
        wonValue
      }
    })
    .filter((row) => {
      if (roleFilter.value !== 'All' && row.role !== roleFilter.value) return false
      if (q) {
        const match =
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.region.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
})

function toggleStatus(member) {
  if (!store.permissions.canManageTeam) return
  const next = member.status === 'Active' ? 'Away' : 'Active'
  store.updateUser(member.id, { status: next })
  toast.add({
    severity: 'info',
    summary: 'Availability Updated',
    detail: `${member.name} is now marked as ${next}.`,
    life: 2300
  })
}

function handleCreateMember() {
  if (!newMember.name.trim() || !newMember.email.trim() || !newMember.password.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Required Fields',
      detail: 'Please provide full name, work email, and login password.',
      life: 2800
    })
    return
  }

  const palette = ['#2563eb', '#0284c7', '#0f766e', '#059669', '#d97706', '#334155']
  store.addTeamMember({
    name: newMember.name.trim(),
    email: newMember.email.trim(),
    password: newMember.password.trim(),
    role: newMember.role,
    status: newMember.status,
    department: newMember.department.trim() || 'Sales',
    region: newMember.region.trim() || 'National',
    avatarColor: palette[store.users.length % palette.length],
    monthlyQuota: newMember.monthlyQuota || 120000,
    phone: '+1 (415) 555-0148'
  })

  toast.add({
    severity: 'success',
    summary: 'Team Account Created',
    detail: `${newMember.name} can now sign in with ${newMember.email}.`,
    life: 3000
  })
  newMember.name = ''
  newMember.email = ''
  newMember.password = 'Worker@123'
  addDialogOpen.value = false
}
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard
        label="Sales Organization"
        :value="store.users.length"
        :sub-value="`${store.users.filter((u) => u.status === 'Active').length} active members`"
        icon="pi pi-users"
        accent-bg="bg-blue-50"
        accent-text="text-blue-600"
      />
      <KpiCard
        label="Avg. Leads per Rep"
        :value="store.users.length ? (store.allLeads.length / store.users.length).toFixed(1) : '0'"
        sub-value="Balanced territory workload"
        icon="pi pi-briefcase"
        accent-bg="bg-sky-50"
        accent-text="text-sky-600"
      />
      <KpiCard
        label="Open Team Tasks"
        :value="store.upcomingTasks.length + store.overdueTasks.length"
        :sub-value="`${store.overdueTasks.length} overdue items`"
        icon="pi pi-check-square"
        accent-bg="bg-emerald-50"
        accent-text="text-emerald-600"
      />
    </div>

    <div class="crm-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <IconField class="w-full sm:w-64">
          <InputIcon class="pi pi-search !text-xs text-slate-400" />
          <InputText
            v-model="search"
            placeholder="Search employee or email..."
            size="small"
            class="w-full !rounded-lg !text-xs"
          />
        </IconField>

        <Select
          v-model="roleFilter"
          :options="['All', ...USER_ROLES]"
          size="small"
          class="!text-xs w-52"
        >
          <template #value="{ value }">
            <span class="text-xs">Role: <strong>{{ value }}</strong></span>
          </template>
        </Select>
      </div>

      <Button
        v-if="store.permissions.canManageTeam"
        label="Add Member"
        icon="pi pi-user-plus"
        size="small"
        class="!rounded-lg !text-xs"
        @click="addDialogOpen = true"
      />
      <span
        v-else
        class="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
      >
        <i class="pi pi-eye text-xs text-slate-400" />
        Manager Oversight View (Admin manages user accounts)
      </span>
    </div>

    <div class="crm-card overflow-hidden">
      <DataTable :value="enrichedTeam" data-key="id" responsive-layout="scroll" class="crm-table">
        <Column field="name" header="Name" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-3 min-w-[185px]">
              <UserAvatar :name="data.name" :color="data.avatarColor" />
              <div>
                <p class="text-xs font-semibold text-slate-900">
                  {{ data.name }}
                  <span
                    v-if="data.id === store.currentUser.id"
                    class="ml-1 text-[0.625rem] font-medium crm-accent-soft px-1.5 py-0.5 rounded"
                  >
                    You
                  </span>
                </p>
                <p class="text-[0.6875rem] text-slate-400">{{ data.department }} · {{ data.region }}</p>
              </div>
            </div>
          </template>
        </Column>

        <Column field="email" header="Email" sortable>
          <template #body="{ data }">
            <a
              :href="`mailto:${data.email}`"
              class="text-xs text-slate-600 hover:underline whitespace-nowrap"
            >
              {{ data.email }}
            </a>
          </template>
        </Column>

        <Column field="role" header="Role" sortable>
          <template #body="{ data }">
            <StatusTag :value="data.role" variant="role" />
          </template>
        </Column>

        <Column field="assignedLeadCount" header="Assigned Leads" sortable>
          <template #body="{ data }">
            <span class="text-xs font-semibold text-slate-900 tabular-nums">
              {{ data.assignedLeadCount }}
            </span>
          </template>
        </Column>

        <Column field="openTasksCount" header="Open Tasks" sortable>
          <template #body="{ data }">
            <span class="text-xs font-medium text-slate-700 tabular-nums">
              {{ data.openTasksCount }}
            </span>
          </template>
        </Column>

        <Column field="wonValue" header="Closed Won" sortable>
          <template #body="{ data }">
            <span class="text-xs font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
              {{ formatCurrency(data.wonValue) }}
            </span>
          </template>
        </Column>

        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <button
              v-if="store.permissions.canManageTeam"
              type="button"
              title="Click to toggle status"
              class="cursor-pointer"
              @click="toggleStatus(data)"
            >
              <StatusTag :value="data.status" variant="userStatus" />
            </button>
            <StatusTag v-else :value="data.status" variant="userStatus" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="addDialogOpen"
      modal
      header="Add Sales Team Member Account"
      class="w-full max-w-md !rounded-xl"
    >
      <form id="team-member-form" class="space-y-4 pt-1" @submit.prevent="handleCreateMember">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Full Name *</label>
          <InputText
            v-model="newMember.name"
            placeholder="e.g. Maya Patel"
            size="small"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Work Email *</label>
            <InputText
              v-model="newMember.email"
              type="email"
              placeholder="maya@pulsecrm.io"
              size="small"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Login Password *</label>
            <InputText
              v-model="newMember.password"
              placeholder="Worker@123"
              size="small"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Role</label>
            <Select v-model="newMember.role" :options="USER_ROLES" size="small" class="w-full" />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Status</label>
            <Select
              v-model="newMember.status"
              :options="['Active', 'Away']"
              size="small"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Region</label>
            <InputText v-model="newMember.region" size="small" class="w-full" />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Monthly Quota</label>
            <InputNumber
              v-model="newMember.monthlyQuota"
              mode="currency"
              currency="USD"
              locale="en-US"
              :max-fraction-digits="0"
              size="small"
              class="w-full"
              input-class="w-full"
            />
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            size="small"
            @click="addDialogOpen = false"
          />
          <Button
            label="Create Account"
            icon="pi pi-check"
            size="small"
            type="submit"
            form="team-member-form"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
