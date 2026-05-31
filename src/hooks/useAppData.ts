import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { loadData, saveData } from '../lib/storage'
import { computeHours, computeGross } from '../lib/utils'
import type { AppData, Worker, WorkEntry, Payment, ParentAccount, Session } from '../types'

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData)

  const update = useCallback((updater: (d: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev)
      saveData(next)
      return next
    })
  }, [])

  // --- Workers ---
  const addWorker = useCallback((worker: Omit<Worker, 'id' | 'isActive'>) => {
    update(d => ({ ...d, workers: [...d.workers, { ...worker, id: uuid(), isActive: true }] }))
  }, [update])

  const updateWorker = useCallback((id: string, changes: Partial<Worker>) => {
    update(d => ({ ...d, workers: d.workers.map(w => w.id === id ? { ...w, ...changes } : w) }))
  }, [update])

  // --- Work Entries ---
  const addWorkEntry = useCallback((
    entry: Omit<WorkEntry, 'id' | 'hoursWorked' | 'grossAmount'>,
    worker: Worker,
  ) => {
    const hoursWorked = computeHours(entry.startTime, entry.endTime)
    const grossAmount = computeGross(hoursWorked, worker, entry.workType, entry.shiftType)
    update(d => ({
      ...d,
      workEntries: [...d.workEntries, { ...entry, id: uuid(), hoursWorked, grossAmount }],
    }))
  }, [update])

  const updateWorkEntry = useCallback((
    id: string,
    changes: Partial<Omit<WorkEntry, 'id' | 'hoursWorked' | 'grossAmount'>>,
    worker: Worker,
  ) => {
    update(d => ({
      ...d,
      workEntries: d.workEntries.map(e => {
        if (e.id !== id) return e
        const merged = { ...e, ...changes }
        const hoursWorked = computeHours(merged.startTime, merged.endTime)
        const grossAmount = computeGross(hoursWorked, worker, merged.workType, merged.shiftType)
        return { ...merged, hoursWorked, grossAmount }
      }),
    }))
  }, [update])

  const deleteWorkEntry = useCallback((id: string) => {
    update(d => ({ ...d, workEntries: d.workEntries.filter(e => e.id !== id) }))
  }, [update])

  // --- Payments ---
  const addPayment = useCallback((payment: Omit<Payment, 'id'>) => {
    update(d => ({ ...d, payments: [...d.payments, { ...payment, id: uuid() }] }))
  }, [update])

  const deletePayment = useCallback((id: string) => {
    update(d => ({ ...d, payments: d.payments.filter(p => p.id !== id) }))
  }, [update])

  // --- Parent Accounts ---
  const addParentAccount = useCallback((account: Omit<ParentAccount, 'id'>) => {
    update(d => ({ ...d, parentAccounts: [...d.parentAccounts, { ...account, id: uuid() }] }))
  }, [update])

  const updateParentAccount = useCallback((id: string, changes: Partial<ParentAccount>) => {
    update(d => ({ ...d, parentAccounts: d.parentAccounts.map(p => p.id === id ? { ...p, ...changes } : p) }))
  }, [update])

  const deleteParentAccount = useCallback((id: string) => {
    update(d => ({ ...d, parentAccounts: d.parentAccounts.filter(p => p.id !== id) }))
  }, [update])

  // --- Helpers ---
  const getWorker = useCallback((id: string) => data.workers.find(w => w.id === id), [data.workers])

  const balanceForWorker = useCallback((workerId: string): number => {
    const earned = data.workEntries.filter(e => e.workerId === workerId).reduce((s, e) => s + e.grossAmount, 0)
    const paid = data.payments.filter(p => p.workerId === workerId).reduce((s, p) => s + p.amount, 0)
    return Math.round((earned - paid) * 100) / 100
  }, [data.workEntries, data.payments])

  const checkLogin = useCallback((username: string, pin: string): Session | null => {
    const parent = data.parentAccounts.find(p => p.username === username && p.pin === pin)
    if (parent) return { role: 'parent', parentId: parent.id, username, name: parent.name }
    const worker = data.workers.find(w => w.username === username && w.pin === pin && w.isActive)
    if (worker) return { role: 'worker', workerId: worker.id, username, name: worker.name }
    return null
  }, [data.parentAccounts, data.workers])

  return {
    data,
    addWorker, updateWorker,
    addWorkEntry, updateWorkEntry, deleteWorkEntry,
    addPayment, deletePayment,
    addParentAccount, updateParentAccount, deleteParentAccount,
    getWorker,
    balanceForWorker,
    checkLogin,
  }
}
