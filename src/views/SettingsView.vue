<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import StatusTag from '@/components/common/StatusTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { PIPELINE_STAGES, USER_ROLES } from '@/utils/constants'
import { THEME_OPTIONS } from '@/utils/themeManager'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const themeList = Object.values(THEME_OPTIONS)

const profileForm = reactive({
  name: store.currentUser.name,
  email: store.currentUser.email,
  password: store.currentUser.password || '',
  role: store.currentUser.role,
  phone: store.currentUser.phone,
  region: store.currentUser.region
})

watch(
  () => store.currentUser,
  (u) => {
    profileForm.name = u.name
    profileForm.email = u.email
    profileForm.password = u.password || ''
    profileForm.role = u.role
    profileForm.phone = u.phone
    profileForm.region = u.region
  },
  { deep: true }
)

const newSourceInput = ref('')

const landingOptions = [
  { label: 'Overview Dashboard', value: '/' },
  { label: 'Leads Management', value: '/leads' },
  { label: 'Sales Pipeline', value: '/pipeline' },
  { label: 'Tasks & Reminders', value: '/tasks' },
  { label: 'Analytics', value: '/analytics' }
]

function saveProfile() {
  if (!profileForm.name.trim() || !profileForm.email.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Missing Details',
      detail: 'Name and email cannot be empty.',
      life: 2500
    })
    return
  }

  store.updateUser(store.currentUser.id, {
    name: profileForm.name.trim(),
    email: profileForm.email.trim(),
    password: profileForm.password.trim() || store.currentUser.password,
    role: store.permissions.isAdmin ? profileForm.role : store.currentUser.role,
    phone: profileForm.phone.trim(),
    region: profileForm.region.trim()
  })

  toast.add({
    severity: 'success',
    summary: 'Profile Saved',
    detail: 'Your account profile and credentials were updated in LocalStorage.',
    life: 2500
  })
}

function handleSwitchSession(userId) {
  store.switchActiveSessionUser(userId)
  toast.add({
    severity: 'info',
    summary: `Switched to ${store.currentUser.name}`,
    detail: `${store.permissions.roleBadge} · ${store.permissions.scopeLabel}`,
    life: 2500
  })
}

function handleSignOut() {
  store.logout()
  toast.add({
    severity: 'info',
    summary: 'Signed Out',
    detail: 'Returned to PulseCRM sign-in screen.',
    life: 2400
  })
  router.push('/login')
}

function toggleStageEnabled(stage, enabled) {
  if (!enabled && store.settings.enabledStatuses.length <= 2) {
    toast.add({
      severity: 'warn',
      summary: 'Minimum Stages',
      detail: 'Keep at least two lead stages enabled.',
      life: 2500
    })
    return
  }
  if (enabled) {
    if (!store.settings.enabledStatuses.includes(stage)) {
      store.settings.enabledStatuses = PIPELINE_STAGES.filter(
        (s) => s === stage || store.settings.enabledStatuses.includes(s)
      )
    }
  } else {
    store.settings.enabledStatuses = store.settings.enabledStatuses.filter((s) => s !== stage)
  }
}

function addCustomSource() {
  const cleaned = newSourceInput.value.trim()
  if (!cleaned) return
  if (store.settings.leadSources.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
    toast.add({
      severity: 'warn',
      summary: 'Duplicate Source',
      detail: `"${cleaned}" already exists in Lead Sources.`,
      life: 2400
    })
    return
  }
  store.settings.leadSources.push(cleaned)
  newSourceInput.value = ''
  toast.add({
    severity: 'success',
    summary: 'Lead Source Added',
    detail: `"${cleaned}" is now selectable in lead forms & filters.`,
    life: 2500
  })
}

function removeLeadSource(src) {
  if (store.settings.leadSources.length <= 1) return
  store.settings.leadSources = store.settings.leadSources.filter((s) => s !== src)
}

function handleExportWorkspaceJson() {
  const backup = {
    exportedAt: new Date().toISOString(),
    settings: store.settings,
    leads: store.allLeads,
    tasks: store.allTasks,
    users: store.users,
    activities: store.allActivities
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pulsecrm-backup.json'
  a.click()
  URL.revokeObjectURL(url)
  toast.add({
    severity: 'success',
    summary: 'Backup Downloaded',
    detail: 'Saved full workspace JSON snapshot.',
    life: 2500
  })
}

function handleResetData() {
  confirm.require({
    header: 'Reset All Demo Data?',
    message:
      'Restore all leads, tasks, team members, and workspace preferences back to initial seed data?',
    icon: 'pi pi-refresh',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Reset Demo Data', severity: 'danger' },
    accept: () => {
      store.resetDemoData()
      toast.add({
        severity: 'info',
        summary: 'Workspace Reset',
        detail: 'Restored original demo dataset.',
        life: 2600
      })
    }
  })
}
</script>

<template>
  <div class="max-w-5xl space-y-6">
    <section class="crm-card p-6 space-y-5">
      <div class="border-b border-slate-100 pb-3.5">
        <h3 class="text-[14px] font-semibold text-slate-900">Theme & Workspace Appearance</h3>
        <p class="mt-0.5 text-xs text-slate-500">
          Select your preferred PrimeVue Aura primary accent color and sidebar surface finish.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          v-for="opt in themeList"
          :key="opt.key"
          type="button"
          class="flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer"
          :class="
            store.settings.themePreset === opt.key
              ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
              : 'border-slate-200 hover:border-slate-300'
          "
          @click="store.setTheme(opt.key)"
        >
          <span
            class="mt-0.5 h-4 w-4 rounded-full shrink-0"
            :style="{ backgroundColor: opt.hex }"
          />
          <div>
            <p class="text-xs font-semibold text-slate-900">{{ opt.label }}</p>
            <p class="mt-0.5 text-[11px] text-slate-500">{{ opt.description }}</p>
          </div>
        </button>
      </div>

      <div class="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
        <div>
          <p class="text-xs font-semibold text-slate-800">Navigation Sidebar Style</p>
          <p class="text-xs text-slate-500">
            Choose high-contrast executive dark slate or minimal light sidebar.
          </p>
        </div>

        <div class="inline-flex rounded-lg bg-slate-100 p-1 gap-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
            :class="
              store.settings.sidebarStyle === 'dark'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            "
            @click="store.setSidebarStyle('dark')"
          >
            Slate Dark
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
            :class="
              store.settings.sidebarStyle === 'light'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            "
            @click="store.setSidebarStyle('light')"
          >
            Clean Light
          </button>
        </div>
      </div>
    </section>

    <section class="crm-card p-6 space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div class="flex items-center gap-3.5">
          <UserAvatar
            :name="store.currentUser.name"
            :color="store.currentUser.avatarColor"
            size="large"
          />
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-[14px] font-semibold text-slate-900">Account & Session Profile</h3>
              <StatusTag :value="store.currentUser.role" variant="role" />
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Update your profile details, change your login password, or switch roles anytime.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Select
            :model-value="store.currentUser.id"
            :options="store.users"
            option-label="name"
            option-value="id"
            size="small"
            class="!text-xs w-48"
            @update:model-value="handleSwitchSession"
          />
          <Button
            label="Sign Out"
            icon="pi pi-sign-out"
            severity="danger"
            outlined
            size="small"
            class="!text-xs"
            @click="handleSignOut"
          />
        </div>
      </div>

      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="saveProfile">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Full Name</label>
          <InputText v-model="profileForm.name" size="small" class="w-full" />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Work Email</label>
          <InputText v-model="profileForm.email" type="email" size="small" class="w-full" />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Login Password</label>
          <InputText
            v-model="profileForm.password"
            placeholder="Account password"
            size="small"
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">Territory / Region</label>
          <InputText v-model="profileForm.region" size="small" class="w-full" />
        </div>

        <div v-if="store.permissions.isAdmin" class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-700">System Role</label>
          <Select v-model="profileForm.role" :options="USER_ROLES" size="small" class="w-full" />
        </div>

        <div class="sm:col-span-2 flex justify-end pt-1">
          <Button label="Save Profile" icon="pi pi-check" size="small" type="submit" />
        </div>
      </form>
    </section>

    <template v-if="store.permissions.canManageWorkspaceSettings">
      <section class="crm-card p-6 space-y-5">
        <div class="border-b border-slate-100 pb-3.5">
          <h3 class="text-[14px] font-semibold text-slate-900">Organization Display Defaults</h3>
          <p class="mt-0.5 text-xs text-slate-500">
            Configure workspace branding, default pagination size, and KPI comparison badges.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">CRM Workspace Name</label>
            <InputText v-model="store.settings.workspaceName" size="small" class="w-full" />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Default Landing Page</label>
            <Select
              v-model="store.settings.defaultLandingRoute"
              :options="landingOptions"
              option-label="label"
              option-value="value"
              size="small"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Default Table Rows</label>
            <Select
              v-model="store.settings.defaultTableRows"
              :options="[10, 20, 50]"
              size="small"
              class="w-full"
            />
          </div>
        </div>

        <div class="divide-y divide-slate-100 pt-2">
          <div class="py-3 flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold text-slate-800">Show 30-Day Historical KPI Trends</p>
              <p class="text-xs text-slate-500">
                Display period-over-period comparison badges on Overview cards.
              </p>
            </div>
            <ToggleSwitch v-model="store.settings.showKpiTrends" />
          </div>

          <div class="py-3 flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold text-slate-800">Compact Table Density</p>
              <p class="text-xs text-slate-500">
                Fit more rows comfortably on smaller laptop screens.
              </p>
            </div>
            <ToggleSwitch v-model="store.settings.compactTables" />
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section class="crm-card p-6 space-y-4">
          <div>
            <h3 class="text-[14px] font-semibold text-slate-900">Lead Pipeline Statuses</h3>
            <p class="mt-0.5 text-xs text-slate-500">
              Configure active pipeline stages available when creating or editing leads.
            </p>
          </div>

          <ul class="divide-y divide-slate-100">
            <li
              v-for="stage in PIPELINE_STAGES"
              :key="stage"
              class="py-2.5 flex items-center justify-between gap-3"
            >
              <StatusTag :value="stage" variant="stage" />
              <Checkbox
                :model-value="store.settings.enabledStatuses.includes(stage)"
                binary
                @update:model-value="(val) => toggleStageEnabled(stage, val)"
              />
            </li>
          </ul>
        </section>

        <section class="crm-card p-6 space-y-4">
          <div>
            <h3 class="text-[14px] font-semibold text-slate-900">Lead Acquisition Sources</h3>
            <p class="mt-0.5 text-xs text-slate-500">
              Manage attribution channels shown in forms, tables, and analytics.
            </p>
          </div>

          <form class="flex gap-2" @submit.prevent="addCustomSource">
            <InputText
              v-model="newSourceInput"
              placeholder="e.g. Partner Trade Show"
              size="small"
              class="flex-1"
            />
            <Button label="Add" icon="pi pi-plus" size="small" type="submit" />
          </form>

          <div class="flex flex-wrap gap-2 pt-1">
            <span
              v-for="src in store.settings.leadSources"
              :key="src"
              class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              <span>{{ src }}</span>
              <button
                type="button"
                aria-label="Remove source"
                class="text-slate-400 hover:text-rose-600 cursor-pointer"
                @click="removeLeadSource(src)"
              >
                <i class="pi pi-times text-[10px]" />
              </button>
            </span>
          </div>
        </section>
      </div>
    </template>

    <section
      v-else
      class="crm-card p-5 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="space-y-1">
        <p class="text-xs font-semibold text-slate-900">
          Organization Pipeline & System Controls (Admin Role Required)
        </p>
        <p class="text-xs text-slate-500 leading-relaxed max-w-2xl">
          You are currently signed in as a <strong>{{ store.permissions.roleBadge }}</strong> ({{ store.permissions.scopeLabel }}). Switch to an <strong>Admin</strong> account to customize global pipeline stages, lead attribution sources, or reset workspace demo data.
        </p>
      </div>
      <Button
        label="Switch to Admin"
        icon="pi pi-shield"
        severity="secondary"
        outlined
        size="small"
        class="!bg-white !text-xs shrink-0"
        @click="handleSwitchSession('usr-1')"
      />
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="crm-card p-6 space-y-4">
        <div>
          <h3 class="text-[14px] font-semibold text-slate-900">In-App Notification Preferences</h3>
          <p class="mt-0.5 text-xs text-slate-500">
            Control which sales events create alerts in the top notification feed.
          </p>
        </div>

        <div class="divide-y divide-slate-100">
          <div class="py-2.5 flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-slate-700">Overdue task reminders</span>
            <ToggleSwitch v-model="store.settings.notifications.overdueTaskAlerts" />
          </div>
          <div class="py-2.5 flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-slate-700">New lead assignment alerts</span>
            <ToggleSwitch v-model="store.settings.notifications.newLeadAssignment" />
          </div>
          <div class="py-2.5 flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-slate-700">Closed-won deal celebrations</span>
            <ToggleSwitch v-model="store.settings.notifications.stageWinCelebrations" />
          </div>
          <div class="py-2.5 flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-slate-700">Daily pipeline summary banner</span>
            <ToggleSwitch v-model="store.settings.notifications.dailyPipelineDigest" />
          </div>
        </div>
      </section>

      <section class="crm-card p-6 flex flex-col justify-between gap-4">
        <div>
          <h3 class="text-[14px] font-semibold text-slate-900">LocalStorage & Workspace Backup</h3>
          <p class="mt-1 text-xs leading-relaxed text-slate-500">
            All changes to leads, pipeline stages, tasks, and user accounts persist automatically in browser LocalStorage. Export a JSON snapshot anytime{{ store.permissions.isAdmin ? ' or reset back to clean seed data' : '' }}.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <Button
            label="Export JSON Backup"
            icon="pi pi-download"
            severity="secondary"
            outlined
            size="small"
            @click="handleExportWorkspaceJson"
          />
          <Button
            v-if="store.permissions.isAdmin"
            label="Reset Demo Data"
            icon="pi pi-refresh"
            severity="danger"
            outlined
            size="small"
            @click="handleResetData"
          />
        </div>
      </section>
    </div>
  </div>
</template>
