import type { AppData } from '../types'

const KEY = 'nanny-tracker-data'
const VERSION = 4 // bump this whenever the data model changes in a breaking way

const defaults: AppData = {
  parentAccounts: [
    { id: 'parent-eyal', name: 'Eyal', username: 'eyal', pin: '1234' },
  ],
  workers: [
    {
      id: 'worker-lisa',
      username: 'lisa',
      pin: '0000',
      name: 'Lisa',
      startDate: '2026-05-01',
      isActive: true,
      doesCare: true,
      doesCleaning: false,
      careRate: 65,
      cleaningRate: 0,
      nightRate: 85,
      overtimeMultiplier: 1.25,
    },
  ],
  workEntries: [
    {
      id: 'entry-sun-care',
      workerId: 'worker-lisa',
      date: '2026-05-24',
      startTime: '09:30',
      endTime: '15:50',
      workType: 'baby_care',
      shiftType: 'day',
      hoursWorked: 6.33,
      grossAmount: 411.45,
      createdBy: 'eyal',
    },
    {
      id: 'entry-mon-care',
      workerId: 'worker-lisa',
      date: '2026-05-25',
      startTime: '09:30',
      endTime: '14:30',
      workType: 'baby_care',
      shiftType: 'day',
      hoursWorked: 5,
      grossAmount: 325.0,
      createdBy: 'eyal',
    },
  ],
  payments: [],
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(defaults)

    const parsed = JSON.parse(raw) as Partial<AppData> & { _version?: number }

    // If stored version is older than current, wipe and use defaults
    if (!parsed._version || parsed._version < VERSION) {
      localStorage.removeItem(KEY)
      return structuredClone(defaults)
    }

    return { ...defaults, ...parsed }
  } catch {
    return structuredClone(defaults)
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify({ ...data, _version: VERSION }))
}
