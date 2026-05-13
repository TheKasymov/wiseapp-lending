import { CalendarHeart, TrendingUp, ShoppingBag, Target } from 'lucide-react'
import { analyticsApi } from '../services/analyticsApi'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { PageHeader, StatCard, EmptyState, Badge } from '../components/ui'
import { KPICardSkeleton, ListSkeleton } from '../components/Skeleton'

export default function HolidayImpact() {
  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.holidayImpactAnalysis({
      restaurant_ids: rid ? [rid] : undefined,
      period: 'year', // Holidays usually makes sense looking back a year
      country_code: 'KZ'
    }),
    []
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
        </div>
        <ListSkeleton count={5} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Нет данных по праздникам"
        description={error || "Не удалось загрузить влияние праздников."}
        onAction={reload}
        actionLabel="Попробовать снова"
      />
    )
  }

  const { summary, by_holiday, upcoming_forecast } = data

  return (
    <div className="space-y-6 animate-fade-in custom-scrollbar">
      <PageHeader 
        title="Влияние праздников" 
        subtitle="Анализ изменения спроса в праздничные дни"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Revenue Lift (Средний)"
          value={summary.avg_revenue_lift_percent}
          valueSuffix="%"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={summary.avg_revenue_lift_percent}
          trendSuffix=" %"
        />
        <StatCard
          title="Orders Lift (Средний)"
          value={summary.avg_orders_lift_percent}
          valueSuffix="%"
          icon={<ShoppingBag className="h-5 w-5" />}
          trend={summary.avg_orders_lift_percent}
          trendSuffix=" %"
        />
        <StatCard
          title="Дней проанализировано"
          value={summary.total_holidays_analyzed}
          icon={<CalendarHeart className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-slate-900">Исторические данные</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Праздник</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Выручка (Lift)</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Заказы (Lift)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {by_holiday.map((h: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{h.name}</div>
                        <div className="text-xs text-slate-500">{h.type}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{h.date}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={h.revenue_vs_normal > 1 ? 'success' : h.revenue_vs_normal < 1 ? 'danger' : 'secondary'}>
                          x{h.revenue_vs_normal}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={h.orders_vs_normal > 1 ? 'success' : h.orders_vs_normal < 1 ? 'danger' : 'secondary'}>
                          x{h.orders_vs_normal}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {by_holiday.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        В выбранном периоде праздники не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-500" />
              Прогноз (Предстоящие)
            </h3>
            <div className="space-y-4">
              {upcoming_forecast.map((fc: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-brand-100 bg-brand-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{fc.name}</h4>
                      <p className="text-xs text-slate-500">{fc.date}</p>
                    </div>
                    <Badge variant="warning">
                      Lift: x{fc.predicted_revenue_lift}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    {fc.recommended_prep.map((rec: string, i: number) => (
                      <div key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="text-brand-500 mt-0.5">•</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {upcoming_forecast.length === 0 && (
                <p className="text-center text-sm text-slate-500">
                  Нет приближающихся праздников
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
