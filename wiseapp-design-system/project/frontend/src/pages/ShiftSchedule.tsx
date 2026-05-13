import { Clock, Users, CalendarDays, TrendingUp } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'

const PERIOD_MAP: Record<string, string> = {
  today: '7d', week: '7d', month: '30d', quarter: '90d', year: '90d', custom: '30d',
}

export default function ShiftSchedule() {
  const { globalPeriod } = useFilterStore()
  const apiPeriod = PERIOD_MAP[globalPeriod.preset] || '30d'
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.shifts({ restaurant_id: rid, period: apiPeriod }),
    [apiPeriod],
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const activeNow = data?.active_now || []
  const timeline = data?.shift_timeline || []
  const productivity = data?.staff_productivity || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сменный График</h1>
          <p className="text-gray-500 mt-1">Контроль смен и продуктивности персонала</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Сейчас на смене</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{data?.active_count || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><CalendarDays className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Всего смен</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data?.total_shifts || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Период</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data?.period_days || 7} <span className="text-sm font-normal text-gray-400">дней</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Сотрудников</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{productivity.length}</p>
        </div>
      </div>

      {/* Active Shifts */}
      {activeNow.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
          <div className="p-5 border-b border-emerald-100 bg-emerald-50/50">
            <h2 className="text-lg font-semibold text-gray-900">🟢 Сейчас на смене</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activeNow.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-sm text-gray-500">{s.role} · {s.type}</p>
                </div>
                <span className="text-sm font-medium text-emerald-600">{s.hours_on_shift} ч</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Productivity Table */}
      {productivity.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Продуктивность сотрудников</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Сотрудник</th>
                <th className="px-6 py-4 text-right">Смены</th>
                <th className="px-6 py-4 text-right">Часы</th>
                <th className="px-6 py-4 text-right">Заказы</th>
                <th className="px-6 py-4 text-right">Выручка</th>
                <th className="px-6 py-4 text-right">₸/час</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productivity.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{p.shifts}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{p.hours}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{p.orders}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{p.revenue.toLocaleString()} ₸</td>
                  <td className="px-6 py-4 text-right font-medium text-indigo-600">{p.revenue_per_hour.toLocaleString()} ₸</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shift Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Лента смен</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {timeline.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/80 transition-colors">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.employee}</p>
                  <p className="text-xs text-gray-400">{s.role} · {new Date(s.clock_in).toLocaleDateString('ru')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{s.hours} ч</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.status === 'active' ? 'Активна' : 'Закрыта'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {timeline.length === 0 && activeNow.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Нет данных о сменах за выбранный период</p>
        </div>
      )}
    </div>
  )
}
