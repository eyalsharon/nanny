import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, PageHeader, Button, Badge, EmptyState, Field, Input } from '../components/ui'
import { formatDate, formatCurrency } from '../lib/utils'
import type { Worker } from '../types'

function WorkerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Omit<Worker, 'id' | 'isActive'>>
  onSave: (v: Omit<Worker, 'id' | 'isActive'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [username, setUsername] = useState(initial?.username ?? '')
  const [pin, setPin] = useState(initial?.pin ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [doesCare, setDoesCare] = useState(initial?.doesCare ?? true)
  const [doesCleaning, setDoesCleaning] = useState(initial?.doesCleaning ?? false)
  const [careRate, setCareRate] = useState(String(initial?.careRate ?? ''))
  const [cleaningRate, setCleaningRate] = useState(String(initial?.cleaningRate ?? ''))
  const [nightRate, setNightRate] = useState(String(initial?.nightRate ?? ''))
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(String(initial?.overtimeMultiplier ?? '1.25'))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!doesCare && !doesCleaning) return
    onSave({
      name, username, pin,
      phone: phone || undefined,
      startDate,
      doesCare, doesCleaning,
      careRate: doesCare ? Number(careRate) : 0,
      cleaningRate: doesCleaning ? Number(cleaningRate) : 0,
      nightRate: Number(nightRate),
      overtimeMultiplier: Number(overtimeMultiplier),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </Field>
        <Field label="Phone (optional)">
          <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
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
      <Field label="Start Date">
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      </Field>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Work Types</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={doesCare} onChange={e => setDoesCare(e.target.checked)} className="rounded" />
            Baby Care
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={doesCleaning} onChange={e => setDoesCleaning(e.target.checked)} className="rounded" />
            Cleaning
          </label>
        </div>
        {!doesCare && !doesCleaning && (
          <p className="text-xs text-red-500 mt-1">Select at least one work type</p>
        )}
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

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={!doesCare && !doesCleaning}>Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export function WorkersPage() {
  const { data, addWorker, balanceForWorker } = useApp()
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <PageHeader
        title="Workers"
        action={<Button onClick={() => setAdding(true)}><Plus size={14} className="inline mr-1" />Add Worker</Button>}
      />

      {adding && (
        <Card className="mb-5 max-w-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-4">New Worker</h3>
          <WorkerForm
            onSave={v => { addWorker(v); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        </Card>
      )}

      {data.workers.length === 0 ? (
        <EmptyState message="No workers added yet" />
      ) : (
        <div className="space-y-2">
          {data.workers.map(worker => {
            const balance = balanceForWorker(worker.id)
            const types = [worker.doesCare && 'Care', worker.doesCleaning && 'Cleaning'].filter(Boolean).join(' + ')
            return (
              <Link key={worker.id} to={`/workers/${worker.id}`}>
                <Card className="flex items-center justify-between hover:border-gray-300 transition-colors cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900">{worker.name}</p>
                      <Badge color="blue">{types}</Badge>
                      {!worker.isActive && <Badge color="gray">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-gray-400">Since {formatDate(worker.startDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {balance > 0 ? `Owed ${formatCurrency(balance)}` : 'Settled'}
                    </p>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
