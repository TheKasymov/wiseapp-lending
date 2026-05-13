import { useState } from 'react'
import { Star, MessageSquare, Plus, Info, X, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { ImportWizard } from '../components/import/ImportWizard'
import { Download } from 'lucide-react'
import { useFilterStore } from '../store/filterStore'

export default function Reviews() {
  const { globalPeriod } = useFilterStore()
  const { data: statsData, loading: statsLoading } = useAnalyticsData(
    (rid) => analyticsApi.reviewStats({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )
  const { data: listData, loading: listLoading, refetch } = useAnalyticsData(
    (rid) => analyticsApi.reviewsList({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
    'reviews_list',
  )

  const [showForm, setShowForm] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [form, setForm] = useState({ author_name: '', rating: 5, text: '', source: 'manual' })

  const handleCreate = async () => {
    try {
      const rid = localStorage.getItem('restaurant_id') || ''
      await analyticsApi.createReview({ restaurant_id: rid, ...form })
      setShowForm(false)
      setForm({ author_name: '', rating: 5, text: '', source: 'manual' })
      refetch()
    } catch (e) { console.error(e) }
  }

  const loading = statsLoading || listLoading

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const stats = statsData || {}
  const reviews = listData?.reviews || []
  const sentiment = stats.sentiment || { positive: 0, neutral: 0, negative: 0 }
  const trend = stats.trend || []

  const starArr = [1, 2, 3, 4, 5]
  const sentimentColors: Record<string, string> = {
    positive: 'text-emerald-600 bg-emerald-50',
    neutral: 'text-gray-600 bg-gray-100',
    negative: 'text-rose-600 bg-rose-50',
  }
  const sentimentLabels: Record<string, string> = { positive: 'Позитивный', neutral: 'Нейтральный', negative: 'Негативный' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Отзывы</h1>
          <p className="text-gray-500 mt-1">Агрегатор отзывов из всех источников</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setImportOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Импорт из Excel
          </button>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Добавить отзыв
          </button>
        </div>
      </div>

      <ImportWizard 
        domain="reviews"
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => refetch()}
        title="Импорт отзывов из Excel"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Средняя оценка</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avg_rating || '—'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Позитивные</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{sentiment.positive}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl"><MessageSquare className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Нейтральные</span>
          </div>
          <p className="text-3xl font-bold text-gray-600">{sentiment.neutral}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Негативные</span>
          </div>
          <p className="text-3xl font-bold text-rose-600">{sentiment.negative}</p>
        </div>
      </div>

      {/* Trend chart */}
      {trend.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Тренд оценок по неделям</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="avg_rating" name="Ср. оценка" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reviews list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Последние отзывы ({stats.total_reviews || 0})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3" />
              <p>Отзывов пока нет</p>
            </div>
          ) : reviews.map((r: any) => (
            <div key={r.id} className="px-6 py-4 hover:bg-gray-50/80 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{r.author_name}</span>
                    <div className="flex gap-0.5">
                      {starArr.map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    {r.sentiment && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentimentColors[r.sentiment] || ''}`}>
                        {sentimentLabels[r.sentiment] || r.sentiment}
                      </span>
                    )}
                  </div>
                  {r.text && <p className="text-sm text-gray-600">{r.text}</p>}
                  <p className="text-xs text-gray-400 mt-1">{r.source} · {r.review_date?.slice(0, 10)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Добавить отзыв</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Автор</label>
                <input value={form.author_name} onChange={e => setForm({...form, author_name: e.target.value})}
                  placeholder="Имя клиента" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Оценка</label>
                <div className="flex gap-1">
                  {starArr.map(s => (
                    <button key={s} onClick={() => setForm({...form, rating: s})}>
                      <Star className={`w-8 h-8 ${s <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Источник</label>
                <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm">
                  <option value="manual">Ручной ввод</option>
                  <option value="google_maps">Google Maps</option>
                  <option value="2gis">2GIS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Текст отзыва</label>
                <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={3}
                  placeholder="Текст отзыва..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              </div>
              <button onClick={handleCreate}
                className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition">Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
