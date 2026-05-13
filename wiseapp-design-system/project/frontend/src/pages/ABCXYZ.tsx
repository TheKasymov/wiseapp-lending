import { Grid3x3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { KPICardSkeleton, ChartSkeleton } from '../components/Skeleton'
import { ErrorFallback } from '../components/ErrorFallback'
import { useFilterStore } from '../store/filterStore'
import type { ABCProduct } from '../types/api'

interface MatrixCell {
  category: string
  product_count: number
  total_revenue: number
}

interface XYZProduct {
  xyz_category: string
  cv?: number
}

const MATRIX_COLORS: Record<string, string> = {
  AX: 'bg-green-500', AY: 'bg-green-400', AZ: 'bg-green-300',
  BX: 'bg-blue-500', BY: 'bg-blue-400', BZ: 'bg-blue-300',
  CX: 'bg-orange-500', CY: 'bg-orange-400', CZ: 'bg-orange-300',
}

const PIE_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316']

export default function ABCXYZ() {
  const { globalPeriod } = useFilterStore()
  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.abcxyz({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-48 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorFallback error={error} onRetry={reload} />
  }

  const matrix: MatrixCell[] = data.matrix || []
  const abcClassification: ABCProduct[] = data.abc_classification || []
  const xyzClassification: XYZProduct[] = data.xyz_classification || []

  const totalRevenue = abcClassification.reduce((sum, p) => sum + (p.total_revenue || 0), 0)

  const abcBreakdown = ['A', 'B', 'C'].map(cat => {
    const items = abcClassification.filter(p => p.abc_category === cat)
    const revenue = items.reduce((sum, p) => sum + (p.total_revenue || 0), 0)
    return {
      category: cat,
      products_count: items.length,
      revenue,
      revenue_share: totalRevenue > 0 ? Math.round(revenue / totalRevenue * 100) : 0,
    }
  })

  const xyzBreakdown = ['X', 'Y', 'Z'].map(cat => {
    const items = xyzClassification.filter(p => p.xyz_category === cat)
    const avgCv = items.length > 0
      ? items.reduce((sum, p) => sum + (p.cv || 0), 0) / items.length / 100
      : 0
    return { category: cat, products_count: items.length, avg_cv: avgCv }
  })

  const xyzColors: Record<string, string> = {
    X: 'text-green-400',
    Y: 'text-yellow-400',
    Z: 'text-red-400',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Grid3x3 className="h-8 w-8 text-pink-500" />
          ABC/XYZ Анализ
        </h1>
        <p className="text-slate-400 mt-1">Матрица ассортимента, тренды</p>
      </div>

      {/* ABC Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {abcBreakdown.map((group, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-800">Группа {group.category}</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-slate-500 rounded-full">
                {group.products_count} товаров
              </span>
            </div>
            <p className="text-2xl font-bold text-green-400">{group.revenue.toLocaleString('ru-RU')} ₸</p>
            <p className="text-sm text-slate-400 mt-1">{group.revenue_share}% выручки</p>
            <div className="w-full bg-gray-50 rounded-full h-2 mt-3">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${group.revenue_share}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* XYZ Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {xyzBreakdown.map((group, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Стабильность: {group.category}</h3>
            <p className="text-sm text-slate-400">{group.products_count} товаров</p>
            <p className={`text-xl font-bold mt-2 ${xyzColors[group.category] || 'text-slate-800'}`}>
              CV: {(group.avg_cv * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      {/* ABC/XYZ Matrix 3x3 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Матрица 3×3</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-3 text-slate-400 text-sm font-medium"></th>
                <th className="p-3 text-center text-slate-400 text-sm font-medium">X (стабильный)</th>
                <th className="p-3 text-center text-slate-400 text-sm font-medium">Y (колеблющийся)</th>
                <th className="p-3 text-center text-slate-400 text-sm font-medium">Z (хаотичный)</th>
              </tr>
            </thead>
            <tbody>
              {['A', 'B', 'C'].map((abc) => (
                <tr key={abc}>
                  <td className="p-3 text-slate-800 font-bold text-lg">{abc}</td>
                  {['X', 'Y', 'Z'].map((xyz) => {
                    const cell = matrix.find(m => m.category === `${abc}${xyz}`)
                    return (
                      <td key={xyz} className="p-2">
                        <div className={`p-4 rounded-lg ${MATRIX_COLORS[`${abc}${xyz}`] || 'bg-gray-100'} bg-opacity-20 border border-gray-200`}>
                          <p className="text-slate-800 font-semibold text-center">{cell?.product_count || 0}</p>
                          <p className="text-xs text-slate-500 text-center">товаров</p>
                          <p className="text-xs text-green-400 text-center mt-1">
                            {cell?.total_revenue?.toLocaleString('ru-RU') || 0} ₸
                          </p>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Распределение по категориям</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={matrix.filter(m => m.product_count > 0).map(m => ({ name: m.category, value: m.product_count }))}
                cx="50%" cy="50%" outerRadius={100} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {matrix.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Выручка по категориям</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matrix.filter(m => m.total_revenue > 0).map(m => ({ name: m.category, revenue: m.total_revenue }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      {abcClassification.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Топ товаров</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 text-slate-400 font-medium">Товар</th>
                  <th className="text-left p-3 text-slate-400 font-medium">ABC</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Заказов</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Выручка</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Доля %</th>
                </tr>
              </thead>
              <tbody>
                {abcClassification.slice(0, 15).map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-3 text-slate-800 text-sm font-medium">{product.product_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        product.abc_category === 'A' ? 'bg-green-100 text-green-700' :
                        product.abc_category === 'B' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {product.abc_category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-sm">{product.order_count}</td>
                    <td className="p-3 text-green-600 text-sm">{(product.total_revenue || 0).toLocaleString('ru-RU')} ₸</td>
                    <td className="p-3 text-slate-500 text-sm">{product.revenue_share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {Array.isArray(data.recommendations) && data.recommendations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Рекомендации</h3>
          <ul className="space-y-2">
            {(data.recommendations as string[]).map((rec, idx) => (
              <li key={idx} className="text-slate-500 text-sm flex items-start gap-2">
                <span className="text-pink-400 mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
