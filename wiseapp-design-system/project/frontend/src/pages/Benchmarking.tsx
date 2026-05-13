import { useEffect, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { analyticsApi } from '../services/analyticsApi'
import { useRestaurantStore } from '../store/restaurantStore'
import { useFilterStore } from '../store/filterStore'
import { ChartSkeleton } from '../components/Skeleton'
import { ErrorFallback } from '../components/ErrorFallback'

const BRANCH_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

interface BranchKPI {
  id: string
  name: string
  total_revenue: number
  total_orders: number
  avg_check: number
  revenue_per_day: number
}

const METRICS: { key: keyof BranchKPI; label: string }[] = [
  { key: 'total_revenue', label: 'Выручка' },
  { key: 'total_orders', label: 'Заказы' },
  { key: 'avg_check', label: 'Средний чек' },
  { key: 'revenue_per_day', label: 'Выручка/день' },
]

export default function Benchmarking() {
  const { restaurants, loading: restaurantsLoading } = useRestaurantStore()
  const { globalPeriod } = useFilterStore()
  const [branchData, setBranchData] = useState<BranchKPI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (restaurantsLoading || !restaurants.length) return
    setLoading(true)
    setError(null)

    Promise.all(
      restaurants.map((r) =>
        analyticsApi
          .financial({ restaurant_id: r.id, period: globalPeriod.preset })
          .then((res) => ({
            id: r.id,
            name: r.name,
            total_revenue: res.data.kpis?.total_revenue ?? 0,
            total_orders: res.data.kpis?.total_orders ?? 0,
            avg_check: res.data.kpis?.avg_check ?? 0,
            revenue_per_day: res.data.kpis?.revenue_per_day ?? 0,
          }))
          .catch(() => null),
      ),
    ).then((results) => {
      const valid = results.filter(Boolean) as BranchKPI[]
      setBranchData(valid)
      setLoading(false)
      if (!valid.length) setError('Нет данных по филиалам')
    })
  }, [restaurants, globalPeriod.preset])

  if (restaurantsLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-56 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-gray-50 rounded animate-pulse" />
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  if (error || !branchData.length) {
    return <ErrorFallback error={error} onRetry={() => { setBranchData([]); setLoading(true) }} />
  }

  if (branchData.length === 1) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Header />
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <BarChart2 className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Бенчмаркинг доступен при наличии нескольких филиалов</p>
          <p className="text-slate-400 text-sm mt-1">Подключите дополнительные рестораны в разделе «Рестораны»</p>
        </div>
        <SingleBranchTable branch={branchData[0]} />
      </div>
    )
  }

  // Build normalized radar data (each metric normalized to 0–100 relative to max branch)
  const maxValues = METRICS.reduce<Record<string, number>>((acc, { key }) => {
    acc[key] = Math.max(...branchData.map((b) => b[key] as number), 1)
    return acc
  }, {})

  const radarChartData = METRICS.map(({ key, label }) => {
    const point: Record<string, number | string> = { metric: label }
    branchData.forEach((b) => {
      point[b.id] = Math.round(((b[key] as number) / maxValues[key]) * 100)
    })
    return point
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <Header />

      {/* Radar comparison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Сравнительный анализ филиалов</h2>
        <p className="text-sm text-slate-400 mb-6">Значения нормализованы — лучший показатель = 100%</p>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarChartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#475569' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v: number, name: string) => [`${v}%`, branchData.find(b => b.id === name)?.name || name]} />
            {branchData.map((branch, idx) => (
              <Radar
                key={branch.id}
                name={branch.id}
                dataKey={branch.id}
                stroke={BRANCH_COLORS[idx % BRANCH_COLORS.length]}
                fill={BRANCH_COLORS[idx % BRANCH_COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend
              formatter={(value) => branchData.find(b => b.id === value)?.name || value}
              iconType="circle"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* KPI comparison table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Детальное сравнение KPI</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Метрика</th>
                {branchData.map((b, i) => (
                  <th key={b.id} className="px-6 py-4 text-right" style={{ color: BRANCH_COLORS[i % BRANCH_COLORS.length] }}>
                    {b.name}
                  </th>
                ))}
                <th className="px-6 py-4 text-center">Лидер</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {METRICS.map(({ key, label }) => {
                const maxVal = Math.max(...branchData.map((b) => b[key] as number))
                const leader = branchData.find((b) => (b[key] as number) === maxVal)
                return (
                  <tr key={key} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
                    {branchData.map((b, i) => (
                      <td
                        key={b.id}
                        className={`px-6 py-4 text-right font-medium ${(b[key] as number) === maxVal ? 'text-emerald-600' : 'text-gray-600'}`}
                      >
                        {key === 'total_orders'
                          ? (b[key] as number).toLocaleString('ru-RU')
                          : `${(b[key] as number).toLocaleString('ru-RU')} ₸`}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {leader?.name}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <BarChart2 className="h-8 w-8 text-indigo-500" />
        Бенчмаркинг филиалов
      </h1>
      <p className="text-gray-500 mt-1">Сравнение KPI между вашими ресторанами</p>
    </div>
  )
}

function SingleBranchTable({ branch }: { branch: BranchKPI }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{branch.name} — текущие показатели</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map(({ key, label }) => (
          <div key={key} className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {key === 'total_orders'
                ? (branch[key] as number).toLocaleString('ru-RU')
                : `${(branch[key] as number).toLocaleString('ru-RU')} ₸`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
