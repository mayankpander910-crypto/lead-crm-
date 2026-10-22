<script setup>
import { computed, reactive, ref, watch } from 'vue'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { LEAD_PRIORITIES, PIPELINE_STAGES, US_STATES } from '@/utils/constants'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const toast = useToast()

const isEditMode = computed(() => Boolean(store.editingLead))

const form = reactive({
  name: '',
  company: '',
  email: '',
  phone: '',
  state: 'California',
  city: '',
  category: 'SaaS & Cloud',
  source: 'Website',
  status: 'New',
  priority: 'Medium',
  assignedTo: 'usr-1',
  dealValue: 45000,
  nextFollowUpDate: null,
  notes: ''
})

const errors = ref({})

function parseIsoDate(iso) {
  if (!iso) return null
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDateToIso(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function populateForm() {
  errors.value = {}
  const lead = store.editingLead
  if (lead) {
    form.name = lead.name
    form.company = lead.company
    form.email = lead.email
    form.phone = lead.phone
    form.state = lead.state
    form.city = lead.city
    form.category = lead.category
    form.source = lead.source
    form.status = lead.status
    form.priority = lead.priority
    form.assignedTo = lead.assignedTo
    form.dealValue = lead.dealValue
    form.nextFollowUpDate = parseIsoDate(lead.nextFollowUp)
    form.notes = lead.notes
  } else {
    const defaultFollowUp = new Date()
    defaultFollowUp.setDate(defaultFollowUp.getDate() + 3)

    form.name = ''
    form.company = ''
    form.email = ''
    form.phone = ''
    form.state = 'California'
    form.city = ''
    form.category = store.settings.leadCategories[0] ?? 'SaaS & Cloud'
    form.source = store.settings.leadSources[0] ?? 'Website'
    form.status = store.defaultNewLeadStatus ?? 'New'
    form.priority = 'Medium'
    form.assignedTo = store.currentUser.id
    form.dealValue = 45000
    form.nextFollowUpDate = defaultFollowUp
    form.notes = ''
  }
}

watch(
  () => store.leadFormVisible,
  (visible) => {
    if (visible) populateForm()
  }
)

const statusOptions = computed(() =>
  store.settings.enabledStatuses.length > 0 ? store.settings.enabledStatuses : PIPELINE_STAGES
)

const employeeOptions = computed(() =>
  store.users.map((u) => ({
    label: `${u.name} (${u.role === 'Sales Representative' ? 'Worker' : u.role})`,
    value: u.id
  }))
)

function validate() {
  const nextErrors = {}

  if (!form.name.trim()) nextErrors.name = 'Full name is required.'
  if (!form.company.trim()) nextErrors.company = 'Company name is required.'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    nextErrors.email = 'Work email is required.'
  } else if (!emailRegex.test(form.email.trim())) {
    nextErrors.email = 'Enter a valid email address (e.g. alex@company.com).'
  }

  if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.'
  if (!form.state) nextErrors.state = 'Select a state or region.'
  if (!form.city.trim()) nextErrors.city = 'City is required.'
  if (form.dealValue === null || form.dealValue < 0) {
    nextErrors.dealValue = 'Enter a valid deal amount ($0 or more).'
  }

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

function handleSubmit() {
  if (!validate()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please check the highlighted required fields before saving.',
      life: 3200
    })
    return
  }

  const payload = {
    name: form.name.trim(),
    company: form.company.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    state: form.state,
    city: form.city.trim(),
    category: form.category,
    source: form.source,
    status: form.status,
    priority: form.priority,
    assignedTo: store.permissions.canReassignLeads ? form.assignedTo : store.currentUser.id,
    dealValue: Number(form.dealValue) || 0,
    nextFollowUp: formatDateToIso(form.nextFollowUpDate),
    notes: form.notes.trim()
  }

  if (store.editingLead) {
    store.updateLead(store.editingLead.id, payload)
    toast.add({
      severity: 'success',
      summary: 'Lead Updated',
      detail: `${payload.name} (${payload.company}) has been updated.`,
      life: 2800
    })
  } else {
    store.createLead(payload)
    toast.add({
      severity: 'success',
      summary: 'Lead Created',
      detail: `${payload.name} added to ${payload.status} pipeline stage.`,
      life: 2800
    })
  }

  store.leadFormVisible = false
}
</script>

<template>
  <Drawer
    v-model:visible="store.leadFormVisible"
    position="right"
    class="!w-full sm:!w-[33.75rem]"
    :pt="{
      header: { class: '!px-6 !py-4 border-b border-slate-200' },
      content: { class: '!p-0' },
      footer: { class: '!px-6 !py-4 border-t border-slate-200 bg-slate-50/70' }
    }"
  >
    <template #header>
      <div>
        <h2 class="text-base font-semibold text-slate-900">
          {{ isEditMode ? 'Edit Lead Record' : 'Add New Sales Lead' }}
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          {{
            isEditMode
              ? 'Update contact details, stage ownership, or next follow-up date.'
              : 'Enter prospect details to track them across your pipeline and analytics.'
          }}
        </p>
      </div>
    </template>

    <form id="lead-form" class="p-6 space-y-6" @submit.prevent="handleSubmit">
      <section class="space-y-4">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Contact & Company
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              Full Name <span class="text-rose-500">*</span>
            </label>
            <InputText
              v-model="form.name"
              placeholder="e.g. Jordan Taylor"
              size="small"
              class="w-full"
              :invalid="Boolean(errors.name)"
            />
            <p v-if="errors.name" class="text-[0.6875rem] text-rose-600">{{ errors.name }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              Company <span class="text-rose-500">*</span>
            </label>
            <InputText
              v-model="form.company"
              placeholder="e.g. Acme Cloud Corp"
              size="small"
              class="w-full"
              :invalid="Boolean(errors.company)"
            />
            <p v-if="errors.company" class="text-[0.6875rem] text-rose-600">{{ errors.company }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              Email <span class="text-rose-500">*</span>
            </label>
            <InputText
              v-model="form.email"
              type="email"
              placeholder="jordan@acmecloud.com"
              size="small"
              class="w-full"
              :invalid="Boolean(errors.email)"
            />
            <p v-if="errors.email" class="text-[0.6875rem] text-rose-600">{{ errors.email }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              Phone <span class="text-rose-500">*</span>
            </label>
            <InputText
              v-model="form.phone"
              placeholder="+1 (415) 555-0192"
              size="small"
              class="w-full"
              :invalid="Boolean(errors.phone)"
            />
            <p v-if="errors.phone" class="text-[0.6875rem] text-rose-600">{{ errors.phone }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              State / Region <span class="text-rose-500">*</span>
            </label>
            <Select
              v-model="form.state"
              :options="US_STATES"
              filter
              size="small"
              placeholder="Select state"
              class="w-full"
              :invalid="Boolean(errors.state)"
            />
            <p v-if="errors.state" class="text-[0.6875rem] text-rose-600">{{ errors.state }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">
              City <span class="text-rose-500">*</span>
            </label>
            <InputText
              v-model="form.city"
              placeholder="e.g. San Francisco"
              size="small"
              class="w-full"
              :invalid="Boolean(errors.city)"
            />
            <p v-if="errors.city" class="text-[0.6875rem] text-rose-600">{{ errors.city }}</p>
          </div>
        </div>
      </section>

      <section class="space-y-4 pt-2 border-t border-slate-100">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Pipeline & Qualification
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Industry / Category</label>
            <Select
              v-model="form.category"
              :options="store.settings.leadCategories"
              size="small"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Lead Source</label>
            <Select
              v-model="form.source"
              :options="store.settings.leadSources"
              size="small"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Lead Status</label>
            <Select
              v-model="form.status"
              :options="statusOptions"
              size="small"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Priority</label>
            <Select
              v-model="form.priority"
              :options="LEAD_PRIORITIES"
              size="small"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Assigned Employee</label>
            <Select
              v-if="store.permissions.canReassignLeads"
              v-model="form.assignedTo"
              :options="employeeOptions"
              option-label="label"
              option-value="value"
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
            <label class="block text-xs font-medium text-slate-700">Deal Value (USD)</label>
            <InputNumber
              v-model="form.dealValue"
              mode="currency"
              currency="USD"
              locale="en-US"
              :max-fraction-digits="0"
              :min="0"
              size="small"
              class="w-full"
              input-class="w-full"
              :invalid="Boolean(errors.dealValue)"
            />
            <p v-if="errors.dealValue" class="text-[0.6875rem] text-rose-600">
              {{ errors.dealValue }}
            </p>
          </div>

          <div class="space-y-1.5 sm:col-span-2">
            <label class="block text-xs font-medium text-slate-700">Next Follow-up Date</label>
            <DatePicker
              v-model="form.nextFollowUpDate"
              date-format="yy-mm-dd"
              show-icon
              show-button-bar
              placeholder="Select follow-up date"
              size="small"
              class="w-full"
            />
          </div>
        </div>
      </section>

      <section class="space-y-2 pt-2 border-t border-slate-100">
        <label class="block text-xs font-medium text-slate-700">Sales Notes & Context</label>
        <Textarea
          v-model="form.notes"
          rows="4"
          auto-resize
          placeholder="Capture call takeaways, decision makers, budget notes, or blockers..."
          class="w-full !text-sm"
        />
      </section>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          size="small"
          @click="store.leadFormVisible = false"
        />
        <Button
          :label="isEditMode ? 'Save Changes' : 'Create Lead'"
          icon="pi pi-check"
          size="small"
          type="submit"
          form="lead-form"
        />
      </div>
    </template>
  </Drawer>
</template>
