import { AlertTriangle, TrendingUp, TrendingDown, Activity, Shield, Info } from 'lucide-react'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'

export default function AnomalyDetector() {
  const { globalPeriod } = useFilterStore()
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.anomalies({ restaurant_id: rid, period: globalPeriod.preset, sensitivity: 2.0 }),
    [globalPeriod.preset],
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const summary = data?.summary || { total_anomalies: 0, critical: 0, warning: 0, avg_revenue: 0 }
  const anomalies = data?.anomalies || []
  const dailyStats = data?.daily_stats || []
  const thresholds = data?.thresholds || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Детектор Аномалий</h1>
        <p className="text-gray-500 mt-1">Статистический анализ отклонений (Z-Score)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Activity className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Всего аномалий</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.total_anomalies}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Критические</span>
          </div>
          <p className="text-3xl font-bold text-rose-600">{summary.critical}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Shield className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Предупреждения</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{summary.warning}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Средняя выручка</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(summary.avg_revenue || 0).toLocaleString()} ₸</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Выручка по дням</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [`${Math.round(v).toLocaleString()} ₸`, 'Выручка']} />
            {thresholds.revenue_upper && <ReferenceLine y={thresholds.revenue_upper} stroke="#ef4444" strokeDasharray="5 5" label="Верх. граница" />}
            {thresholds.revenue_lower && <ReferenceLine y={thresholds.revenue_lower} stroke="#f59e0b" strokeDasharray="5 5" label="Ниж. граница" />}
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Обнаруженные аномалии</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {anomalies.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Info className="w-10 h-10 mx-auto mb-3" />
              <p>Аномалий не обнаружено за выбранный период</p>
            </div>
          ) : anomalies.slice(0, 10).map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors">
              <div className={`p-2 rounded-xl ${a.severity === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                {a.direction === 'high' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{a.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.date} · Z-Score: {a.z_score}</p>
                {a.employee_shifts && a.employee_shifts.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium mr-1">Работали в смену:</span>
                    {a.employee_shifts.map((emp: any, j: number) => (
                      <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200">
                        {emp.name} ({emp.role})
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${a.severity === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                {a.severity === 'critical' ? 'Критично' : 'Внимание'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
