import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../context/AppContext'
import { Card, PageHeader, EmptyState } from '../components/ui'
import { currentMonthEntries, formatCurrency, totalGross, totalHours } from '../lib/utils'
import { format, parseISO, getWeek } from 'date-fns'

export function DashboardPage() {
  const { data, balanceForWorker } = useApp()
  const activeWorkers = data.workers.filter(w => w.isActive)
  const monthEntries = currentMonthEntries(data.workEntries)
  const monthPayments = useMemo(() => {
    const now = new Date()
    const month = format(now, 'yyyy-MM')
    return data.payments.filter(p => p.date.startsWith(month))
  }, [data.payments])

  const totalOwed = activeWorkers.reduce((s, w) => s + Math.max(balanceForWorker(w.id), 0), 0)
  const totalPaidMonth = monthPayments.reduce((s, p) => s + p.amount, 0)
  const totalHoursMonth = totalHours(monthEntries)

  const weeklyData = useMemo(() => {
    const weeks: Record<string, Record<string, number>> = {}
    monthEntries.forEach(e => {
      const weekNum = `W${getWeek(parseISO(e.date))}`
      if (!weeks[weekNum]) weeks[weekNum] = { week: weekNum as unknown as number }
      weeks[weekNum]![e.workerId] = (weeks[weekNum]![e.workerId] ?? 0) + e.hoursWorked
    })
    return Object.values(weeks)
  }, [monthEntries])

  const COLORS = ['#374151', '#6b7280', '#9ca3af', '#d1d5db']

  return (
    <div>
      <PageHeader title={`Dashboard — ${format(new Date(), 'MMMM yyyy')}`} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-xs text-gray-400 mb-1">Total Hours (month)</p>
          <p className="text-2xl font-semibold text-gray-900">{totalHoursMonth}h</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Total Owed</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalOwed)}</p>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <p className="text-xs text-gray-400 mb-1">Paid This Month</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalPaidMonth)}</p>
        </Card>
      </div>

      {/* Per worker balances */}
      <Card className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Balance per Worker</h3>
        {activeWorkers.length === 0 ? (
          <EmptyState message="No workers added yet" />
        ) : (
          <div className="space-y-3">
            {activeWorkers.map(w => {
              const balance = balanceForWorker(w.id)
              return (
                <div key={w.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{w.name}</p>
                    <p className="text-xs text-gray-400">
                      {totalHours(monthEntries.filter(e => e.workerId === w.id))}h this month
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {balance > 0 ? `Owed ${formatCurrency(balance)}` : 'Settled'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Hours chart */}
      {weeklyData.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Hours per Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {activeWorkers.map((w, i) => (
                <Bar key={w.id} dataKey={w.id} name={w.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Earned vs paid chart */}
      {activeWorkers.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Earned vs Paid (month)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={activeWorkers.map(w => ({
                name: w.name,
                Earned: totalGross(monthEntries.filter(e => e.workerId === w.id)),
                Paid: monthPayments.filter(p => p.workerId === w.id).reduce((s, p) => s + p.amount, 0),
              }))}
            >
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Earned" fill="#374151" />
              <Bar dataKey="Paid" fill="#9ca3af" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
