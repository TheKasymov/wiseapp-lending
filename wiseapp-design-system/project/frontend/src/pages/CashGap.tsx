import { Wallet, TrendingDown, AlertCircle, PiggyBank } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Аренда', salary: 'Зарплата', suppliers: 'Поставщики',
  utilities: 'Коммунальные', tax: 'Налоги', other: 'Прочее',
}
const CATEGORY_COLORS: Record<string, string> = {
  rent: '#ef4444', salary: '#f59e0b', suppliers: '#6366f1',
  utilities: '#06b6d4', tax: '#8b5cf6', other: '#94a3b8',
}

export default function CashGap() {
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.cashGap({ restaurant_id: rid, forecast_days: 30 }),
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const forecast = data?.forecast || []
  const expensesByCategory = data?.expense_by_category || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Кассовые Разрывы</h1>
        <p className="text-gray-500 mt-1">Прогноз остатка средств на 30 дней</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Текущий баланс</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(data?.current_balance || 0).toLocaleString()} ₸</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><PiggyBank className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Ср. дневная выручка</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(data?.avg_daily_revenue || 0).toLocaleString()} ₸</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Плановые расходы</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{Math.round(data?.total_planned_expenses || 0).toLocaleString()} ₸</p>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm ${data?.has_gaps ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${data?.has_gaps ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-600">Риск разрыва</span>
          </div>
          <p className={`text-2xl font-bold ${data?.has_gaps ? 'text-rose-600' : 'text-emerald-600'}`}>
            {data?.has_gaps ? `${data?.gap_dates?.length} дн.` : 'Нет'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Прогноз остатка средств</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v: number) => [`${Math.round(v).toLocaleString()} ₸`, 'Баланс']} />
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" label="Кассовый разрыв" />
            <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="url(#balanceGrad)" strokeWidth={2} />
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Расходы по категориям</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={expensesByCategory} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => CATEGORY_LABELS[v] || v} />
            <Tooltip formatter={(v: number) => [`${Math.round(v).toLocaleString()} ₸`, 'Сумма']} />
            <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
              {expensesByCategory.map((entry: any, idx: number) => (
                <Cell key={idx} fill={CATEGORY_COLORS[entry.category] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
