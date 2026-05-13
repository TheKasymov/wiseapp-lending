import { useState } from 'react'
import { UserCheck, TrendingDown, CreditCard, Heart, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { Skeleton, KPICardSkeleton, TableSkeleton } from '../components/Skeleton'
import { ErrorFallback } from '../components/ErrorFallback'

const COLORS = ['#0ea5e9', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#84cc16']

export default function CohortAnalysis() {
  const [tab, setTab] = useState<'retention' | 'rfm' | 'churn' | 'ltv'>('retention')

  const retentionData = useAnalyticsData(
    (rid) => analyticsApi.cohortRetention({ restaurant_id: rid, cohort_period: 'month', max_periods: 6 }),
    [tab],
  )
  const rfmData = useAnalyticsData(
    (rid) => analyticsApi.rfm({ restaurant_id: rid }),
    [tab],
  )
  const churnData = useAnalyticsData(
    (rid) => analyticsApi.churnRisk({ restaurant_id: rid, threshold_days: 30, limit: 20 }),
    [tab],
  )
  const ltvData = useAnalyticsData(
    (rid) => analyticsApi.ltv({ restaurant_id: rid }),
    [tab],
  )

  const activeData = {
    retention: retentionData,
    rfm: rfmData,
    churn: churnData,
    ltv: ltvData,
  }[tab]

  const { loading, error, data, reload } = activeData

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-48 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} width="150" height="40" />)}
        </div>
        <TableSkeleton rows={8} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <ErrorFallback error={error} onRetry={reload} />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-indigo-500" />
          Когортный Анализ
        </h1>
        <p className="text-slate-400 mt-1">Retention, RFM, Churn Risk, LTV</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'retention' as const, label: 'Retention', icon: Users },
          { id: 'rfm' as const, label: 'RFM Сегментация', icon: CreditCard },
          { id: 'churn' as const, label: 'Churn Risk', icon: TrendingDown },
          { id: 'ltv' as const, label: 'LTV', icon: Heart },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-brand-600 text-white'
                : 'bg-gray-50 text-slate-500 hover:bg-gray-100 hover:text-slate-800'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Retention */}
      {tab === 'retention' && data.cohorts && data.cohorts.length > 0 && (
        <>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Retention Rate по когортам</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-slate-400 font-medium">Когорта</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Размер</th>
                    {data.cohorts[0]?.retention_rates.slice(0, 6).map((_: any, i: number) => (
                      <th key={i} className="text-center p-3 text-slate-400 font-medium text-xs">Мес. {i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.cohorts.slice(0, 8).map((cohort: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-3 text-slate-800 font-medium text-sm">{cohort.cohort_label}</td>
                      <td className="p-3 text-slate-500 text-sm">{cohort.cohort_size}</td>
                      {cohort.retention_rates.slice(0, 6).map((ret: any, i: number) => (
                        <td key={i} className="p-2">
                          <div
                            className={`rounded px-2 py-1 text-center text-xs font-semibold ${
                              ret.rate > 60 ? 'bg-green-600/30 text-green-400'
                                : ret.rate > 30 ? 'bg-yellow-600/30 text-yellow-400'
                                : ret.rate > 0 ? 'bg-red-600/30 text-red-400'
                                : 'bg-gray-50 text-dark-600'
                            }`}
                          >
                            {ret.rate > 0 ? `${ret.rate}%` : '—'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {data.insights?.length > 0 && <Insights insights={data.insights} />}
        </>
      )}

      {/* RFM */}
      {tab === 'rfm' && data.segments && data.segments.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Сегменты клиентов</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.segments.slice(0, 9)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="segment" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">RFM Матрица</h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {data.segments.map((seg: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-800">{seg.segment}</span>
                      <span className="text-xs px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded-full">{seg.percentage}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>{seg.count} клиентов</span>
                      <span className="text-green-400">{seg.total_revenue.toLocaleString('ru-RU')} ₸</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {data.total_customers && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <p className="text-sm text-slate-400">Всего клиентов</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{data.total_customers.toLocaleString('ru-RU')}</p>
            </div>
          )}
          {data.insights?.length > 0 && <Insights insights={data.insights} />}
        </>
      )}

      {/* Churn Risk */}
      {tab === 'churn' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <p className="text-sm text-slate-400">Всего клиентов</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{data.total_customers?.toLocaleString('ru-RU') || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-red-600/30">
              <p className="text-sm text-red-400">Под риском оттока</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{data.at_risk_count?.toLocaleString('ru-RU') || 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                {data.total_customers > 0 ? ((data.at_risk_count / data.total_customers) * 100).toFixed(1) : 0}% от базы
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <p className="text-sm text-slate-400">Порог неактивности</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{data.threshold_days || 30} дней</p>
            </div>
          </div>

          {data.at_risk_customers && data.at_risk_customers.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Клиенты под риском</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-3 text-slate-400 font-medium">Клиент</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Последний заказ</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Заказов</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Потрачено</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Дней неакт.</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.at_risk_customers.map((cust: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="p-3 text-slate-800 text-sm">{cust.name || cust.phone || `#${cust.customer_id}`}</td>
                        <td className="p-3 text-slate-500 text-sm">{cust.last_order_at || '—'}</td>
                        <td className="p-3 text-slate-500 text-sm">{cust.total_orders}</td>
                        <td className="p-3 text-green-400 text-sm">{cust.total_spent?.toLocaleString('ru-RU') || 0} ₸</td>
                        <td className="p-3 text-orange-400 text-sm">{cust.days_inactive}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            cust.risk_score > 0.7 ? 'bg-red-600/30 text-red-400'
                              : cust.risk_score > 0.4 ? 'bg-orange-600/30 text-orange-400'
                              : 'bg-yellow-600/30 text-yellow-400'
                          }`}>
                            {(cust.risk_score * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {data.insights?.length > 0 && <Insights insights={data.insights} />}
        </>
      )}

      {/* LTV */}
      {tab === 'ltv' && (
        <>
          {!data.metrics ? (
            <div className="bg-white rounded-xl p-12 border border-gray-100 flex flex-col items-center justify-center gap-3">
              <Heart className="h-12 w-12 text-gray-200" />
              <p className="text-slate-400 font-medium">Недостаточно данных для расчёта LTV</p>
              <p className="text-slate-300 text-sm">Нужны повторные заказы от клиентов за несколько периодов</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Средний LTV</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">{data.metrics.avg_ltv?.toLocaleString('ru-RU') || 0} ₸</p>
                  <p className="text-xs text-slate-400 mt-2">Суммарная выручка на клиента за всё время</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Время жизни клиента</p>
                  <p className="text-3xl font-bold text-brand-500 mt-1">{data.metrics.avg_customer_lifetime_days || 0} <span className="text-lg font-normal text-slate-400">дн.</span></p>
                  <p className="text-xs text-slate-400 mt-2">От первого до последнего заказа</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Частота покупок</p>
                  <p className="text-3xl font-bold text-purple-500 mt-1">{data.metrics.avg_purchase_frequency || 0}</p>
                  <p className="text-xs text-slate-400 mt-2">Среднее количество заказов на клиента</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Средний чек</p>
                  <p className="text-3xl font-bold text-orange-500 mt-1">{data.metrics.avg_order_value?.toLocaleString('ru-RU') || 0} ₸</p>
                  <p className="text-xs text-slate-400 mt-2">Средняя сумма одного заказа</p>
                </div>
              </div>

              {data.ltv_by_cohort && data.ltv_by_cohort.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">LTV по когортам</h3>
                  <p className="text-sm text-slate-400 mb-4">Каждый столбец — группа клиентов, привлечённых в данном месяце</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.ltv_by_cohort.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="cohort" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ₸`, 'LTV']}
                      />
                      <Bar dataKey="ltv" fill="#10b981" radius={[4, 4, 0, 0]} name="LTV" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {data.insights?.length > 0 && <Insights insights={data.insights} />}
            </>
          )}
        </>
      )}
    </div>
  )
}

function Insights({ insights }: { insights: string[] }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Инсайты</h3>
      <ul className="space-y-2">
        {insights.map((insight: string, idx: number) => (
          <li key={idx} className="text-slate-500 text-sm flex items-start gap-2">
            <span className="text-indigo-400 mt-1">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  )
}
