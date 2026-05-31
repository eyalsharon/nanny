import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, PageHeader, Button, Field, Input, ConfirmDialog, EmptyState } from '../components/ui'
import { exportToCSV } from '../lib/utils'

export function SettingsPage() {
  const { data, session, addParentAccount, updateParentAccount, deleteParentAccount } = useApp()
  const [addingAccount, setAddingAccount] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // New account form
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPin, setNewPin] = useState('')

  // Edit form
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPin, setEditPin] = useState('')
  const [editError, setEditError] = useState('')

  function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    addParentAccount({ name: newName, username: newUsername, pin: newPin })
    setNewName(''); setNewUsername(''); setNewPin('')
    setAddingAccount(false)
  }

  function startEdit(id: string) {
    const acc = data.parentAccounts.find(p => p.id === id)
    if (!acc) return
    setEditName(acc.name); setEditUsername(acc.username); setEditPin(''); setEditError('')
    setEditId(id)
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    updateParentAccount(editId, {
      name: editName || undefined,
      username: editUsername || undefined,
      pin: editPin || undefined,
    })
    setEditId(null)
  }

  function exportEntries() {
    exportToCSV('work-entries.csv', data.workEntries.map(e => ({
      id: e.id,
      workerId: e.workerId,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      workType: e.workType,
      shiftType: e.shiftType,
      hoursWorked: e.hoursWorked,
      grossAmount: e.grossAmount,
      notes: e.notes ?? '',
      createdBy: e.createdBy,
    })))
  }

  function exportPayments() {
    exportToCSV('payments.csv', data.payments.map(p => ({
      id: p.id,
      workerId: p.workerId,
      date: p.date,
      amount: p.amount,
      method: p.method,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      notes: p.notes ?? '',
    })))
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-5 max-w-lg">
        {/* Parent accounts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Parent Accounts</h3>
            <Button size="sm" variant="secondary" onClick={() => setAddingAccount(v => !v)}>
              <Plus size={13} className="inline mr-1" />Add
            </Button>
          </div>

          {addingAccount && (
            <form onSubmit={handleAddAccount} className="space-y-3 mb-4 pb-4 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Eyal" required />
                </Field>
                <Field label="Username">
                  <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                </Field>
              </div>
              <Field label="PIN">
                <Input type="password" inputMode="numeric" value={newPin} onChange={e => setNewPin(e.target.value)} required />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setAddingAccount(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {data.parentAccounts.length === 0 ? (
            <EmptyState message="No parent accounts" />
          ) : (
            <div className="space-y-2">
              {data.parentAccounts.map(acc => (
                <div key={acc.id}>
                  {editId === acc.id ? (
                    <form onSubmit={handleEditSave} className="space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Name">
                          <Input value={editName} onChange={e => setEditName(e.target.value)} required />
                        </Field>
                        <Field label="Username">
                          <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
                        </Field>
                      </div>
                      <Field label="New PIN (leave blank to keep)">
                        <Input type="password" inputMode="numeric" value={editPin} onChange={e => setEditPin(e.target.value)} placeholder="Leave blank to keep" />
                      </Field>
                      {editError && <p className="text-red-500 text-xs">{editError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Save</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{acc.name}</p>
                        <p className="text-xs text-gray-400">@{acc.username}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(acc.id)}>Edit</Button>
                        {session?.parentId !== acc.id && data.parentAccounts.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(acc.id)}>
                            <Trash2 size={13} className="text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Export Data</h3>
          <p className="text-xs text-gray-400 mb-4">Download all data as CSV files</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={exportEntries}>Export Hours</Button>
            <Button variant="secondary" onClick={exportPayments}>Export Payments</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Install on iPhone</h3>
          <p className="text-xs text-gray-400">
            Open in Safari → tap Share → "Add to Home Screen" to install like a native app.
          </p>
        </Card>
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          message="Delete this parent account?"
          onConfirm={() => { deleteParentAccount(confirmDeleteId); setConfirmDeleteId(null) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
