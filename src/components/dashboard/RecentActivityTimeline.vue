<script setup>
import { computed } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const { formatRelativeTime } = useFormatters()

const recentActivities = computed(() => store.activities.slice(0, 7))

function activityVisual(type) {
  switch (type) {
    case 'deal_won':
      return { box: 'bg-emerald-50 text-emerald-600', icon: 'pi pi-trophy' }
    case 'stage_changed':
      return { box: 'bg-sky-50 text-sky-600', icon: 'pi pi-arrow-right-arrow-left' }
    case 'lead_created':
      return { box: 'bg-blue-50 text-blue-600', icon: 'pi pi-user-plus' }
    case 'task_completed':
      return { box: 'bg-teal-50 text-teal-600', icon: 'pi pi-check' }
    case 'note_added':
      return { box: 'bg-amber-50 text-amber-600', icon: 'pi pi-file-edit' }
    default:
      return { box: 'bg-slate-100 text-slate-600', icon: 'pi pi-bolt' }
  }
}
</script>

<template>
  <div class="crm-card overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100">
      <h3 class="text-[14px] font-semibold text-slate-900">Recent Activity</h3>
      <p class="mt-0.5 text-xs text-slate-500">Real-time team updates across deals & tasks</p>
    </div>

    <EmptyState
      v-if="recentActivities.length === 0"
      icon="pi pi-history"
      title="No activity yet"
      description="Actions taken across leads and pipeline stages appear here automatically."
      compact
    />

    <div v-else class="p-5">
      <ol class="relative border-l border-slate-200 ml-3.5 space-y-5">
        <li v-for="act in recentActivities" :key="act.id" class="ml-6">
          <span
            class="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white"
            :class="activityVisual(act.type).box"
          >
            <i :class="[activityVisual(act.type).icon, 'text-[11px]']" />
          </span>

          <div class="flex items-baseline justify-between gap-2">
            <p class="text-xs font-semibold text-slate-900">{{ act.title }}</p>
            <time class="shrink-0 text-[11px] text-slate-400 tabular-nums">
              {{ formatRelativeTime(act.timestamp) }}
            </time>
          </div>

          <p class="mt-0.5 text-xs text-slate-600 leading-relaxed">
            {{ act.description }}
          </p>

          <div class="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            <span>{{ store.getUserName(act.userId) }}</span>
            <template v-if="act.leadId && store.getLeadById(act.leadId)">
              <span>·</span>
              <button
                type="button"
                class="crm-accent-text hover:underline font-medium cursor-pointer"
                @click="store.openLeadDetailDrawer(act.leadId)"
              >
                View lead
              </button>
            </template>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>
