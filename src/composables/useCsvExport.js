function escapeCsvCell(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function useCsvExport() {
  function downloadCsv(filename, rows, columns) {
    const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(',')
    const dataRows = rows.map((row) =>
      columns.map((col) => escapeCsvCell(col.accessor(row))).join(',')
    )
    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return { downloadCsv }
}
