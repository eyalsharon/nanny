import { format, parseISO, startOfMonth, endOfMonth, subDays, isWithinInterval } from 'date-fns'
import type { WorkEntry, Worker, WorkType, ShiftType } from '../types'

export function formatCurrency(amount: number): string {
  return `₪${amount.toFixed(2)}`
}

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy')
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function computeHours(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const diff = end - start
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
}

export function computeGross(
  hours: number,
  worker: Pick<Worker, 'careRate' | 'cleaningRate' | 'nightRate' | 'overtimeMultiplier'>,
  workType: WorkType,
  shiftType: ShiftType,
): number {
  const dayRate = workType === 'cleaning' ? worker.cleaningRate : worker.careRate
  const rate = shiftType === 'night' ? worker.nightRate : dayRate
  const regular = Math.min(hours, 8)
  const overtime = Math.max(hours - 8, 0)
  return Math.round((regular * rate + overtime * rate * worker.overtimeMultiplier) * 100) / 100
}

export function currentMonthEntries(entries: WorkEntry[]): WorkEntry[] {
  const start = startOfMonth(new Date())
  const end = endOfMonth(new Date())
  return entries.filter(e => isWithinInterval(parseISO(e.date), { start, end }))
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  )
}

export function totalHours(entries: WorkEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + e.hoursWorked, 0) * 100) / 100
}

export function totalGross(entries: WorkEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + e.grossAmount, 0) * 100) / 100
}

export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0]!)
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
