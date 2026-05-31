import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Image, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, PageHeader, Button, Badge, EmptyState, ConfirmDialog, Field, Input, Select } from '../components/ui'
import { formatDate, formatCurrency, today } from '../lib/utils'
import type { PaymentMethod } from '../types'

const methodLabel: Record<PaymentMethod, string> = { cash: 'Cash', bank_transfer: 'Bank Transfer', other: 'Other' }

function ImagePreview({ dataUrl, onRemove }: { dataUrl: string; onRemove?: () => void }) {
  const [lightbox, setLightbox] = useState(false)
  return (
    <>
      <div className="relative inline-block">
        <img
          src={dataUrl}
          alt="Receipt"
          className="h-16 w-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setLightbox(true)}
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-500"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(false)}
        >
          <img src={dataUrl} alt="Receipt" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </>
  )
}

export function PaymentsPage() {
  const { data, addPayment, deletePayment, getWorker } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [adding, setAdding] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [workerId, setWorkerId] = useState('')
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>()

  // Pre-fill from calendar deep-link (?workerId=x&periodStart=y&periodEnd=z)
  useEffect(() => {
    const qw = searchParams.get('workerId')
    const qs = searchParams.get('periodStart')
    const qe = searchParams.get('periodEnd')
    if (qw || qs || qe) {
      if (qw) setWorkerId(qw)
      if (qs) setPeriodStart(qs)
      if (qe) setPeriodEnd(qe)
      setAdding(true)
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeWorkers = data.workers.filter(w => w.isActive)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImageDataUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function resetForm() {
    setWorkerId(''); setAmount(''); setNotes(''); setImageDataUrl(undefined)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addPayment({ workerId, date, amount: Number(amount), method, periodStart, periodEnd, notes: notes || undefined, imageDataUrl })
    setAdding(false)
    resetForm()
  }

  const sorted = [...data.payments].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <PageHeader
        title="Payments"
        action={
          <Button onClick={() => setAdding(true)}><Plus size={14} className="inline mr-1" />Record Payment</Button>
        }
      />

      {adding && (
        <Card className="mb-5 max-w-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-4">New Payment</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Worker">
              <Select value={workerId} onChange={e => setWorkerId(e.target.value)} required>
                <option value="">— Select worker —</option>
                {activeWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </Field>
            <Field label="Amount (₪)">
              <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </Field>
            <Field label="Payment Method">
              <Select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Period Start">
                <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
              </Field>
              <Field label="Period End">
                <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <Input value={notes} onChange={e => setNotes(e.target.value)} />
            </Field>
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1">Receipt / Proof (optional)</p>
              {imageDataUrl ? (
                <ImagePreview dataUrl={imageDataUrl} onRemove={() => { setImageDataUrl(undefined); if (fileRef.current) fileRef.current.value = '' }} />
              ) : (
                <label className="flex items-center gap-2 cursor-pointer w-fit border border-dashed border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <Image size={15} />
                  Upload image
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit">Record</Button>
              <Button type="button" variant="secondary" onClick={() => { setAdding(false); resetForm() }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {sorted.length === 0 ? (
        <EmptyState message="No payments recorded yet" />
      ) : (
        <div className="space-y-2">
          {sorted.map(p => {
            const worker = getWorker(p.workerId)
            return (
              <Card key={p.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{formatDate(p.date)}</p>
                      {worker && <Badge color="blue">{worker.name}</Badge>}
                      <Badge>{methodLabel[p.method]}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      Period: {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                    </p>
                    {p.notes && <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</p>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmId(p.id)}>
                      <Trash2 size={14} className="text-red-400" />
                    </Button>
                  </div>
                </div>
                {p.imageDataUrl && (
                  <div className="mt-3">
                    <ImagePreview dataUrl={p.imageDataUrl} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          message="Delete this payment record?"
          onConfirm={() => { deletePayment(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}
