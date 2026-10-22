<script setup>
import { computed, reactive, ref, watch } from 'vue'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { LEAD_PRIORITIES } from '@/utils/constants'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const toast = useToast()

const isEditMode = computed(() => Boolean(store.editingTask))

const TIME_SLOTS = [
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30'
]

const form = reactive({
  title: '',
  description: '',
  dueDateObj: new Date(),
  dueTime: '10:00',
  priority: 'Medium',
  status: 'Pending',
  assignedTo: 'usr-1',
  leadId: ''
})

const titleError = ref('')

function toDateObj(iso) {
  if (!iso) return new Date()
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function toIsoDate(d) {
  const target = d ?? new Date()
  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const day = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

watch(
  () => store.taskFormVisible,
  (visible) => {
    if (!visible) return
    titleError.value = ''
    const editing = store.editingTask
    if (editing) {
      form.title = editing.title
      form.description = editing.description
      form.dueDateObj = toDateObj(editing.dueDate)
      form.dueTime = editing.dueTime || '10:00'
      form.priority = editing.priority
      form.status = editing.status
      form.assignedTo = editing.assignedTo
      form.leadId = editing.leadId
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      form.title = ''
      form.description = ''
      form.dueDateObj = tomorrow
      form.dueTime = '10:30'
      form.priority = 'Medium'
      form.status = 'Pending'
      form.assignedTo = store.currentUser.id
      form.leadId = store.preselectedTaskLeadId || ''
    }
  }
)

const leadOptions = computed(() => [
  { label: 'General Task (No linked lead)', value: '' },
  ...store.leads.map((l) => ({
    label: `${l.name} — ${l.company}`,
    value: l.id
  }))
])

function handleSave() {
  if (!form.title.trim()) {
    titleError.value = 'Task title is required.'
    return
  }

  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    dueDate: toIsoDate(form.dueDateObj),
    dueTime: form.dueTime,
    priority: form.priority,
    status: form.status,
    assignedTo: store.permissions.canReassignLeads ? form.assignedTo : store.currentUser.id,
    leadId: form.leadId
  }

  if (store.editingTask) {
    store.updateTask(store.editingTask.id, payload)
    toast.add({
      severity: 'success',
      summary: 'Task Updated',
      detail: `"${payload.title}" updated.`,
      life: 2500
    })
  } else {
    store.createTask(payload)
    toast.add({
      severity: 'success',
      summary: 'Task Scheduled',
      detail: `"${payload.title}" added to reminders.`,
      life: 2500
    })
  }

  store.taskFormVisible = false
}
</script>

<template>
  <Drawer
    v-model:visible="store.taskFormVisible"
    position="right"
    class="!w-full sm:!w-[480px]"
    :pt="{
      header: { class: '!px-6 !py-4 border-b border-slate-200' },
      content: { class: '!p-0' },
      footer: { class: '!px-6 !py-4 border-t border-slate-200 bg-slate-50/70' }
    }"
  >
    <template #header>
      <div>
        <h2 class="text-base font-semibold text-slate-900">
          {{ isEditMode ? 'Edit Follow-up Task' : 'New Task & Reminder' }}
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Schedule in-app sales reminders linked to a prospect or team member.
        </p>
      </div>
    </template>

    <form id="task-form" class="p-6 space-y-4" @submit.prevent="handleSave">
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-700">
          Task Title <span class="text-rose-500">*</span>
        </label>
        <InputText
          v-model="form.title"
          placeholder="e.g. Follow up on MSA review call"
          size="small"
          class="w-full"
          :invalid="Boolean(titleError)"
        />
        <p v-if="titleError" class="text-[11px] text-rose-600">{{ titleError }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Due Date</label>
          <DatePicker
            v-model="form.dueDateObj"
            date-format="yy-mm-dd"
            show-icon
            size="small"
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Reminder Time</label>
          <Select v-model="form.dueTime" :options="TIME_SLOTS" size="small" class="w-full" />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Priority</label>
          <Select v-model="form.priority" :options="LEAD_PRIORITIES" size="small" class="w-full" />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Status</label>
          <Select
            v-model="form.status"
            :options="['Pending', 'Completed']"
            size="small"
            class="w-full"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-700">Assigned Employee</label>
        <Select
          v-if="store.permissions.canReassignLeads"
          v-model="form.assignedTo"
          :options="store.users"
          option-label="name"
          option-value="id"
          size="small"
          class="w-full"
        />
        <div
          v-else
          class="h-8.5 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center gap-2 text-xs text-slate-700"
        >
          <UserAvatar
            :name="store.currentUser.name"
            :color="store.currentUser.avatarColor"
            small
          />
          <span class="truncate font-medium">{{ store.currentUser.name }} (You)</span>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-700">Related Lead</label>
        <Select
          v-model="form.leadId"
          :options="leadOptions"
          option-label="label"
          option-value="value"
          filter
          size="small"
          class="w-full"
        />
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-700">Description / Call Agenda</label>
        <Textarea
          v-model="form.description"
          rows="3"
          auto-resize
          placeholder="Add agenda items, talking points, or deliverables..."
          class="w-full !text-sm"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          size="small"
          @click="store.taskFormVisible = false"
        />
        <Button
          :label="isEditMode ? 'Update Task' : 'Create Task'"
          icon="pi pi-check"
          size="small"
          type="submit"
          form="task-form"
        />
      </div>
    </template>
  </Drawer>
</template>
