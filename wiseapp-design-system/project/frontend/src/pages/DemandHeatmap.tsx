import { Flame } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { Skeleton } from '../components/Skeleton'
import { ErrorFallback } from '../components/ErrorFallback'
import { useFilterStore } from '../store/filterStore'
import type { AnalyticsNoDataMeta } from '../types/api'
import { getNoDataDescription, getNoDataWindowLabel } from '../utils/noDataReason'

export default function DemandHeatmap() {
  const { globalPeriod } = useFilterStore()
  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.demandHeatmap({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  const getHeatColor = (value: number, max: number) => {
    const intensity = max > 0 ? value / max : 0
    if (intensity === 0) return 'bg-gray-50'
    if (intensity < 0.2) return 'bg-blue-900/40'
    if (intensity < 0.4) return 'bg-blue-800/50'
    if (intensity < 0.6) return 'bg-blue-700/60'
    if (intensity < 0.8) return 'bg-blue-600/70'
    return 'bg-blue-500/80'
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-48 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <Skeleton width="100%" height="300" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorFallback error={error} onRetry={reload} />
  }

  const noData = data && typeof data === 'object' && 'no_data' in data
    ? (data as { no_data?: AnalyticsNoDataMeta }).no_data
    : undefined
  const noDataDescription = getNoDataDescription(noData)
  const noDataWindow = getNoDataWindowLabel(noData)

  if (data.total_orders === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            Тепловая Карта Спроса
          </h1>
          <p className="text-slate-400 mt-1">Интенсивность заказов по дням и часам</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
          <p className="text-slate-600 font-medium">{noDataDescription}</p>
          {noDataWindow && <p className="text-slate-400 text-sm mt-2">{noDataWindow}</p>}
        </div>
      </div>
    )
  }

  const matrix = data.heatmap_matrix
  const maxOrders = Math.max(...matrix.flat(), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Flame className="h-8 w-8 text-orange-500" />
          Тепловая Карта Спроса
        </h1>
        <p className="text-slate-400 mt-1">Интенсивность заказов по дням и часам</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2 text-slate-400 text-sm font-medium"></th>
                {data.hour_labels.map((hour: string) => (
                  <th key={hour} className="p-2 text-slate-400 text-xs font-medium">{hour}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row: number[], dayIdx: number) => (
                <tr key={dayIdx}>
                  <td className="p-2 text-slate-500 text-sm font-medium whitespace-nowrap">
                    {data.day_labels[dayIdx]}
                  </td>
                  {row.map((value: number, hourIdx: number) => (
                    <td key={hourIdx} className="p-0.5">
                      <div
                        className={`w-full h-8 rounded ${getHeatColor(value, maxOrders)} flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-pointer`}
                        title={`${data.day_labels[dayIdx]} ${hourIdx}:00 — ${value} заказов`}
                      >
                        {value > 0 && <span className="text-slate-800/80">{value}</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.peak_hours && data.peak_hours.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Пиковые часы</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {data.peak_hours.slice(0, 5).map((peak: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-400">{peak.hour}:00</p>
                <p className="text-sm text-slate-500 mt-1">{peak.day_name}</p>
                <p className="text-xs text-slate-400 mt-2">{peak.count} заказов</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.insights && data.insights.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Инсайты</h3>
          <ul className="space-y-2">
            {data.insights.map((insight: string, idx: number) => (
              <li key={idx} className="text-slate-500 text-sm flex items-start gap-2">
                <span className="text-brand-500 mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
