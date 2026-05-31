import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, PageHeader, Button, Badge, Field, Input, EmptyState } from '../components/ui'
import { formatDate, formatCurrency, totalHours, totalGross, currentMonthEntries } from '../lib/utils'
import type { WorkType } from '../types'

const workTypeLabel: Record<WorkType, string> = { baby_care: 'Care', cleaning: 'Cleaning' }

export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, session, updateWorker, balanceForWorker } = useApp()

  const worker = data.workers.find(w => w.id === id)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(worker?.name ?? '')
  const [username, setUsername] = useState(worker?.username ?? '')
  const [pin, setPin] = useState(worker?.pin ?? '')
  const [phone, setPhone] = useState(worker?.phone ?? '')
  const [doesCare, setDoesCare] = useState(worker?.doesCare ?? true)
  const [doesCleaning, setDoesCleaning] = useState(worker?.doesCleaning ?? false)
  const [careRate, setCareRate] = useState(String(worker?.careRate ?? ''))
  const [cleaningRate, setCleaningRate] = useState(String(worker?.cleaningRate ?? ''))
  const [nightRate, setNightRate] = useState(String(worker?.nightRate ?? ''))
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(String(worker?.overtimeMultiplier ?? '1.25'))

  if (!worker) {
    navigate('/workers')
    return null
  }

  const isParent = session?.role === 'parent'
  const wid = worker.id
  const workerEntries = data.workEntries.filter(e => e.workerId === wid).sort((a, b) => b.date.localeCompare(a.date))
  const monthEntries = currentMonthEntries(workerEntries)
  const workerPayments = data.payments.filter(p => p.workerId === wid).sort((a, b) => b.date.localeCompare(a.date))
  const balance = balanceForWorker(wid)

  function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    updateWorker(wid, {
      name, username, pin,
      phone: phone || undefined,
      doesCare, doesCleaning,
      careRate: doesCare ? Number(careRate) : 0,
      cleaningRate: doesCleaning ? Number(cleaningRate) : 0,
      nightRate: Number(nightRate),
      overtimeMultiplier: Number(overtimeMultiplier),
    })
    setEditing(false)
  }

  const workTypes = [worker.doesCare && 'Care', worker.doesCleaning && 'Cleaning'].filter(Boolean).join(' + ')

  return (
    <div>
      <PageHeader
        title={worker.name}
        action={
          isParent ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(v => !v)}>
              <Pencil size={13} className="inline mr-1" />{editing ? 'Cancel' : 'Edit'}
            </Button>
          ) : undefined
        }
      />

      {/* Balance — prominent for all roles */}
      <Card className="mb-6 border-2 border-gray-200">
        <p className="text-xs text-gray-400 mb-1">Balance Owed</p>
        <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
          {formatCurrency(balance)}
        </p>
        <p className="text-xs text-gray-400 mt-1">{balance > 0 ? 'Outstanding amount' : 'All settled'}</p>
      </Card>

      {isParent && editing ? (
        <Card className="max-w-lg mb-6">
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username">
                <Input value={username} onChange={e => setUsername(e.target.value)} required />
              </Field>
              <Field label="PIN">
                <Input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} required />
              </Field>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Work Types</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={doesCare} onChange={e => setDoesCare(e.target.checked)} />
                  Baby Care
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={doesCleaning} onChange={e => setDoesCleaning(e.target.checked)} />
                  Cleaning
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {doesCare && (
                <Field label="Care Rate (₪/h)">
                  <Input type="number" min="0" step="0.5" value={careRate} onChange={e => setCareRate(e.target.value)} required={doesCare} />
                </Field>
              )}
              {doesCleaning && (
                <Field label="Cleaning Rate (₪/h)">
                  <Input type="number" min="0" step="0.5" value={cleaningRate} onChange={e => setCleaningRate(e.target.value)} required={doesCleaning} />
                </Field>
              )}
              <Field label="Night Rate (₪/h)">
                <Input type="number" min="0" step="0.5" value={nightRate} onChange={e => setNightRate(e.target.value)} required />
              </Field>
              <Field label="OT Multiplier">
                <Input type="number" min="1" step="0.05" value={overtimeMultiplier} onChange={e => setOvertimeMultiplier(e.target.value)} required />
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit">Save</Button>
              <Button
                type="button"
                variant={worker.isActive ? 'danger' : 'secondary'}
                onClick={() => { updateWorker(wid, { isActive: !worker.isActive }); setEditing(false) }}
              >
                {worker.isActive ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <Badge color={worker.isActive ? 'green' : 'gray'}>{worker.isActive ? 'Active' : 'Inactive'}</Badge>
          </Card>
          <Card>
            <p className="text-xs text-gray-400 mb-1">Work Types</p>
            <Badge color="blue">{workTypes}</Badge>
          </Card>
          <Card>
            <p className="text-xs text-gray-400 mb-1">Since</p>
            <p className="text-sm font-medium">{formatDate(worker.startDate)}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-400 mb-1">Rates</p>
            {worker.doesCare && <p className="text-xs font-medium">Care ₪{worker.careRate}/h</p>}
            {worker.doesCleaning && <p className="text-xs font-medium">Clean ₪{worker.cleaningRate}/h</p>}
            <p className="text-xs text-gray-400">Night ₪{worker.nightRate}/h · {worker.overtimeMultiplier}× OT</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-xs text-gray-400 mb-1">Hours (this month)</p>
          <p className="text-xl font-semibold">{totalHours(monthEntries)}h</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Gross (this month)</p>
          <p className="text-xl font-semibold">{formatCurrency(totalGross(monthEntries))}</p>
        </Card>
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-3">Work History</h3>
      {workerEntries.length === 0 ? (
        <EmptyState message="No work entries yet" />
      ) : (
        <div className="space-y-2 mb-8">
          {workerEntries.map(e => (
            <Card key={e.id} className="!p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{formatDate(e.date)}</p>
                  <p className="text-xs text-gray-400">
                    {e.startTime}–{e.endTime} · {workTypeLabel[e.workType]} · {e.shiftType} shift
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{e.hoursWorked}h</p>
                  <p className="text-xs text-gray-400">{formatCurrency(e.grossAmount)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h3 className="text-sm font-medium text-gray-700 mb-3">Payment History</h3>
      {workerPayments.length === 0 ? (
        <EmptyState message="No payments recorded yet" />
      ) : (
        <div className="space-y-2">
          {workerPayments.map(p => (
            <Card key={p.id} className="!p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{formatDate(p.date)}</p>
                  <p className="text-xs text-gray-400">
                    {p.method.replace('_', ' ')} · {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</p>
              </div>
              {p.imageDataUrl && (
                <img src={p.imageDataUrl} alt="Receipt" className="mt-2 h-14 w-14 object-cover rounded-lg border border-gray-100" />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
