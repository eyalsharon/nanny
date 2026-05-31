import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, PageHeader, Button, Badge, EmptyState, ConfirmDialog, Select, Field, Input } from '../components/ui'
import { formatDate, formatCurrency, today } from '../lib/utils'

export function HoursPage() {
  const { data, session, deleteWorkEntry, getWorker } = useApp()
  const [filterWorker, setFilterWorker] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const isParent = session?.role === 'parent'

  let entries = [...data.workEntries].sort((a, b) => b.date.localeCompare(a.date))

  if (!isParent && session?.workerId) {
    entries = entries.filter(e => e.workerId === session.workerId)
  } else if (filterWorker) {
    entries = entries.filter(e => e.workerId === filterWorker)
  }
  if (filterFrom) entries = entries.filter(e => e.date >= filterFrom)
  if (filterTo) entries = entries.filter(e => e.date <= filterTo)

  const totalH = entries.reduce((s, e) => s + e.hoursWorked, 0).toFixed(2)
  const totalG = entries.reduce((s, e) => s + e.grossAmount, 0)

  return (
    <div>
      <PageHeader
        title="Work Hours"
        action={
          <Link to="/hours/new">
            <Button><Plus size={14} className="inline mr-1" />Log Hours</Button>
          </Link>
        }
      />

      {isParent && (
        <Card className="mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Worker">
              <Select value={filterWorker} onChange={e => setFilterWorker(e.target.value)}>
                <option value="">All workers</option>
                {data.workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="From">
              <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} max={today()} />
            </Field>
          </div>
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState message="No work entries found" />
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {entries.map(entry => {
              const worker = getWorker(entry.workerId)
              return (
                <Card key={entry.id} className="flex items-start justify-between gap-3 !p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</p>
                      {isParent && worker && <Badge color="blue">{worker.name}</Badge>}
                      <Badge color="gray">{entry.workType === 'baby_care' ? 'Care' : 'Cleaning'}</Badge>
                      <Badge>{entry.shiftType === 'night' ? 'Night' : 'Day'}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {entry.startTime} – {entry.endTime} · {entry.hoursWorked}h · {formatCurrency(entry.grossAmount)}
                    </p>
                    {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
                  </div>
                  {isParent && (
                    <div className="flex gap-1 shrink-0">
                      <Link to={`/hours/new?edit=${entry.id}`}>
                        <Button variant="ghost" size="sm"><Pencil size={14} /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmId(entry.id)}>
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
          <Card className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400">Total Hours</p>
              <p className="text-lg font-semibold">{totalH}h</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Gross</p>
              <p className="text-lg font-semibold">{formatCurrency(totalG)}</p>
            </div>
          </Card>
        </>
      )}

      {confirmId && (
        <ConfirmDialog
          message="Delete this work entry? This cannot be undone."
          onConfirm={() => { deleteWorkEntry(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
