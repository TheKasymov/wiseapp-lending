import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Bell, Check, X, AlertTriangle, Lightbulb, ListChecks, Loader2 } from 'lucide-react'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'
import type { ActionItem } from '../types/api'

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  high: 'bg-rose-50 text-rose-600 border-rose-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low: 'bg-sky-50 text-sky-700 border-sky-100',
}

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  seen: 'bg-blue-50 text-blue-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  assigned: 'bg-indigo-50 text-indigo-700',
  done: 'bg-emerald-100 text-emerald-800',
  dismissed: 'bg-gray-100 text-gray-500 line-through',
  expired: 'bg-gray-100 text-gray-400',
  measured: 'bg-emerald-50 text-emerald-700',
}

const TYPE_ICON: Record<string, ReactNode> = {
  recommendation: <Lightbulb className="w-4 h-4" />,
  alert: <AlertTriangle className="w-4 h-4" />,
  task: <ListChecks className="w-4 h-4" />,
}

const DOMAINS = ['', 'sales', 'inventory', 'finance', 'staff', 'customers', 'data_quality', 'reviews', 'marketing', 'operations']
const TYPES = ['', 'recommendation', 'alert', 'task']
const STATUS_GROUPS: Record<string, string> = {
  open: 'created,seen,accepted,assigned',
  done: 'done,measured',
  dismissed: 'dismissed,expired',
}

export default function ActionCenter() {
  const selectedRestaurantIds = useFilterStore((s) => s.selectedRestaurantIds)
  const restaurantId = useMemo(() => {
    const ids = (selectedRestaurantIds || []).filter((id) => id && id !== 'all')
    return ids[0] || undefined
  }, [selectedRestaurantIds])

  const [items, setItems] = useState<ActionItem[]>([])
  const [summary, setSummary] = useState({ critical: 0, high: 0, open: 0, done_today: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [domain, setDomain] = useState('')
  const [type, setType] = useState('')
  const [statusGroup, setStatusGroup] = useState<keyof typeof STATUS_GROUPS>('open')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await analyticsApi.listActions({
        restaurant_id: restaurantId,
        domain: domain || undefined,
        type: type || undefined,
        status: STATUS_GROUPS[statusGroup],
        limit: 100,
      })
      setItems(resp.data.items || [])
      setSummary(resp.data.summary || { critical: 0, high: 0, open: 0, done_today: 0 })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [restaurantId, domain, type, statusGroup])

  useEffect(() => {
    void load()
  }, [load])

  const transition = async (id: string, to: 'seen' | 'accept' | 'dismiss' | 'done') => {
    setBusyId(id)
    try {
      await analyticsApi.actionTransition(id, to)
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-7 h-7 text-indigo-600" />
          Action Center
        </h1>
        <p className="text-gray-500 mt-1">Рекомендации, алерты и задачи с единым lifecycle</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Открытых" value={summary.open} tone="indigo" />
        <SummaryCard label="Критичных" value={summary.critical} tone="rose" />
        <SummaryCard label="Высокий приоритет" value={summary.high} tone="amber" />
        <SummaryCard label="Закрыто сегодня" value={summary.done_today} tone="emerald" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <select
          value={statusGroup}
          onChange={(e) => setStatusGroup(e.target.value as keyof typeof STATUS_GROUPS)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="open">Открытые</option>
          <option value="done">Выполненные</option>
          <option value="dismissed">Отклонённые / истёкшие</option>
        </select>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d || 'Все домены'}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t || 'Все типы'}</option>
          ))}
        </select>
        <button
          onClick={() => void load()}
          className="ml-auto text-sm text-indigo-600 hover:underline"
        >
          Обновить
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-4">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-lg">Нет действий</p>
          <p className="text-gray-400 text-sm">Рекомендации и алерты появятся при накоплении данных</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3"
            >
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0">
                {TYPE_ICON[item.type] || <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[item.priority] || ''}`}>
                    {item.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-gray-100'}`}>
                    {item.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-500 border border-gray-100">
                    {item.domain}
                  </span>
                </div>
                {item.reason && <p className="text-sm text-gray-600 mt-1">{item.reason}</p>}
                {item.next_action && (
                  <p className="text-xs text-indigo-600 mt-1">→ {item.next_action}</p>
                )}
                <div className="text-xs text-gray-400 mt-2 flex gap-3">
                  {item.confidence != null && <span>conf: {Math.round(item.confidence * 100)}%</span>}
                  {item.created_at && <span>{new Date(item.created_at).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {item.status === 'created' && (
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void transition(item.id, 'seen')}
                    className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    Просмотрено
                  </button>
                )}
                {!['done', 'dismissed', 'expired', 'measured'].includes(item.status) && (
                  <>
                    <button
                      disabled={busyId === item.id}
                      onClick={() => void transition(item.id, 'accept')}
                      className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Принять
                    </button>
                    <button
                      disabled={busyId === item.id}
                      onClick={() => void transition(item.id, 'done')}
                      className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                    >
                      Выполнено
                    </button>
                    <button
                      disabled={busyId === item.id}
                      onClick={() => void transition(item.id, 'dismiss')}
                      className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Отклонить
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'indigo' | 'rose' | 'amber' | 'emerald' }) {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }
  return (
    <div className={`p-4 rounded-2xl border shadow-sm ${tones[tone]}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  )
}
