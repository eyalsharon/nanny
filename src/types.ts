export type WorkType = 'baby_care' | 'cleaning'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'other'
export type ShiftType = 'day' | 'night'
export type Role = 'parent' | 'worker'

export interface ParentAccount {
  id: string
  name: string
  username: string
  pin: string
}

export interface Worker {
  id: string
  username: string
  pin: string
  name: string
  phone?: string
  startDate: string
  isActive: boolean
  doesCare: boolean       // can do baby care
  doesCleaning: boolean   // can do cleaning
  careRate: number        // ₪/h for baby care (day)
  cleaningRate: number    // ₪/h for cleaning (day)
  nightRate: number       // ₪/h for any night work
  overtimeMultiplier: number
}

export interface WorkEntry {
  id: string
  workerId: string
  date: string
  startTime: string
  endTime: string
  workType: WorkType
  shiftType: ShiftType
  hoursWorked: number
  grossAmount: number
  notes?: string
  createdBy: string
}

export interface Payment {
  id: string
  workerId: string
  date: string
  amount: number
  method: PaymentMethod
  periodStart: string
  periodEnd: string
  notes?: string
  imageDataUrl?: string
}

export interface AppData {
  workers: Worker[]
  workEntries: WorkEntry[]
  payments: Payment[]
  parentAccounts: ParentAccount[]
}

export interface Session {
  role: Role
  workerId?: string
  parentId?: string
  username: string
  name: string
}
