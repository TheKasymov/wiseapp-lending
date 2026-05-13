import { DollarSign, TrendingUp, TrendingDown, ArrowDown, ArrowUp, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'

export default function PnLReport() {
  const { globalPeriod } = useFilterStore()
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.pnl({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const fmt = (n: number) => Math.round(n).toLocaleString()
  const revenue = data?.revenue || 0
  const cogs = data?.cogs || 0
  const grossProfit = data?.gross_profit || 0
  const opex = data?.opex || {}
  const ebitda = data?.ebitda || 0
  const taxes = data?.taxes || 0
  const netProfit = data?.net_profit || 0
  const netMargin = data?.net_margin_pct || 0
  const daily = data?.daily_breakdown || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">P&L Отчёт</h1>
        <p className="text-gray-500 mt-1">Прибыли и убытки за {data?.period_days || 30} дней</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Выручка</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(revenue)} ₸</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><ArrowDown className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Себестоимость</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(cogs)} ₸</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">EBITDA</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(ebitda)} ₸</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {netProfit >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            </div>
            <span className="text-sm font-medium text-gray-500">Чистая прибыль</span>
          </div>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(netProfit)} ₸</p>
          <p className="text-sm text-gray-400 mt-1">Маржа: {netMargin}%</p>
        </div>
      </div>

      {/* P&L Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Структура P&L</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-emerald-50/30"><td className="px-6 py-3 font-semibold text-gray-900">Выручка (Revenue)</td><td className="px-6 py-3 text-right font-bold text-emerald-600">{fmt(revenue)} ₸</td></tr>
            <tr><td className="px-6 py-3 text-gray-600 pl-10">− Себестоимость (COGS)</td><td className="px-6 py-3 text-right text-gray-600">{fmt(cogs)} ₸</td></tr>
            <tr className="bg-blue-50/30"><td className="px-6 py-3 font-semibold text-gray-900">= Валовая прибыль</td><td className="px-6 py-3 text-right font-bold">{fmt(grossProfit)} ₸ ({data?.gross_margin_pct || 0}%)</td></tr>
            <tr><td className="px-6 py-3 text-gray-600 pl-10">− Аренда</td><td className="px-6 py-3 text-right text-gray-600">{fmt(opex.rent || 0)} ₸</td></tr>
            <tr><td className="px-6 py-3 text-gray-600 pl-10">− Зарплата</td><td className="px-6 py-3 text-right text-gray-600">{fmt(opex.salary || 0)} ₸</td></tr>
            <tr><td className="px-6 py-3 text-gray-600 pl-10">− Коммунальные</td><td className="px-6 py-3 text-right text-gray-600">{fmt(opex.utilities || 0)} ₸</td></tr>
            <tr><td className="px-6 py-3 text-gray-600 pl-10">− Маркетинг</td><td className="px-6 py-3 text-right text-gray-600">{fmt(opex.marketing || 0)} ₸</td></tr>
            <tr><td className="px-6 py-3 text-gray-600 pl-10">− Прочее</td><td className="px-6 py-3 text-right text-gray-600">{fmt((opex.supplies || 0) + (opex.other || 0))} ₸</td></tr>
            <tr className="bg-indigo-50/30"><td className="px-6 py-3 font-semibold text-gray-900">= EBITDA</td><td className="px-6 py-3 text-right font-bold text-indigo-600">{fmt(ebitda)} ₸</td></tr>
            <tr><td className="px-6 py-3 text-gray-600 pl-10">− Налоги ({((data?.tax_rate || 0.12) * 100).toFixed(0)}%)</td><td className="px-6 py-3 text-right text-gray-600">{fmt(taxes)} ₸</td></tr>
            <tr className={`${netProfit >= 0 ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
              <td className="px-6 py-4 font-bold text-gray-900 text-base">= Чистая прибыль</td>
              <td className={`px-6 py-4 text-right font-bold text-base ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(netProfit)} ₸</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Daily chart */}
      {daily.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ежедневная прибыль</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`${Math.round(v).toLocaleString()} ₸`]} />
              <Legend />
              <Bar dataKey="revenue" name="Выручка" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="cogs" name="COGS" fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="profit" name="Прибыль" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
