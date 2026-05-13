import { Filter, ArrowRight } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { Skeleton, KPICardSkeleton, ListSkeleton } from '../components/Skeleton'
import { useFilterStore } from '../store/filterStore'
import { ErrorFallback } from '../components/ErrorFallback'

export default function OrderFunnel() {
  const { globalPeriod } = useFilterStore()
  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.orderFunnel({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-48 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <Skeleton width="40%" height="1.25rem" className="mb-6" />
          <ListSkeleton count={5} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <ErrorFallback error={error} onRetry={reload} />
    )
  }

  const hasFunnelData = Array.isArray(data.funnel) && data.funnel.length > 0
  if (!hasFunnelData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Filter className="h-8 w-8 text-cyan-500" />
            Воронка Заказов
          </h1>
          <p className="text-slate-400 mt-1">Конверсия, потери и причины отмен</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
          <p className="text-slate-600 font-medium">За выбранный период в iiko Delivery API нет данных по заказам</p>
          <p className="text-slate-400 text-sm mt-2">
            Это нормальная ситуация, а не ошибка API.
          </p>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...data.funnel.map((s: any) => s.count), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Filter className="h-8 w-8 text-cyan-500" />
          Воронка Заказов
        </h1>
        <p className="text-slate-400 mt-1">Конверсия, потери и причины отмен</p>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Конверсия по этапам</h3>
        <div className="space-y-4">
          {data.funnel.map((stage: any, idx: number) => {
            const width = (stage.count / maxCount) * 100
            const colors = ['bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600', 'bg-gray-600']
            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-40 text-right">
                  <p className="text-sm font-medium text-slate-800">{stage.stage}</p>
                  <p className="text-xs text-slate-400">{stage.percentage}%</p>
                </div>
                <div className="flex-1">
                  <div className={`h-10 ${colors[idx % colors.length]} rounded-lg flex items-center justify-between px-4 transition-all`} style={{ width: `${Math.max(width, 10)}%` }}>
                    <span className="text-slate-800 font-semibold">{stage.count}</span>
                    <span className="text-slate-800/80 text-sm">{stage.revenue?.toLocaleString('ru-RU') || 0} ₸</span>
                  </div>
                </div>
                {idx < data.funnel.length - 1 && (
                  <div className="text-slate-400">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Конверсия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.conversion_rates?.slice(0, 6).map((conv: any, idx: number) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-slate-400">{conv.stage}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{conv.conversion_rate}%</p>
              <p className="text-xs text-slate-400 mt-1">Потери: {conv.drop_off}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Reasons */}
      {data.cancellation_reasons && data.cancellation_reasons.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Причины отмен</h3>
          <div className="space-y-3">
            {data.cancellation_reasons.map((reason: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-slate-800 font-medium">{reason.reason}</p>
                  <p className="text-xs text-slate-400">{reason.count} случаев</p>
                </div>
                <p className="text-sm font-semibold text-red-400">-{reason.lost_revenue?.toLocaleString('ru-RU') || 0} ₸</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lost Revenue */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Потерянная выручка</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-slate-400">Отменённые заказы</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{data.lost_revenue?.cancelled_orders || 0}</p>
            <p className="text-sm text-slate-500">{data.lost_revenue?.cancelled_revenue?.toLocaleString('ru-RU') || 0} ₸</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-slate-400">Заброшенные черновики</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{data.lost_revenue?.abandoned_drafts || 0}</p>
            <p className="text-sm text-slate-500">{data.lost_revenue?.abandoned_revenue?.toLocaleString('ru-RU') || 0} ₸</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-red-600/10 border border-red-600/20 rounded-lg">
          <p className="text-lg font-bold text-red-400">
            Всего потеряно: {data.lost_revenue?.total_lost_revenue?.toLocaleString('ru-RU') || 0} ₸
          </p>
        </div>
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Инсайты</h3>
          <ul className="space-y-2">
            {data.insights.map((insight: string, idx: number) => (
              <li key={idx} className="text-slate-500 text-sm flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
