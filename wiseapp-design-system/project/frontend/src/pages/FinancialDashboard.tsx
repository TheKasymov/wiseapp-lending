import { AlertCircle } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import KPICard from '../components/KPICard'
import Skeleton, { KPICardSkeleton, ChartSkeleton, ListSkeleton } from '../components/Skeleton'
import { useFilterStore } from '../store/filterStore'
import { ErrorFallback } from '../components/ErrorFallback'
import type { AnalyticsNoDataMeta } from '../types/api'
import { getNoDataDescription, getNoDataTitle, getNoDataWindowLabel } from '../utils/noDataReason'

export default function FinancialDashboardPage() {
  const { globalPeriod } = useFilterStore()
  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.financial({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-56 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton /><ChartSkeleton />
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <Skeleton width="40%" height="1.25rem" className="mb-4" />
          <ListSkeleton count={10} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <ErrorFallback error={error} onRetry={reload} />
    )
  }

  const { kpis, revenue_trend, top_products, comparison, forecast, insights } = data as {
    kpis: any
    revenue_trend: any[]
    top_products: any[]
    comparison: any
    forecast: any[]
    insights: string[]
    no_data?: AnalyticsNoDataMeta
  }
  const noData = data && typeof data === 'object' && 'no_data' in data
    ? (data as { no_data?: AnalyticsNoDataMeta }).no_data
    : undefined
  const noDataTitle = getNoDataTitle(noData)
  const noDataDescription = getNoDataDescription(noData)
  const noDataWindow = getNoDataWindowLabel(noData)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-500" />
          Финансовый Дашборд
        </h1>
        <p className="text-slate-400 mt-1">Ключевые финансовые метрики и прогнозы</p>
      </div>

      {noData && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">{noDataTitle}</p>
              <p className="text-sm text-blue-800">{noDataDescription}</p>
              {noDataWindow && <p className="text-xs text-blue-700 mt-1">{noDataWindow}</p>}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Выручка" value={`${kpis.total_revenue.toLocaleString('ru-RU')} ₸`} icon={<DollarSign className="h-6 w-6 text-slate-800" />} color="bg-green-600/20" />
        <KPICard title="Заказы" value={kpis.total_orders} icon={<DollarSign className="h-6 w-6 text-slate-800" />} color="bg-brand-600/20" />
        <KPICard title="Средний чек" value={`${kpis.avg_check.toLocaleString('ru-RU')} ₸`} icon={<DollarSign className="h-6 w-6 text-slate-800" />} color="bg-purple-600/20" />
        <KPICard title="Выручка/день" value={`${kpis.revenue_per_day?.toLocaleString('ru-RU') || 0} ₸`} icon={<DollarSign className="h-6 w-6 text-slate-800" />} color="bg-orange-600/20" />
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Динамика выручки</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Сравнение периодов</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Текущий', orders: comparison.current_orders, revenue: comparison.current_revenue },
              { name: 'Прошлый', orders: comparison.previous_orders, revenue: comparison.previous_revenue },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Топ-10 товаров по выручке</h3>
        {top_products.length === 0 && (
          <p className="text-sm text-slate-500 mb-4">Нет delivery-заказов за период: список топ-товаров пока пуст.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {top_products.slice(0, 10).map((product: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center text-green-400 font-semibold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{product.product_name}</p>
                  <p className="text-xs text-slate-400">{product.total_qty} шт • {product.order_count} заказов</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-green-400">{product.total_revenue.toLocaleString('ru-RU')} ₸</p>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">🔮 Прогноз на 7 дней</h3>
          <div className="grid grid-cols-7 gap-3">
            {forecast.map((day: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-slate-400">{day.date?.slice(5) || ''}</p>
                <p className="text-lg font-bold text-brand-500 mt-1">{day.predicted_orders}</p>
                <p className="text-xs text-slate-500">{day.predicted_revenue?.toLocaleString('ru-RU') || 0} ₸</p>
                {day.predicted_revenue_p90 != null && (
                  <p className="text-[11px] text-slate-400">
                    P50/P90: {(day.predicted_revenue_p50 ?? day.predicted_revenue)?.toLocaleString('ru-RU')} / {day.predicted_revenue_p90.toLocaleString('ru-RU')} ₸
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">{Math.round((day.confidence || 0) * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Инсайты</h3>
          <ul className="space-y-2">
            {insights.map((insight: string, idx: number) => (
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
