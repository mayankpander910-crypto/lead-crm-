export const PIPELINE_STAGES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost'
]

export const DEFAULT_LEAD_SOURCES = [
  'Website',
  'Referral',
  'LinkedIn',
  'Advertising',
  'Cold Outreach'
]

export const DEFAULT_LEAD_CATEGORIES = [
  'SaaS & Cloud',
  'FinTech',
  'HealthTech',
  'E-Commerce',
  'Logistics',
  'AI & Data',
  'Cybersecurity',
  'Manufacturing'
]

export const US_STATES = [
  'California',
  'New York',
  'Texas',
  'Massachusetts',
  'Washington',
  'Illinois',
  'Colorado',
  'Florida',
  'Georgia',
  'North Carolina',
  'Pennsylvania',
  'Arizona',
  'Virginia',
  'Ohio'
]

export const LEAD_PRIORITIES = ['High', 'Medium', 'Low']

export const USER_ROLES = ['Admin', 'Sales Manager', 'Sales Representative']

export const STAGE_META = {
  New: {
    label: 'New',
    severity: 'info',
    dotColor: '#2563eb',
    chartColor: '#2563eb'
  },
  Contacted: {
    label: 'Contacted',
    severity: 'secondary',
    dotColor: '#0284c7',
    chartColor: '#3b82f6'
  },
  Qualified: {
    label: 'Qualified',
    severity: 'info',
    dotColor: '#0369a1',
    chartColor: '#60a5fa'
  },
  Proposal: {
    label: 'Proposal',
    severity: 'warn',
    dotColor: '#d97706',
    chartColor: '#0ea5e9'
  },
  Negotiation: {
    label: 'Negotiation',
    severity: 'warn',
    dotColor: '#ea580c',
    chartColor: '#1d4ed8'
  },
  Won: {
    label: 'Won',
    severity: 'success',
    dotColor: '#059669',
    chartColor: '#059669'
  },
  Lost: {
    label: 'Lost',
    severity: 'secondary',
    dotColor: '#64748b',
    chartColor: '#94a3b8'
  }
}

export const PRIORITY_META = {
  High: {
    severity: 'danger',
    icon: 'pi pi-arrow-up'
  },
  Medium: {
    severity: 'warn',
    icon: 'pi pi-minus'
  },
  Low: {
    severity: 'secondary',
    icon: 'pi pi-arrow-down'
  }
}
