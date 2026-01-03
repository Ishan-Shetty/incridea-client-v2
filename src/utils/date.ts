export const formatDateTime = (date: string | Date | number | null | undefined): string => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'Invalid Date'
  
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d)
}

export const formatDate = (date: string | Date | number | null | undefined): string => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'Invalid Date'

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d)
}

export const formatTime = (date: string | Date | number | null | undefined): string => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'Invalid Date'

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d)
}

// Helper for datetime-local input (YYYY-MM-DDTHH:mm) in IST
// This constructs a string that looks like IST time but is value-compatible with input which expects local time.
// Note: transforming UTC to this "shifted" time for input requires careful handling on save (reversing it), 
// but if we just want to default the input to what *looks* like IST:
export const toISTISOString = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''

  // Get UTC time + 5:30
  // We can use toLocaleString with en-CA (formats as YYYY-MM-DD...) to get parts?
  // Or manually offset.
  // Method: use Intl to get parts in Asia/Kolkata, then reconstruct YYYY-MM-DDTHH:mm
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }
  
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date)
  const p: Record<string, string> = {}
  parts.forEach(({ type, value }) => { p[type] = value })
  
  // en-GB: dd/mm/yyyy, hh:mm:ss
  // We want YYYY-MM-DDTHH:mm
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
