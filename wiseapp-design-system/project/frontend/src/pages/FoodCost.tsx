import { AlertCircle, DollarSign, Percent, Target, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { analyticsApi } from '../services/analyticsApi'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { useFilterStore } from '../store/filterStore'
import { PageHeader, StatCard, ChartCard, EmptyState } from '../components/ui'
import { KPICardSkeleton, ChartSkeleton } from '../components/Skeleton'
import type { AnalyticsNoDataMeta } from '../types/api'
import { getNoDataDescription, getNoDataTitle, getNoDataWindowLabel } from '../utils/noDataReason'

export default function FoodCost() {
  const { globalPeriod } = useFilterStore()

  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.foodCost({
      restaurant_ids: rid ? [rid] : undefined,
      period: globalPeriod.preset,
    }),
    [globalPeriod],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Нет данных о Food Cost"
        description={error || 'Не удалось загрузить данные. Попробуйте выбрать другой период.'}
        onAction={reload}
        actionLabel="Попробовать снова"
      />
    )
  }

  const { overall, by_category, trend, top_costly_products } = data as {
    overall: {
      revenue: number
      cogs: number
      food_cost_percent: number
      theoretical_percent: number
      variance: number
    }
    by_category: Array<{ name: string; status: string; fc_percent: number }>
    trend: Array<{ date: string; percent: number }>
    top_costly_products: Array<{ name: string; cost: number; fc_contribution: number }>
    no_data?: AnalyticsNoDataMeta
  }

  const noData = data && typeof data === 'object' && 'no_data' in data
    ? (data as { no_data?: AnalyticsNoDataMeta }).no_data
    : undefined
  const noDataTitle = getNoDataTitle(noData)
  const noDataDescription = getNoDataDescription(noData)
  const noDataWindow = getNoDataWindowLabel(noData)

  const getChartColor = (status: string) => {
    switch (status) {
      case 'critical': return '#f43f5e'
      case 'warning': return '#f59e0b'
      case 'normal': return '#10b981'
      default: return '#94a3b8'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in custom-scrollbar">
      <PageHeader
        title="Food Cost"
        subtitle="Анализ себестоимости и отклонений"
      />

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Food Cost (Факт)"
          value={overall.food_cost_percent}
          valueSuffix="%"
          icon={<Percent className="h-5 w-5" />}
          trend={overall.food_cost_percent > overall.theoretical_percent ? overall.variance : -Math.abs(overall.variance)}
          trendSuffix=" от плана"
          trendInverted
        />
        <StatCard
          title="Food Cost (План)"
          value={overall.theoretical_percent}
          valueSuffix="%"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="COGS (Себестоимость)"
          value={overall.cogs}
          valueSuffix=" ₸"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Выручка"
          value={overall.revenue}
          valueSuffix=" ₸"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Тренд Food Cost (%)">
          {trend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Нет delivery-заказов за период - тренд пока пуст.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <LineTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  name="Food Cost %"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Food Cost по категориям">
          {by_category.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Нет заказов и категорий для построения графика.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={by_category} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <LineTooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="fc_percent" name="Фактический FC %" radius={[0, 4, 4, 0]}>
                  {by_category.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-slate-900">Топ затратных товаров</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Товар</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Себестоимость</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Вклад в Food Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {top_costly_products.length === 0 && (
                <tr>
                  <td className="px-6 py-5 text-sm text-slate-500" colSpan={3}>
                    Нет позиций для отображения: в выбранном периоде отсутствуют заказы.
                  </td>
                </tr>
              )}
              {top_costly_products.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-slate-900">{item.cost.toLocaleString('ru-RU')} ₸</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600">
                      {item.fc_contribution}%
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
