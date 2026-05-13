import { useState, useEffect } from 'react'
import { DollarSign, ShoppingCart, TrendingUp, Clock, Target, BarChart3, Package, AlertTriangle, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsApi } from '../services/analyticsApi'
import { iikoApi } from '../services/iikoApi'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { useFilterStore } from '../store/filterStore'
import { StatCard } from '../components/ui'
import { KPICardSkeleton, ChartSkeleton, ListSkeleton } from '../components/Skeleton'
import { ErrorFallback } from '../components/ErrorFallback'
import type { Restaurant, TopProduct } from '../types/api'

import LossPreventionWidget from '../components/widgets/LossPreventionWidget'
import LeaderboardWidget from '../components/widgets/LeaderboardWidget'

const scopeLabel = (scope?: string) => {
  switch (scope) {
    case 'prices':
      return 'Цены'
    case 'orders':
      return 'Заказы'
    case 'access_token':
      return 'Токен доступа'
    case 'organizations':
      return 'Организации'
    default:
      return scope || 'Проверка'
  }
}

const fallbackReasonLabel = (reason?: string) => {
  switch (reason) {
    case 'source_empty':
      return 'Источник delivery вернул пустой набор заказов'
    case 'invalid_ratio':
      return 'Высокая доля невалидных заказов в delivery-канале'
    case 'permission_or_unsupported':
      return 'Delivery endpoint недоступен по правам или версии API'
    case 'cooldown':
      return 'Table fallback временно на cooldown'
    default:
      return null
  }
}

const noDataReasonLabel = (reason?: string) => {
  switch (reason) {
    case 'source_empty':
      return 'Источник не вернул заказы'
    case 'only_deleted':
      return 'В источнике только удаленные заказы'
    case 'only_zero_sum':
      return 'В источнике только заказы с нулевой суммой'
    case 'permission_blocked':
      return 'Источник заблокирован по правам API'
    default:
      return null
  }
}

const syncQualityLabel = (quality?: string) => {
  if (quality === 'degraded') return 'degraded'
  if (quality === 'good') return 'good'
  return null
}

export default function Dashboard() {
  const { globalPeriod } = useFilterStore()
  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.financial({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
    'dashboard-financial',
  )
  const { data: actionData } = useAnalyticsData(
    (rid) => analyticsApi.recommendations({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
    'dashboard-action-center',
  )

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    iikoApi.listRestaurants()
      .then(r => setRestaurants(r.data || []))
      .catch((err) => console.error('Failed to load restaurants for dashboard:', err))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <div><ListSkeleton count={5} /></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorFallback error={error} onRetry={reload} />
  }

  const safeKpis = data.kpis || {
    total_revenue: 0,
    total_orders: 0,
    avg_check: 0,
    active_days: 0,
    revenue_change: 0,
    orders_change: 0,
    avg_check_change: 0,
  }
  const safeTrend = data.revenue_trend || []
  const safeTopProducts: TopProduct[] = data.top_products || []
  const actionItems = (actionData?.recommendations || []).slice(0, 3)
  const dataQuality = data.data_quality

  const primaryRestaurant = restaurants[0]
  const limitedChecks = (primaryRestaurant?.sync_status?.permission_matrix || []).filter(
    (p) => p.status === 'permission_denied' || p.status === 'unsupported_by_docs'
  )
  const syncWarnings = primaryRestaurant?.sync_status?.sync_errors || []
  const deniedByQuality = dataQuality?.permission_denied_scopes || []
  const missingSources = dataQuality?.missing_sources || []
  const hasCoverageLimit =
    Boolean(primaryRestaurant?.sync_status?.data_limited) ||
    limitedChecks.length > 0 ||
    deniedByQuality.some((scope: any) => scope?.status === 'permission_denied' || scope?.status === 'unsupported_by_docs')
  const hasSyncWarmup = missingSources.length > 0
  const hasNoOrders = (safeKpis.total_orders || 0) === 0
  const ordersDiagnostics = primaryRestaurant?.sync_status?.orders_diagnostics
  const ordersSyncQuality = syncQualityLabel(ordersDiagnostics?.sync_quality)
  const ordersFallbackReason = fallbackReasonLabel(ordersDiagnostics?.fallback_reason)
  const ordersNoDataReason = noDataReasonLabel(ordersDiagnostics?.no_data_reason)

  const averageDailyRevenue = safeKpis.active_days > 0
    ? Math.round(safeKpis.total_revenue / safeKpis.active_days)
    : 0

  return (
    <div className="space-y-6">
      {hasCoverageLimit && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900">
              {limitedChecks.some((c) => c.status === 'permission_denied')
                ? 'Данные ограничены по правам iiko API'
                : 'Данные частично ограничены по coverage Public API docs'}
            </p>
          </div>
          {typeof dataQuality?.freshness_lag_minutes === 'number' && (
            <p className="text-xs text-amber-700">
              Freshness lag: {dataQuality.freshness_lag_minutes} мин
            </p>
          )}
          {missingSources.map((scope: string, idx: number) => (
            <p key={`dash-missing-${idx}`} className="text-xs text-amber-700">
              Нет данных источника: {scopeLabel(scope)}
            </p>
          ))}
          {deniedByQuality.map((check: any, idx: number) => (
            <p key={`dash-quality-check-${idx}`} className="text-xs text-amber-700">
              {scopeLabel(check.scope)}: {check.message || 'Нет доступа'}
              {check.correlation_id ? ` (correlationId: ${check.correlation_id})` : ''}
            </p>
          ))}
          {limitedChecks.map((check, idx) => (
            <p key={`dash-check-${idx}`} className="text-xs text-amber-700">
              {scopeLabel(check.scope)}: {check.message || 'Нет доступа'}
              {check.correlation_id ? ` (correlationId: ${check.correlation_id})` : ''}
            </p>
          ))}
          {syncWarnings.map((msg, idx) => (
            <p key={`dash-warning-${idx}`} className="text-xs text-amber-700">
              {msg}
            </p>
          ))}
          {ordersSyncQuality && (
            <p className="text-xs text-amber-700">
              Качество синка заказов: {ordersSyncQuality}
            </p>
          )}
          {ordersFallbackReason && (
            <p className="text-xs text-amber-700">
              Причина fallback: {ordersFallbackReason}
            </p>
          )}
          {ordersNoDataReason && (
            <p className="text-xs text-amber-700">
              Причина пустых данных: {ordersNoDataReason}
            </p>
          )}
        </div>
      )}

      {!hasCoverageLimit && ordersDiagnostics?.sync_quality === 'degraded' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              Синк заказов в деградированном режиме
            </p>
          </div>
          {ordersFallbackReason && (
            <p className="text-xs text-blue-700">
              Причина fallback: {ordersFallbackReason}
            </p>
          )}
          {ordersNoDataReason && (
            <p className="text-xs text-blue-700">
              Причина пустых данных: {ordersNoDataReason}
            </p>
          )}
        </div>
      )}

      {!hasCoverageLimit && hasSyncWarmup && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              Идет первичная синхронизация: часть данных пока заполняется
            </p>
          </div>
          {missingSources.map((scope: string, idx: number) => (
            <p key={`dash-warmup-${idx}`} className="text-xs text-blue-700">
              Источник пока не заполнен: {scopeLabel(scope)}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Выручка"
          value={safeKpis.total_revenue}
          valueSuffix=" ₸"
          icon={<DollarSign className="h-5 w-5" />}
          change={safeKpis.revenue_change}
        />
        <StatCard
          title="Средняя выручка"
          value={averageDailyRevenue}
          valueSuffix=" ₸ / день"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title="Количество чеков"
          value={safeKpis.total_orders}
          icon={<ShoppingCart className="h-5 w-5" />}
          change={safeKpis.orders_change}
        />
        <StatCard
          title="Средний чек"
          value={safeKpis.avg_check}
          valueSuffix=" ₸"
          icon={<TrendingUp className="h-5 w-5" />}
          change={safeKpis.avg_check_change}
        />
        <StatCard
          title="Активные дни"
          value={safeKpis.active_days}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Товаров продано"
          value={safeKpis.total_items || 0}
          icon={<Package className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Выручка по дням</h3>
          {safeTrend.length === 0 && hasCoverageLimit && (
            <p className="text-xs text-amber-700 mb-3">
              График может быть пустым из-за ограничений прав API или coverage публичных endpoint.
            </p>
          )}
          {safeTrend.length === 0 && !hasCoverageLimit && hasNoOrders && (
            <p className="text-xs text-slate-500 mb-3">
              За выбранный период в iiko Delivery API заказов нет. Это нормальная ситуация, а не ошибка подключения.
            </p>
          )}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={safeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Топ товары</h3>
          {safeTopProducts.length === 0 && hasCoverageLimit && (
            <p className="text-xs text-amber-700 mb-3">
              Топ товаров недоступен: не хватает данных по заказам или недоступны нужные публичные endpoint.
            </p>
          )}
          {safeTopProducts.length === 0 && !hasCoverageLimit && hasNoOrders && (
            <p className="text-xs text-slate-500 mb-3">
              В iiko Delivery API нет заказов за период, поэтому топ товаров не формируется.
            </p>
          )}
          <div className="space-y-3">
            {safeTopProducts.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-700 font-semibold text-sm border border-gray-200">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{product.product_name}</p>
                    <p className="text-xs text-slate-500">{product.order_count} заказов</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-brand-600">
                  {product.total_revenue.toLocaleString('ru-RU')} ₸
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardWidget />
        <LossPreventionWidget />
      </div>

      <div className="glass-card p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Action Center
        </h3>
        {actionItems.length === 0 ? (
          <p className="text-sm text-slate-500">Рекомендации появятся, когда накопится больше данных по заказам и складу.</p>
        ) : (
          <div className="space-y-3">
            {actionItems.map((item: any) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                    item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-sky-100 text-sky-700'
                  }`}>
                    {item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-500" />
          AI Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/cohort" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
            <div>
              <p className="text-sm font-semibold text-slate-700">Churn Risk</p>
              <p className="text-xs text-slate-500 mt-0.5">Клиенты под угрозой оттока</p>
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600">→</span>
          </Link>
          <Link to="/demand" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
            <div>
              <p className="text-sm font-semibold text-slate-700">Demand Forecast</p>
              <p className="text-xs text-slate-500 mt-0.5">Прогноз спроса</p>
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600">→</span>
          </Link>
          <Link to="/cohort" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
            <div>
              <p className="text-sm font-semibold text-slate-700">RFM Segments</p>
              <p className="text-xs text-slate-500 mt-0.5">Сегментация клиентов</p>
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
