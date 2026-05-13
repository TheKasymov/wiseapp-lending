import { Shield, AlertTriangle, Moon, RotateCcw, Percent, Info } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'

export default function FraudDetector() {
  const { globalPeriod } = useFilterStore()
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.fraud({ restaurant_id: rid, period: globalPeriod.preset, sensitivity: 3 }),
    [globalPeriod.preset],
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const summary = data?.summary || { total_alerts: 0, critical: 0, warning: 0 }
  const alerts = data?.fraud_alerts || []
  const checked = data?.checked_orders || 0

  const typeIcons: Record<string, any> = {
    full_discount: <Percent className="w-5 h-5" />,
    cancel_cycle: <RotateCcw className="w-5 h-5" />,
    night_ops: <Moon className="w-5 h-5" />,
    ghost_refund: <AlertTriangle className="w-5 h-5" />,
  }
  const typeLabels: Record<string, string> = {
    full_discount: 'Скидка 100%',
    cancel_cycle: 'Цикл отмен',
    night_ops: 'Ночные операции',
    ghost_refund: 'Возврат без чека',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Фрод-детектор</h1>
        <p className="text-gray-500 mt-1">Обнаружение подозрительных операций · Проверено {checked.toLocaleString()} заказов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Shield className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Всего алертов</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.total_alerts}</p>
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
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Обнаруженные угрозы</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-3" />
              <p>Подозрительных операций не обнаружено</p>
            </div>
          ) : alerts.map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors">
              <div className={`p-2.5 rounded-xl ${a.severity === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                {typeIcons[a.type] || <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{a.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {typeLabels[a.type] || a.type} · {a.period} · {a.count} случаев
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                a.severity === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
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
