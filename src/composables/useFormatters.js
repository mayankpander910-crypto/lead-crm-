export function useFormatters() {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })

  const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  })

  function formatCurrency(amount) {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return '$0'
    return currencyFormatter.format(amount)
  }

  function formatCompactCurrency(amount) {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return '$0'
    return compactCurrencyFormatter.format(amount)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    const parsed = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr)
    if (Number.isNaN(parsed.getTime())) return dateStr
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '—'
    const parsed = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr)
    if (Number.isNaN(parsed.getTime())) return dateStr
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  function formatTime12h(time24) {
    if (!time24) return ''
    const [hStr, mStr] = time24.split(':')
    const h = Number(hStr)
    const m = Number(mStr ?? 0)
    if (Number.isNaN(h)) return time24
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return ''
    const target = new Date(isoString).getTime()
    if (Number.isNaN(target)) return isoString
    const now = Date.now()
    const diffMinutes = Math.round((now - target) / 60000)
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(isoString)
  }

  function todayIsoDate() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function isDateOverdue(dateStr, timeStr) {
    if (!dateStr) return false
    const today = todayIsoDate()
    if (dateStr < today) return true
    if (dateStr > today) return false
    if (!timeStr) return false
    const now = new Date()
    const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return timeStr < nowHm
  }

  function getInitials(fullName) {
    if (!fullName) return '?'
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return {
    formatCurrency,
    formatCompactCurrency,
    formatDate,
    formatShortDate,
    formatTime12h,
    formatRelativeTime,
    todayIsoDate,
    isDateOverdue,
    getInitials
  }
}
