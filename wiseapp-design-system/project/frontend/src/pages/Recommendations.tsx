import { Lightbulb, Zap, TrendingUp, Package, Users, Info } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'

export default function Recommendations() {
  const { globalPeriod } = useFilterStore()
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.recommendations({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const recs = data?.recommendations || []
  const bp = data?.by_priority || { high: 0, medium: 0, low: 0 }

  const typeIcons: Record<string, any> = {
    product: <Package className="w-5 h-5" />,
    ops: <Zap className="w-5 h-5" />,
    staffing: <Users className="w-5 h-5" />,
  }
  const priorityColors: Record<string, string> = {
    high: 'bg-rose-50 text-rose-600 border-rose-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    low: 'bg-sky-50 text-sky-600 border-sky-100',
  }
  const priorityLabels: Record<string, string> = { high: 'Высокий', medium: 'Средний', low: 'Низкий' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Рекомендации</h1>
        <p className="text-gray-500 mt-1">Умные подсказки на основе данных ресторана</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Lightbulb className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Всего рекомендаций</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data?.total || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Zap className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Высокий приоритет</span>
          </div>
          <p className="text-3xl font-bold text-rose-600">{bp.high}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Средний приоритет</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{bp.medium}</p>
        </div>
      </div>

      <div className="space-y-3">
        {recs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-lg">Нет рекомендаций</p>
            <p className="text-gray-400 text-sm">Рекомендации появятся при накоплении данных</p>
          </div>
        ) : recs.map((rec: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                {typeIcons[rec.type] || <Lightbulb className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[rec.priority] || ''}`}>
                    {priorityLabels[rec.priority] || rec.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{rec.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">Источник: {rec.data_source}</span>
                  <span className="text-xs text-gray-400">Уверенность: {Math.round((rec.confidence || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
