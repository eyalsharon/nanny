import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { useApp } from '../context/AppContext'
import { formatDate, formatCurrency } from '../lib/utils'
import type { Payment, WorkEntry, WorkType } from '../types'

const workTypeLabel: Record<WorkType, string> = { baby_care: 'Care', cleaning: 'Cleaning' }

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function coveringPayment(date: string, workerId: string, payments: Payment[]): Payment | undefined {
  return payments.find(p => p.workerId === workerId && p.periodStart <= date && p.periodEnd >= date)
}

interface DayPopover {
  date: string
  entries: WorkEntry[]
  payment: Payment | undefined
}

export function CalendarPage() {
  const { data, session } = useApp()
  const navigate = useNavigate()
  const isParent = session?.role === 'parent'

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [popover, setPopover] = useState<DayPopover | null>(null)

  // For parent: show all active workers; for worker: only themselves
  const relevantWorkers = isParent
    ? data.workers.filter(w => w.isActive)
    : data.workers.filter(w => w.id === session?.workerId)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setPopover(null)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setPopover(null)
  }

  const monthStart = startOfMonth(new Date(viewYear, viewMonth))
  const monthEnd = endOfMonth(new Date(viewYear, viewMonth))
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const paddingBefore = (() => {
    const dow = getDay(monthStart) // 0=Sun
    return dow === 0 ? 6 : dow - 1
  })()

  // Build a map: date → entries for all relevant workers
  const entriesByDate = useMemo(() => {
    const relevantIds = new Set(relevantWorkers.map(w => w.id))
    const map: Record<string, WorkEntry[]> = {}
    data.workEntries.forEach(e => {
      if (!relevantIds.has(e.workerId)) return
      if (!map[e.date]) map[e.date] = []
      map[e.date]!.push(e)
    })
    return map
  }, [data.workEntries, relevantWorkers])

  function handleDayClick(dateStr: string) {
    const entries = entriesByDate[dateStr]
    if (!entries || entries.length === 0) return
    if (popover?.date === dateStr) { setPopover(null); return }

    // For simplicity use the first entry's worker to check payment (or first uncovered)
    const firstEntry = entries[0]!
    const payment = coveringPayment(dateStr, firstEntry.workerId, data.payments)
    setPopover({ date: dateStr, entries, payment })
  }

  function handleRecordPayment(date: string, workerId: string) {
    navigate(`/payments?workerId=${workerId}&periodStart=${date}&periodEnd=${date}`)
  }

  const todayStr = format(now, 'yyyy-MM-dd')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <p className="text-sm font-semibold text-gray-900">
            {format(new Date(viewYear, viewMonth), 'MMMM yyyy')}
          </p>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map(h => (
            <div key={h} className="text-center text-xs font-medium text-gray-400 py-1">{h}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: paddingBefore }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[64px]" />
          ))}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEntries = entriesByDate[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isSelected = popover?.date === dateStr

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                className={`min-h-[64px] p-1 rounded-lg flex flex-col transition-colors ${
                  dayEntries.length > 0 ? 'cursor-pointer' : 'cursor-default'
                } ${isSelected ? 'bg-gray-50 ring-1 ring-gray-200' : 'hover:bg-gray-50/60'}`}
              >
                {/* Date number */}
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${
                  isToday ? 'bg-gray-900 text-white' : 'text-gray-600'
                }`}>
                  {day.getDate()}
                </span>

                {/* Entry chips */}
                <div className="space-y-0.5">
                  {dayEntries.map(entry => {
                    const paid = !!coveringPayment(dateStr, entry.workerId, data.payments)
                    const worker = relevantWorkers.find(w => w.id === entry.workerId)
                    const label = isParent
                      ? `${worker?.name ?? '?'} · ${workTypeLabel[entry.workType]} · ${entry.hoursWorked}h`
                      : `${workTypeLabel[entry.workType]} · ${entry.hoursWorked}h`

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-1 rounded px-1 py-0.5 ${
                          paid ? 'bg-green-50' : 'bg-amber-50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${paid ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className={`text-xs truncate leading-tight ${paid ? 'text-green-800' : 'text-amber-800'}`}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <span className="text-xs text-gray-500">Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-xs text-gray-500">Unpaid</span>
          </div>
        </div>
      </div>

      {/* Day popover */}
      {popover && (
        <div className="mt-4 bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">{formatDate(popover.date)}</p>
            <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600 p-0.5">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {popover.entries.map(entry => {
              const paid = !!coveringPayment(popover.date, entry.workerId, data.payments)
              const worker = data.workers.find(w => w.id === entry.workerId)
              return (
                <div key={entry.id} className="flex justify-between items-start text-sm pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <div>
                    {isParent && <p className="font-medium text-gray-900">{worker?.name}</p>}
                    <p className={isParent ? 'text-xs text-gray-500' : 'font-medium text-gray-900'}>
                      {workTypeLabel[entry.workType]} · {entry.shiftType} · {entry.startTime}–{entry.endTime}
                    </p>
                    {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="font-medium text-gray-900">{entry.hoursWorked}h</p>
                    <p className="text-xs text-gray-400">{formatCurrency(entry.grossAmount)}</p>
                    <span className={`text-xs font-medium ${paid ? 'text-green-600' : 'text-amber-600'}`}>
                      {paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Payment action */}
          {isParent && (() => {
            // Group by worker and show action per worker
            const workerIds = [...new Set(popover.entries.map(e => e.workerId))]
            return workerIds.map(wid => {
              const payment = coveringPayment(popover.date, wid, data.payments)
              const worker = data.workers.find(w => w.id === wid)
              if (payment) {
                return (
                  <div key={wid} className="rounded-lg bg-green-50 px-3 py-2 text-sm">
                    <p className="text-green-700 font-medium">
                      {worker?.name} — paid {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Period: {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                      {payment.method !== 'cash' && ` · ${payment.method.replace('_', ' ')}`}
                    </p>
                    {payment.imageDataUrl && (
                      <img
                        src={payment.imageDataUrl}
                        alt="Receipt"
                        className="mt-2 h-12 w-12 object-cover rounded border border-green-200 cursor-pointer"
                        onClick={() => window.open(payment.imageDataUrl)}
                      />
                    )}
                  </div>
                )
              }
              return (
                <button
                  key={wid}
                  onClick={() => handleRecordPayment(popover.date, wid)}
                  className="w-full rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors text-left"
                >
                  Record payment for {worker?.name} →
                </button>
              )
            })
          })()}

          {/* Worker view: show own payment status */}
          {!isParent && (() => {
            const myEntry = popover.entries[0]
            if (!myEntry) return null
            const payment = coveringPayment(popover.date, myEntry.workerId, data.payments)
            if (payment) {
              return (
                <div className="rounded-lg bg-green-50 px-3 py-2 text-sm">
                  <p className="text-green-700 font-medium">Payment received: {formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Period: {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                  </p>
                </div>
              )
            }
            return (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Not yet paid for this day
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
