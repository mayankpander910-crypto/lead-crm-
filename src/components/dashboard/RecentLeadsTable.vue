<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import StatusTag from '@/components/common/StatusTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { activeThemeMeta } from '@/utils/themeManager'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const router = useRouter()
const { formatCurrency } = useFormatters()

const recentLeads = computed(() => {
  return [...store.leads]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 6)
})

function onRowClick(event) {
  store.openLeadDetailDrawer(event.data.id)
}
</script>

<template>
  <div class="crm-card overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h3 class="text-sm font-semibold text-slate-900">Recent Leads</h3>
        <p class="mt-0.5 text-xs text-slate-500">Latest opportunities added across channels</p>
      </div>
      <Button
        label="View All"
        icon="pi pi-arrow-right"
        icon-pos="right"
        text
        size="small"
        class="!text-xs"
        @click="router.push('/leads')"
      />
    </div>

    <EmptyState
      v-if="recentLeads.length === 0"
      icon="pi pi-users"
      title="No leads yet"
      description="Create your first sales lead to populate the dashboard."
      action-label="New Lead"
      compact
      @action="store.openCreateLeadDrawer()"
    />

    <DataTable
      v-else
      :value="recentLeads"
      data-key="id"
      responsive-layout="scroll"
      class="crm-table cursor-pointer"
      @row-click="onRowClick"
    >
      <Column header="Lead & Company">
        <template #body="{ data }">
          <div class="flex items-center gap-2.5 min-w-[10rem]">
            <UserAvatar :name="data.name" :color="activeThemeMeta.hex" small />
            <div class="min-w-0">
              <p class="text-xs font-semibold text-slate-900 truncate">{{ data.name }}</p>
              <p class="text-[0.6875rem] text-slate-500 truncate">{{ data.company }}</p>
            </div>
          </div>
        </template>
      </Column>

      <Column header="Source" class="hidden md:table-cell">
        <template #body="{ data }">
          <span class="text-xs text-slate-600 whitespace-nowrap">{{ data.source }}</span>
        </template>
      </Column>

      <Column header="Value">
        <template #body="{ data }">
          <span class="text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
            {{ formatCurrency(data.dealValue) }}
          </span>
        </template>
      </Column>

      <Column header="Owner" class="hidden sm:table-cell">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <UserAvatar
              :name="store.getUserName(data.assignedTo)"
              :color="store.getUserById(data.assignedTo)?.avatarColor ?? '#64748b'"
              small
            />
            <span class="text-xs text-slate-600 truncate max-w-[6.6rem]">
              {{ store.getUserName(data.assignedTo) }}
            </span>
          </div>
        </template>
      </Column>

      <Column header="Status">
        <template #body="{ data }">
          <StatusTag :value="data.status" variant="stage" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
