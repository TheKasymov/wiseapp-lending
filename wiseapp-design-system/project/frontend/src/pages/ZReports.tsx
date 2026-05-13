import { FileCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'

const PERIOD_MAP: Record<string, string> = {
  today: '7d', week: '7d', month: '30d', quarter: '90d', year: '90d', custom: '30d',
}

export default function ZReports() {
  const { globalPeriod } = useFilterStore()
  const apiPeriod = PERIOD_MAP[globalPeriod.preset] || '30d'
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.zReports({ restaurant_id: rid, period: apiPeriod }),
    [apiPeriod],
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const reconciliation = data?.reconciliation || []
  const summary = data?.summary || { total_days: 0, critical: 0, warning: 0, ok: 0, total_discrepancy: 0 }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сверка Z-отчётов</h1>
          <p className="text-gray-500 mt-1">Сравнение данных POS-кассы с ERP-системой</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileCheck className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Дней сверено</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.total_days}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Совпадает</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{summary.ok}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Предупреждения</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{summary.warning}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><XCircle className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Критические</span>
          </div>
          <p className="text-3xl font-bold text-rose-600">{summary.critical}</p>
        </div>
      </div>

      {/* Total Discrepancy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-500 mb-1">Общая сумма расхождений</p>
        <p className="text-3xl font-bold text-gray-900">{Math.round(summary.total_discrepancy).toLocaleString()} ₸</p>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Детальная сверка по дням</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Дата</th>
                <th className="px-6 py-4 text-right">POS Выручка</th>
                <th className="px-6 py-4 text-right">ERP Выручка</th>
                <th className="px-6 py-4 text-right">Разница</th>
                <th className="px-6 py-4 text-right">POS Заказы</th>
                <th className="px-6 py-4 text-right">ERP Заказы</th>
                <th className="px-6 py-4 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reconciliation.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.date}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{Math.round(r.pos_revenue).toLocaleString()} ₸</td>
                  <td className="px-6 py-4 text-right text-gray-600">{Math.round(r.erp_revenue).toLocaleString()} ₸</td>
                  <td className={`px-6 py-4 text-right font-medium ${
                    r.severity === 'critical' ? 'text-rose-600' : r.severity === 'warning' ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {r.revenue_diff > 0 ? '+' : ''}{Math.round(r.revenue_diff).toLocaleString()} ₸
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{r.pos_orders}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{r.erp_orders}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.severity === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : r.severity === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {r.severity === 'critical' ? 'Критично' : r.severity === 'warning' ? 'Внимание' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
