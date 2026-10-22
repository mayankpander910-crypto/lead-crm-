<script setup>
import { computed, ref } from 'vue'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import StatusTag from '@/components/common/StatusTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { PIPELINE_STAGES } from '@/utils/constants'
import { activeThemeMeta } from '@/utils/themeManager'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const confirm = useConfirm()
const toast = useToast()
const {
  formatCurrency,
  formatDate,
  formatShortDate,
  formatTime12h,
  formatRelativeTime,
  isDateOverdue
} = useFormatters()

const newNote = ref('')

const lead = computed(() => store.selectedLead)

const owner = computed(() =>
  lead.value ? store.getUserById(lead.value.assignedTo) : undefined
)

const relatedTasks = computed(() => {
  if (!lead.value) return []
  return store.tasks
    .filter((t) => t.leadId === lead.value?.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const leadActivities = computed(() => {
  if (!lead.value) return []
  return store.activities.filter((a) => a.leadId === lead.value?.id)
})

function handleStageChange(nextStatus) {
  if (!lead.value || nextStatus === lead.value.status) return
  store.updateLead(lead.value.id, { status: nextStatus })
  toast.add({
    severity: 'success',
    summary: 'Pipeline Stage Updated',
    detail: `${lead.value.name} moved to ${nextStatus}.`,
    life: 2500
  })
}

function handleSaveNote() {
  if (!lead.value || !newNote.value.trim()) return
  store.addLeadNote(lead.value.id, newNote.value)
  newNote.value = ''
  toast.add({
    severity: 'success',
    summary: 'Note Saved',
    detail: 'Activity history updated for this lead.',
    life: 2200
  })
}

function handleEditLead() {
  if (!lead.value) return
  const target = lead.value
  store.leadDetailVisible = false
  store.openEditLeadDrawer(target)
}

function handleDeleteLead() {
  if (!lead.value) return
  const target = lead.value
  confirm.require({
    header: 'Delete Lead Record?',
    message: `Are you sure you want to delete ${target.name} (${target.company})? This action removes the lead from your pipeline.`,
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete Lead', severity: 'danger' },
    accept: () => {
      store.deleteLeads([target.id])
      toast.add({
        severity: 'info',
        summary: 'Lead Deleted',
        detail: `${target.name} was removed.`,
        life: 2600
      })
    }
  })
}
</script>

<template>
  <Drawer
    v-model:visible="store.leadDetailVisible"
    position="right"
    class="!w-full sm:!w-[580px]"
    :pt="{
      header: { class: '!px-6 !py-4 border-b border-slate-200' },
      content: { class: '!p-0 bg-slate-50/50' }
    }"
  >
    <template #header>
      <div v-if="lead" class="flex items-center justify-between gap-3 w-full pr-2">
        <div class="flex items-center gap-3 min-w-0">
          <UserAvatar :name="lead.name" :color="activeThemeMeta.hex" size="large" />
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-slate-900 truncate">{{ lead.name }}</h2>
            <p class="text-xs text-slate-500 truncate">
              {{ lead.company }} · {{ lead.category }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            size="small"
            severity="secondary"
            outlined
            @click="handleEditLead"
          />
          <Button
            v-if="store.permissions.canDeleteRecords"
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            aria-label="Delete lead"
            @click="handleDeleteLead"
          />
        </div>
      </div>
    </template>

    <div v-if="lead" class="p-6 space-y-5">
      <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Estimated Deal Value
            </p>
            <p class="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">
              {{ formatCurrency(lead.dealValue) }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <StatusTag :value="lead.priority" variant="priority" />
            <Select
              :model-value="lead.status"
              :options="PIPELINE_STAGES"
              size="small"
              class="!w-38"
              @update:model-value="handleStageChange"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span class="text-slate-400 block">Assigned Rep</span>
            <div class="mt-1 flex items-center gap-1.5 font-medium text-slate-800">
              <UserAvatar
                :name="owner?.name ?? 'Unassigned'"
                :color="owner?.avatarColor ?? '#64748b'"
                small
              />
              <span class="truncate">{{ owner?.name ?? 'Unassigned' }}</span>
            </div>
          </div>

          <div>
            <span class="text-slate-400 block">Next Follow-up</span>
            <span
              class="mt-1.5 inline-flex items-center gap-1 font-medium tabular-nums"
              :class="
                lead.status !== 'Won' &&
                lead.status !== 'Lost' &&
                isDateOverdue(lead.nextFollowUp)
                  ? 'text-rose-600'
                  : 'text-slate-800'
              "
            >
              <i class="pi pi-calendar text-[11px]" />
              {{ formatDate(lead.nextFollowUp) }}
            </span>
          </div>

          <div class="col-span-2 sm:col-span-1">
            <span class="text-slate-400 block">Lead Source</span>
            <span class="mt-1.5 inline-block font-medium text-slate-800">{{ lead.source }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section class="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Contact Details
          </h3>
          <div class="space-y-2 text-xs">
            <div class="flex items-center gap-2 text-slate-700">
              <i class="pi pi-envelope text-slate-400 text-xs shrink-0" />
              <a :href="`mailto:${lead.email}`" class="crm-accent-text hover:underline truncate">
                {{ lead.email }}
              </a>
            </div>
            <div class="flex items-center gap-2 text-slate-700">
              <i class="pi pi-phone text-slate-400 text-xs shrink-0" />
              <a :href="`tel:${lead.phone}`" class="hover:underline">{{ lead.phone }}</a>
            </div>
            <div class="flex items-center gap-2 text-slate-700">
              <i class="pi pi-map-marker text-slate-400 text-xs shrink-0" />
              <span>{{ lead.city }}, {{ lead.state }}</span>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Company Info
          </h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between gap-2">
              <span class="text-slate-400">Company</span>
              <span class="font-medium text-slate-800 text-right">{{ lead.company }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-400">Industry</span>
              <span class="font-medium text-slate-800 text-right">{{ lead.category }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-400">Created</span>
              <span class="font-medium text-slate-800 tabular-nums">
                {{ formatDate(lead.createdAt) }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Notes & Call Summary
        </h3>
        <p
          v-if="lead.notes"
          class="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100"
        >
          {{ lead.notes }}
        </p>
        <p v-else class="text-xs text-slate-400 italic">No notes recorded yet.</p>

        <div class="space-y-2 pt-1">
          <Textarea
            v-model="newNote"
            rows="2"
            placeholder="Add a quick call note or meeting takeaway..."
            class="w-full !text-xs"
          />
          <div class="flex justify-end">
            <Button
              label="Log Note"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              :disabled="!newNote.trim()"
              @click="handleSaveNote"
            />
          </div>
        </div>
      </section>

      <section class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Related Tasks ({{ relatedTasks.length }})
          </h3>
          <Button
            label="Add Task"
            icon="pi pi-plus"
            size="small"
            text
            class="!text-xs !py-1"
            @click="store.openTaskDrawer({ leadId: lead.id })"
          />
        </div>

        <p v-if="relatedTasks.length === 0" class="text-xs text-slate-400 py-2">
          No tasks scheduled for this lead yet.
        </p>

        <ul v-else class="divide-y divide-slate-100">
          <li
            v-for="task in relatedTasks"
            :key="task.id"
            class="py-2.5 flex items-start gap-2.5"
          >
            <Checkbox
              :model-value="task.status === 'Completed'"
              binary
              class="mt-0.5"
              @update:model-value="store.toggleTaskCompletion(task.id)"
            />
            <div class="min-w-0 flex-1">
              <p
                class="text-xs font-medium"
                :class="
                  task.status === 'Completed'
                    ? 'line-through text-slate-400'
                    : 'text-slate-800'
                "
              >
                {{ task.title }}
              </p>
              <span class="text-[11px] text-slate-400 tabular-nums">
                Due {{ formatShortDate(task.dueDate) }}
                <template v-if="task.dueTime">· {{ formatTime12h(task.dueTime) }}</template>
              </span>
            </div>
            <StatusTag :value="store.getTaskBucket(task)" variant="task" />
          </li>
        </ul>
      </section>

      <section class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Activity History
        </h3>

        <p v-if="leadActivities.length === 0" class="text-xs text-slate-400 py-2">
          No recorded activity events yet.
        </p>

        <ul v-else class="space-y-3">
          <li
            v-for="item in leadActivities"
            :key="item.id"
            class="flex items-start justify-between gap-3 text-xs border-l-2 border-slate-200 pl-3"
          >
            <div>
              <p class="font-semibold text-slate-800">{{ item.title }}</p>
              <p class="text-slate-500 mt-0.5">{{ item.description }}</p>
            </div>
            <span class="shrink-0 text-[11px] text-slate-400 tabular-nums">
              {{ formatRelativeTime(item.timestamp) }}
            </span>
          </li>
        </ul>
      </section>
    </div>
  </Drawer>
</template>
