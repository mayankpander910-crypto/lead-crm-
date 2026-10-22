import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import leadsSeed from '@/data/leads.json'
import usersSeed from '@/data/users.json'
import tasksSeed from '@/data/tasks.json'
import activitiesSeed from '@/data/activities.json'
import notificationsSeed from '@/data/notifications.json'
import {
  clearCrmStorage,
  cloneSeed,
  loadCollectionFromStorage,
  loadNullableFromStorage,
  loadObjectFromStorage,
  saveToStorage,
  STORAGE_KEYS
} from '@/services/storageService'
import {
  DEFAULT_LEAD_CATEGORIES,
  DEFAULT_LEAD_SOURCES,
  PIPELINE_STAGES
} from '@/utils/constants'
import { applyTextSize, applyThemePreset } from '@/utils/themeManager'

const DEFAULT_SETTINGS = {
  workspaceName: 'PulseCRM',
  currentUserId: 'usr-1',
  themePreset: 'blue',
  sidebarStyle: 'dark',
  textSize: 'm',
  defaultLandingRoute: '/',
  defaultTableRows: 10,
  compactTables: false,
  showKpiTrends: true,
  enabledStatuses: [...PIPELINE_STAGES],
  leadSources: [...DEFAULT_LEAD_SOURCES],
  leadCategories: [...DEFAULT_LEAD_CATEGORIES],
  notifications: {
    overdueTaskAlerts: true,
    newLeadAssignment: true,
    stageWinCelebrations: true,
    dailyPipelineDigest: true
  }
}

export const useCrmStore = defineStore('crm', () => {
  const allLeads = ref(loadCollectionFromStorage(STORAGE_KEYS.leads, leadsSeed))
  const users = ref(loadCollectionFromStorage(STORAGE_KEYS.users, usersSeed))
  const allTasks = ref(loadCollectionFromStorage(STORAGE_KEYS.tasks, tasksSeed))
  const allActivities = ref(loadCollectionFromStorage(STORAGE_KEYS.activities, activitiesSeed))
  const notifications = ref(
    loadCollectionFromStorage(STORAGE_KEYS.notifications, notificationsSeed)
  )
  const settings = ref(loadObjectFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS))
  const sidebarCollapsed = ref(
    loadObjectFromStorage(STORAGE_KEYS.sidebarCollapsed, { value: false }).value
  )
  const authSession = ref(loadNullableFromStorage(STORAGE_KEYS.authSession))

  applyThemePreset(settings.value.themePreset || 'blue')
  applyTextSize(settings.value.textSize || 'm')

  watch(
    () => settings.value.themePreset,
    (nextTheme) => {
      if (nextTheme) applyThemePreset(nextTheme)
    }
  )

  watch(
    () => settings.value.textSize,
    (nextSize) => {
      applyTextSize(nextSize || 'm')
    }
  )

  const globalSearchQuery = ref('')
  const leadFormVisible = ref(false)
  const editingLead = ref(null)
  const defaultNewLeadStatus = ref('New')

  const leadDetailVisible = ref(false)
  const selectedLeadId = ref(null)

  const taskFormVisible = ref(false)
  const editingTask = ref(null)
  const preselectedTaskLeadId = ref('')

  watch(allLeads, (val) => saveToStorage(STORAGE_KEYS.leads, val), { deep: true })
  watch(users, (val) => saveToStorage(STORAGE_KEYS.users, val), { deep: true })
  watch(allTasks, (val) => saveToStorage(STORAGE_KEYS.tasks, val), { deep: true })
  watch(allActivities, (val) => saveToStorage(STORAGE_KEYS.activities, val), { deep: true })
  watch(notifications, (val) => saveToStorage(STORAGE_KEYS.notifications, val), { deep: true })
  watch(settings, (val) => saveToStorage(STORAGE_KEYS.settings, val), { deep: true })
  watch(sidebarCollapsed, (val) => saveToStorage(STORAGE_KEYS.sidebarCollapsed, { value: val }))
  watch(authSession, (val) => saveToStorage(STORAGE_KEYS.authSession, val), { deep: true })

  const usersMap = computed(() => {
    const map = new Map()
    for (const u of users.value) map.set(u.id, u)
    return map
  })

  const leadsMap = computed(() => {
    const map = new Map()
    for (const l of allLeads.value) map.set(l.id, l)
    return map
  })

  const isAuthenticated = computed(() => {
    if (!authSession.value?.userId) return false
    return usersMap.value.has(authSession.value.userId)
  })

  const currentUser = computed(() => {
    const activeId = authSession.value?.userId ?? settings.value.currentUserId
    return (
      usersMap.value.get(activeId) ??
      users.value[0] ?? {
        id: 'usr-1',
        name: 'Elena Rostova',
        email: 'elena.rostova@pulsecrm.io',
        password: 'Admin@123',
        role: 'Admin',
        status: 'Active',
        department: 'Revenue Operations',
        region: 'National',
        avatarColor: '#2563eb',
        monthlyQuota: 180000,
        phone: '+1 (415) 890-3412'
      }
    )
  })

  const permissions = computed(() => {
    const role = currentUser.value.role
    if (role === 'Admin') {
      return {
        isAdmin: true,
        isManager: false,
        isWorker: false,
        roleBadge: 'Admin',
        scopeLabel: 'Organization Access',
        canViewAllRecords: true,
        canReassignLeads: true,
        canDeleteRecords: true,
        canViewTeam: true,
        canManageTeam: true,
        canManageWorkspaceSettings: true
      }
    }
    if (role === 'Sales Manager') {
      return {
        isAdmin: false,
        isManager: true,
        isWorker: false,
        roleBadge: 'Manager',
        scopeLabel: 'Team Oversight',
        canViewAllRecords: true,
        canReassignLeads: true,
        canDeleteRecords: false,
        canViewTeam: true,
        canManageTeam: false,
        canManageWorkspaceSettings: false
      }
    }
    return {
      isAdmin: false,
      isManager: false,
      isWorker: true,
      roleBadge: 'Worker',
      scopeLabel: 'Personal Assigned Leads',
      canViewAllRecords: false,
      canReassignLeads: false,
      canDeleteRecords: false,
      canViewTeam: false,
      canManageTeam: false,
      canManageWorkspaceSettings: false
    }
  })

  const leads = computed(() => {
    if (permissions.value.canViewAllRecords) return allLeads.value
    const myId = currentUser.value.id
    return allLeads.value.filter((l) => l.assignedTo === myId)
  })

  const myLeadIdSet = computed(() => new Set(leads.value.map((l) => l.id)))

  const tasks = computed(() => {
    if (permissions.value.canViewAllRecords) return allTasks.value
    const myId = currentUser.value.id
    return allTasks.value.filter(
      (t) => t.assignedTo === myId || (t.leadId && myLeadIdSet.value.has(t.leadId))
    )
  })

  const activities = computed(() => {
    if (permissions.value.canViewAllRecords) return allActivities.value
    const myId = currentUser.value.id
    return allActivities.value.filter(
      (a) => a.userId === myId || (a.leadId && myLeadIdSet.value.has(a.leadId))
    )
  })

  const selectedLead = computed(() => {
    if (!selectedLeadId.value) return null
    return leadsMap.value.get(selectedLeadId.value) ?? null
  })

  function login(email, password, remember = true) {
    const normalizedEmail = email.trim().toLowerCase()
    const matched = users.value.find((u) => u.email.trim().toLowerCase() === normalizedEmail)
    if (!matched) {
      return { ok: false, error: 'No account found with that work email address.' }
    }
    const expectedPassword = matched.password || 'Worker@123'
    if (password !== expectedPassword) {
      return { ok: false, error: 'Incorrect password. Please try again.' }
    }

    settings.value.currentUserId = matched.id
    authSession.value = {
      userId: matched.id,
      loginAt: new Date().toISOString(),
      remember
    }
    globalSearchQuery.value = ''
    return { ok: true, user: matched }
  }

  function logout() {
    authSession.value = null
    selectedLeadId.value = null
    leadDetailVisible.value = false
    leadFormVisible.value = false
    taskFormVisible.value = false
    globalSearchQuery.value = ''
  }

  function switchActiveSessionUser(userId) {
    const target = usersMap.value.get(userId)
    if (!target) return
    settings.value.currentUserId = target.id
    if (authSession.value) {
      authSession.value = {
        ...authSession.value,
        userId: target.id,
        loginAt: new Date().toISOString()
      }
    }
  }

  function getUserById(userId) {
    if (!userId) return undefined
    return usersMap.value.get(userId)
  }

  function getUserName(userId) {
    return getUserById(userId)?.name ?? 'Unassigned'
  }

  function getLeadById(leadId) {
    if (!leadId) return undefined
    return leadsMap.value.get(leadId)
  }

  function getTodayStr() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`
  }

  function getTaskBucket(task) {
    if (task.status === 'Completed') return 'Completed'
    const today = getTodayStr()
    if (task.dueDate < today) return 'Overdue'
    return 'Upcoming'
  }

  const kpiMetrics = computed(() => {
    const scoped = leads.value
    const totalLeads = scoped.length
    const newLeads = scoped.filter((l) => l.status === 'New').length
    const qualifiedStages = ['Qualified', 'Proposal', 'Negotiation']
    const qualifiedLeads = scoped.filter((l) => qualifiedStages.includes(l.status)).length
    const wonLeads = scoped.filter((l) => l.status === 'Won')
    const lostLeads = scoped.filter((l) => l.status === 'Lost')

    const totalWonValue = wonLeads.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0)
    const activePipelineValue = scoped
      .filter((l) => l.status !== 'Won' && l.status !== 'Lost')
      .reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0)

    const nowMs = Date.now()
    const dayMs = 86_400_000
    const recentStart = nowMs - 30 * dayMs
    const prevStart = nowMs - 60 * dayMs

    const calcWindowTrend = (items, dateSelector) => {
      const recent = items.filter((l) => {
        const raw = dateSelector(l)
        const ts = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw).getTime()
        return ts >= recentStart && ts <= nowMs + dayMs
      }).length
      const previous = items.filter((l) => {
        const raw = dateSelector(l)
        const ts = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw).getTime()
        return ts >= prevStart && ts < recentStart
      }).length
      if (previous === 0) return null
      return Math.round(((recent - previous) / previous) * 1000) / 10
    }

    const overallConversionRate =
      totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 1000) / 10 : 0
    const closedTotal = wonLeads.length + lostLeads.length
    const closedWinRate =
      closedTotal > 0 ? Math.round((wonLeads.length / closedTotal) * 1000) / 10 : 0

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      wonDealsCount: wonLeads.length,
      lostDealsCount: lostLeads.length,
      totalWonValue,
      activePipelineValue,
      overallConversionRate,
      closedWinRate,
      trends: {
        totalLeads: calcWindowTrend(scoped, (l) => l.createdAt),
        newLeads: calcWindowTrend(
          scoped.filter((l) => l.status !== 'Lost'),
          (l) => l.createdAt
        ),
        qualifiedLeads: calcWindowTrend(
          scoped.filter((l) => qualifiedStages.includes(l.status) || l.status === 'Won'),
          (l) => l.createdAt
        ),
        wonDeals: calcWindowTrend(wonLeads, (l) => l.updatedAt || l.createdAt)
      }
    }
  })

  const overdueTasks = computed(() =>
    tasks.value
      .filter((t) => getTaskBucket(t) === 'Overdue')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  )

  const upcomingTasks = computed(() =>
    tasks.value
      .filter((t) => getTaskBucket(t) === 'Upcoming')
      .sort((a, b) => `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`))
  )

  const completedTasks = computed(() =>
    tasks.value
      .filter((t) => getTaskBucket(t) === 'Completed')
      .sort((a, b) => (b.completedAt ?? b.dueDate).localeCompare(a.completedAt ?? a.dueDate))
  )

  const unreadNotificationsCount = computed(
    () => notifications.value.filter((n) => !n.read).length
  )

  function setTheme(preset) {
    settings.value.themePreset = preset
    applyThemePreset(preset)
  }

  function setSidebarStyle(style) {
    settings.value.sidebarStyle = style
  }

  function setTextSize(size) {
    const normalized =
      size === 'd' || size === 'default' ? 'm' : String(size || 'm').toLowerCase()
    settings.value.textSize = normalized
    applyTextSize(normalized)
  }

  function logActivity(params) {
    const entry = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: params.type,
      title: params.title,
      description: params.description,
      leadId: params.leadId,
      leadName: params.leadName,
      userId: params.userId ?? currentUser.value.id,
      timestamp: new Date().toISOString()
    }
    allActivities.value.unshift(entry)
  }

  function pushNotification(params) {
    notifications.value.unshift({
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: params.title,
      message: params.message,
      category: params.category,
      read: false,
      timestamp: new Date().toISOString(),
      route: params.route,
      leadId: params.leadId
    })
  }

  function createLead(payload) {
    const today = getTodayStr()
    const nowIso = new Date().toISOString()
    const assignedOwner = permissions.value.canReassignLeads
      ? payload.assignedTo
      : currentUser.value.id

    const newLead = {
      ...payload,
      assignedTo: assignedOwner,
      id: `lead-${Date.now()}`,
      createdAt: today,
      updatedAt: nowIso
    }
    allLeads.value.unshift(newLead)

    logActivity({
      type: newLead.status === 'Won' ? 'deal_won' : 'lead_created',
      title: `Created lead ${newLead.name}`,
      description: `${newLead.company} added in ${newLead.status} stage ($${newLead.dealValue.toLocaleString()}).`,
      leadId: newLead.id,
      leadName: newLead.name
    })

    if (settings.value.notifications.newLeadAssignment) {
      pushNotification({
        title: 'New Lead Added',
        message: `${newLead.name} (${newLead.company}) assigned to ${getUserName(newLead.assignedTo)}.`,
        category: 'lead',
        route: '/leads',
        leadId: newLead.id
      })
    }
    return newLead
  }

  function updateLead(id, payload) {
    const index = allLeads.value.findIndex((l) => l.id === id)
    if (index === -1) return null

    const prev = allLeads.value[index]
    const updated = {
      ...prev,
      ...payload,
      updatedAt: new Date().toISOString()
    }
    allLeads.value[index] = updated

    if (payload.status && payload.status !== prev.status) {
      logActivity({
        type: payload.status === 'Won' ? 'deal_won' : 'stage_changed',
        title:
          payload.status === 'Won'
            ? `Closed Won — $${updated.dealValue.toLocaleString()}`
            : `Moved to ${payload.status}`,
        description: `${updated.name} (${updated.company}) changed from ${prev.status} to ${payload.status}.`,
        leadId: updated.id,
        leadName: updated.name
      })

      if (payload.status === 'Won' && settings.value.notifications.stageWinCelebrations) {
        pushNotification({
          title: `Deal Won — ${updated.company}`,
          message: `${getUserName(updated.assignedTo)} closed ${updated.company} ($${updated.dealValue.toLocaleString()}).`,
          category: 'deal',
          route: '/pipeline',
          leadId: updated.id
        })
      }
    } else {
      logActivity({
        type: 'lead_updated',
        title: `Updated ${updated.name}`,
        description: `Record details updated for ${updated.company}.`,
        leadId: updated.id,
        leadName: updated.name
      })
    }

    return updated
  }

  function addLeadNote(leadId, noteText) {
    const index = allLeads.value.findIndex((l) => l.id === leadId)
    if (index === -1 || !noteText.trim()) return
    const lead = allLeads.value[index]
    const stamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const combinedNotes = lead.notes
      ? `[${stamp} — ${currentUser.value.name}] ${noteText.trim()}\n\n${lead.notes}`
      : `[${stamp} — ${currentUser.value.name}] ${noteText.trim()}`

    allLeads.value[index] = {
      ...lead,
      notes: combinedNotes,
      updatedAt: new Date().toISOString()
    }

    logActivity({
      type: 'note_added',
      title: `Note added on ${lead.company}`,
      description: noteText.trim().slice(0, 120),
      leadId: lead.id,
      leadName: lead.name
    })
  }

  function bulkUpdateLeads(ids, changes) {
    const idSet = new Set(ids)
    let count = 0
    const nowIso = new Date().toISOString()

    allLeads.value = allLeads.value.map((lead) => {
      if (!idSet.has(lead.id)) return lead
      count++
      return {
        ...lead,
        ...(changes.status ? { status: changes.status } : {}),
        ...(changes.assignedTo && permissions.value.canReassignLeads
          ? { assignedTo: changes.assignedTo }
          : {}),
        updatedAt: nowIso
      }
    })

    if (count > 0) {
      const summaryParts = []
      if (changes.status) summaryParts.push(`status → ${changes.status}`)
      if (changes.assignedTo) summaryParts.push(`owner → ${getUserName(changes.assignedTo)}`)
      logActivity({
        type: 'lead_updated',
        title: `Bulk updated ${count} leads`,
        description: `Applied ${summaryParts.join(', ')} across ${count} selected records.`
      })
    }
    return count
  }

  function deleteLeads(ids) {
    if (!permissions.value.canDeleteRecords) return 0
    const idSet = new Set(ids)
    const before = allLeads.value.length
    allLeads.value = allLeads.value.filter((l) => !idSet.has(l.id))
    allTasks.value = allTasks.value.map((t) => (idSet.has(t.leadId) ? { ...t, leadId: '' } : t))
    if (selectedLeadId.value && idSet.has(selectedLeadId.value)) {
      leadDetailVisible.value = false
      selectedLeadId.value = null
    }
    return before - allLeads.value.length
  }

  function createTask(payload) {
    const owner = permissions.value.canReassignLeads ? payload.assignedTo : currentUser.value.id
    const newTask = {
      ...payload,
      assignedTo: owner,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      completedAt: payload.status === 'Completed' ? new Date().toISOString() : undefined
    }
    allTasks.value.unshift(newTask)

    const relatedLead = getLeadById(newTask.leadId)
    logActivity({
      type: 'task_created',
      title: `Scheduled task: ${newTask.title}`,
      description: relatedLead
        ? `Due ${newTask.dueDate} for ${relatedLead.company}.`
        : `Due ${newTask.dueDate} (${getUserName(newTask.assignedTo)}).`,
      leadId: relatedLead?.id,
      leadName: relatedLead?.name
    })
    return newTask
  }

  function updateTask(id, payload) {
    const idx = allTasks.value.findIndex((t) => t.id === id)
    if (idx === -1) return null
    const prev = allTasks.value[idx]
    const updated = {
      ...prev,
      ...payload,
      completedAt:
        payload.status === 'Completed'
          ? prev.completedAt ?? new Date().toISOString()
          : payload.status === 'Pending'
            ? undefined
            : prev.completedAt
    }
    allTasks.value[idx] = updated
    return updated
  }

  function toggleTaskCompletion(id) {
    const idx = allTasks.value.findIndex((t) => t.id === id)
    if (idx === -1) return null
    const task = allTasks.value[idx]
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed'
    const updated = {
      ...task,
      status: nextStatus,
      completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined
    }
    allTasks.value[idx] = updated

    if (nextStatus === 'Completed') {
      const relatedLead = getLeadById(task.leadId)
      logActivity({
        type: 'task_completed',
        title: `Completed task: ${task.title}`,
        description: relatedLead
          ? `Follow-up completed for ${relatedLead.company}.`
          : `Marked complete by ${currentUser.value.name}.`,
        leadId: relatedLead?.id,
        leadName: relatedLead?.name
      })
    }
    return updated
  }

  function deleteTask(id) {
    allTasks.value = allTasks.value.filter((t) => t.id !== id)
  }

  function addTeamMember(member) {
    const created = {
      ...member,
      id: `usr-${Date.now()}`
    }
    users.value.push(created)
    return created
  }

  function updateUser(id, changes) {
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...changes }
    }
  }

  function markNotificationRead(id) {
    const item = notifications.value.find((n) => n.id === id)
    if (item) item.read = true
  }

  function markAllNotificationsRead() {
    notifications.value.forEach((n) => {
      n.read = true
    })
  }

  function openCreateLeadDrawer(status = 'New') {
    editingLead.value = null
    defaultNewLeadStatus.value = status
    leadFormVisible.value = true
  }

  function openEditLeadDrawer(lead) {
    editingLead.value = cloneSeed(lead)
    leadFormVisible.value = true
  }

  function openLeadDetailDrawer(leadId) {
    selectedLeadId.value = leadId
    leadDetailVisible.value = true
  }

  function openTaskDrawer(options) {
    editingTask.value = options?.task ? cloneSeed(options.task) : null
    preselectedTaskLeadId.value = options?.leadId ?? ''
    taskFormVisible.value = true
  }

  function resetDemoData() {
    const keptTheme = settings.value.themePreset
    const keptSidebar = settings.value.sidebarStyle
    const keptTextSize = settings.value.textSize || 'm'
    const activeUserId = authSession.value?.userId ?? 'usr-1'
    clearCrmStorage(true)
    allLeads.value = cloneSeed(leadsSeed)
    users.value = cloneSeed(usersSeed)
    allTasks.value = cloneSeed(tasksSeed)
    allActivities.value = cloneSeed(activitiesSeed)
    notifications.value = cloneSeed(notificationsSeed)
    settings.value = {
      ...cloneSeed(DEFAULT_SETTINGS),
      currentUserId: activeUserId,
      themePreset: keptTheme,
      sidebarStyle: keptSidebar,
      textSize: keptTextSize
    }
    applyThemePreset(settings.value.themePreset)
    applyTextSize(settings.value.textSize)
    globalSearchQuery.value = ''
    selectedLeadId.value = null
    leadDetailVisible.value = false
    leadFormVisible.value = false
    taskFormVisible.value = false
  }

  return {
    allLeads,
    allTasks,
    allActivities,
    leads,
    users,
    tasks,
    activities,
    notifications,
    settings,
    sidebarCollapsed,
    authSession,
    isAuthenticated,
    permissions,
    globalSearchQuery,
    leadFormVisible,
    editingLead,
    defaultNewLeadStatus,
    leadDetailVisible,
    selectedLeadId,
    selectedLead,
    taskFormVisible,
    editingTask,
    preselectedTaskLeadId,
    currentUser,
    kpiMetrics,
    overdueTasks,
    upcomingTasks,
    completedTasks,
    unreadNotificationsCount,
    login,
    logout,
    switchActiveSessionUser,
    getUserById,
    getUserName,
    getLeadById,
    getTaskBucket,
    setTheme,
    setSidebarStyle,
    setTextSize,
    createLead,
    updateLead,
    addLeadNote,
    bulkUpdateLeads,
    deleteLeads,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    addTeamMember,
    updateUser,
    markNotificationRead,
    markAllNotificationsRead,
    openCreateLeadDrawer,
    openEditLeadDrawer,
    openLeadDetailDrawer,
    openTaskDrawer,
    resetDemoData
  }
})
