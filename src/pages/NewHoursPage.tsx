import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Card, PageHeader, Button, Field, Input, Select } from '../components/ui'
import { today, last7Days, computeHours, computeGross, formatCurrency } from '../lib/utils'
import type { WorkType, ShiftType } from '../types'

export function NewHoursPage() {
  const { data, session, addWorkEntry, updateWorkEntry, getWorker } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')

  const isParent = session?.role === 'parent'
  const existingEntry = editId ? data.workEntries.find(e => e.id === editId) : null

  const [workerId, setWorkerId] = useState(existingEntry?.workerId ?? session?.workerId ?? '')
  const [date, setDate] = useState(existingEntry?.date ?? today())
  const [startTime, setStartTime] = useState(existingEntry?.startTime ?? '08:00')
  const [endTime, setEndTime] = useState(existingEntry?.endTime ?? '17:00')
  const [shiftType, setShiftType] = useState<ShiftType>(existingEntry?.shiftType ?? 'day')
  const [workType, setWorkType] = useState<WorkType>(existingEntry?.workType ?? 'baby_care')
  const [notes, setNotes] = useState(existingEntry?.notes ?? '')

  const validDays = last7Days()
  const selectedWorker = getWorker(workerId)

  // Determine which work types are available for the selected worker
  const availableTypes: WorkType[] = selectedWorker
    ? ([selectedWorker.doesCare && 'baby_care', selectedWorker.doesCleaning && 'cleaning'] as (WorkType | false)[]).filter((t): t is WorkType => t !== false)
    : []

  const hours = computeHours(startTime, endTime)
  const gross = selectedWorker && availableTypes.length > 0
    ? computeGross(hours, selectedWorker, workType, shiftType)
    : 0

  const availableWorkers = isParent
    ? data.workers.filter(w => w.isActive)
    : data.workers.filter(w => w.id === session?.workerId)

  // Auto-set work type when worker changes
  function handleWorkerChange(id: string) {
    setWorkerId(id)
    const w = getWorker(id)
    if (w) {
      if (w.doesCare && !w.doesCleaning) setWorkType('baby_care')
      else if (!w.doesCare && w.doesCleaning) setWorkType('cleaning')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workerId || !selectedWorker || hours <= 0) return
    const entry = { workerId, date, startTime, endTime, workType, shiftType, notes: notes || undefined, createdBy: session!.username }
    if (editId) {
      updateWorkEntry(editId, entry, selectedWorker)
    } else {
      addWorkEntry(entry, selectedWorker)
    }
    navigate('/hours')
  }

  return (
    <div>
      <PageHeader title={editId ? 'Edit Hours' : 'Log Hours'} />
      <Card className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isParent && (
            <Field label="Worker">
              <Select value={workerId} onChange={e => handleWorkerChange(e.target.value)} required>
                <option value="">— Select worker —</option>
                {availableWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
          )}

          <Field label="Date">
            {isParent ? (
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            ) : (
              <Select value={date} onChange={e => setDate(e.target.value)} required>
                {validDays.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time">
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </Field>
            <Field label="End Time">
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Only show work type selector if worker does both */}
            {availableTypes.length > 1 && (
              <Field label="Work Type">
                <Select value={workType} onChange={e => setWorkType(e.target.value as WorkType)}>
                  {availableTypes.includes('baby_care') && <option value="baby_care">Baby Care</option>}
                  {availableTypes.includes('cleaning') && <option value="cleaning">Cleaning</option>}
                </Select>
              </Field>
            )}
            <Field label="Shift">
              <Select value={shiftType} onChange={e => setShiftType(e.target.value as ShiftType)}>
                <option value="day">Day</option>
                <option value="night">Night</option>
              </Select>
            </Field>
          </div>

          <Field label="Notes (optional)">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" />
          </Field>

          {hours > 0 && selectedWorker && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Hours</span><span>{hours}h</span>
              </div>
              {availableTypes.length === 1 && (
                <div className="flex justify-between text-gray-600">
                  <span>Type</span>
                  <span>{availableTypes[0] === 'baby_care' ? 'Baby Care' : 'Cleaning'}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-gray-900">
                <span>Gross Amount</span><span>{formatCurrency(gross)}</span>
              </div>
              {hours > 8 && (
                <p className="text-xs text-gray-400">Includes overtime for {(hours - 8).toFixed(2)}h</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={!workerId || hours <= 0 || availableTypes.length === 0}>
              {editId ? 'Save Changes' : 'Log Hours'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
