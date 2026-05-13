import { useFilterStore } from '../store/filterStore'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { Heart, Users, RefreshCcw, UserMinus, AlertTriangle } from 'lucide-react'
import { ErrorFallback } from '../components/ErrorFallback'

export default function LoyaltyAnalytics() {
  const { globalPeriod } = useFilterStore()
  
  // days_back based on period
  let daysBack = 30
  if (globalPeriod.preset === 'week') daysBack = 7
  if (globalPeriod.preset === 'quarter') daysBack = 90
  if (globalPeriod.preset === 'year') daysBack = 365

  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.loyaltyRetention({ restaurant_id: rid, days_back: daysBack }),
    [daysBack],
    'loyalty-retention'
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in text-slate-100">
        <div>
          <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-48 bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card h-28 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorFallback error={error} onRetry={reload} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-rose-400 drop-shadow-sm flex items-center gap-3">
          <Heart className="h-8 w-8 text-rose-500" />
          Лояльность и Удержание
        </h1>
        <p className="text-slate-400 font-medium">Когортный анализ и уровень оттока за последние {daysBack} дней</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-24 w-24 text-brand-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-brand-500/20 backdrop-blur-md rounded-xl drop-shadow-lg">
              <Users className="h-6 w-6 text-brand-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Всего гостей</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-white tabular-nums drop-shadow-md">
              {data.total_customers.toLocaleString('ru-RU')}
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">Активные за период</p>
          </div>
        </div>

        {/* Repeat Rate */}
        <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCcw className="h-24 w-24 text-emerald-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-500/20 backdrop-blur-md rounded-xl drop-shadow-lg">
              <RefreshCcw className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Repeat Rate</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-white tabular-nums drop-shadow-md">
              {data.repeat_rate}%
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">({data.returning_customers} вернулось)</p>
          </div>
        </div>

        {/* Churn Risk % */}
        <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="h-24 w-24 text-rose-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-rose-500/20 backdrop-blur-md rounded-xl drop-shadow-lg">
              <AlertTriangle className="h-6 w-6 text-rose-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Churn Risk</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-rose-100 tabular-nums drop-shadow-md">
              {data.churn_risk}%
            </h3>
            <p className="text-xs text-rose-300/80 mt-2 font-medium">Риск потери гостей</p>
          </div>
        </div>

        {/* Churn Numbers */}
        <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserMinus className="h-24 w-24 text-amber-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-500/20 backdrop-blur-md rounded-xl drop-shadow-lg">
              <UserMinus className="h-6 w-6 text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Dormant Cohort</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-amber-100 tabular-nums drop-shadow-md">
              {data.churn_risk_customers}
            </h3>
            <p className="text-xs text-amber-300/80 mt-2 font-medium">Не были \u003e 30 дней</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-card p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
             <div className="h-16 w-16 mb-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center glow-effect shadow-brand-500/20">
               <Heart className="h-8 w-8 text-slate-400" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Метрики Лояльности</h3>
             <p className="text-slate-400 text-sm max-w-sm">Мы собираем транзакции по списанию и начислению баллов, чтобы обогатить эти диаграммы по RFM и LTV в будущих обновлениях.</p>
        </div>
      </div>
    </div>
  )
}
