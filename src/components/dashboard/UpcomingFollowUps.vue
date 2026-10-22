<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import StatusTag from '@/components/common/StatusTag.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const router = useRouter()
const toast = useToast()
const { formatShortDate, formatTime12h } = useFormatters()

const openFollowUpTasks = computed(() => {
  return [...store.overdueTasks, ...store.upcomingTasks].slice(0, 6)
})

function handleComplete(taskId, title) {
  store.toggleTaskCompletion(taskId)
  toast.add({
    severity: 'success',
    summary: 'Follow-up Completed',
    detail: `"${title}" marked as complete.`,
    life: 2500
  })
}
</script>

<template>
  <div class="crm-card flex flex-col justify-between overflow-hidden">
    <div>
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Upcoming Follow-ups</h3>
          <p class="mt-0.5 text-xs text-slate-500">Scheduled calls & overdue reminders</p>
        </div>
        <Button
          label="All Tasks"
          icon="pi pi-arrow-right"
          icon-pos="right"
          text
          size="small"
          class="!text-xs"
          @click="router.push('/tasks')"
        />
      </div>

      <EmptyState
        v-if="openFollowUpTasks.length === 0"
        icon="pi pi-check-circle"
        title="No pending follow-ups"
        description="Every scheduled follow-up task has been completed."
        action-label="New Task"
        compact
        @action="store.openTaskDrawer()"
      />

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="task in openFollowUpTasks"
          :key="task.id"
          class="px-5 py-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3"
        >
          <div class="pt-0.5">
            <Checkbox
              :model-value="task.status === 'Completed'"
              binary
              @update:model-value="handleComplete(task.id, task.title)"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-semibold text-slate-900 truncate">
                {{ task.title }}
              </p>
              <StatusTag :value="store.getTaskBucket(task)" variant="task" />
            </div>

            <div class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.6875rem] text-slate-500">
              <span class="inline-flex items-center gap-1 tabular-nums">
                <i class="pi pi-calendar text-[0.625rem] text-slate-400" />
                {{ formatShortDate(task.dueDate) }}
                <template v-if="task.dueTime">· {{ formatTime12h(task.dueTime) }}</template>
              </span>

              <button
                v-if="task.leadId && store.getLeadById(task.leadId)"
                type="button"
                class="inline-flex items-center gap-1 crm-accent-text hover:underline font-medium cursor-pointer"
                @click="store.openLeadDetailDrawer(task.leadId)"
              >
                <i class="pi pi-building text-[0.625rem]" />
                {{ store.getLeadById(task.leadId)?.company }}
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
