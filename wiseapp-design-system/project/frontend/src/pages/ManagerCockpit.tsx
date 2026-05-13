import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'
import type { ManagerCockpit } from '../types/api'

const HEALTH_TONES: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  attention: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  no_data: 'bg-gray-50 text-gray-500 border-gray-200',
}

const HEALTH_LABELS: Record<string, string> = {
  ok: 'Всё в порядке',
  attention: 'Внимание',
  critical: 'Критично',
  no_data: 'Нет данных',
}

export default function ManagerCockpitPage() {
  const selectedRestaurantIds = useFilterStore((s) => s.selectedRestaurantIds)
  const globalPeriod = useFilterStore((s) => s.globalPeriod.preset)

  const restaurantId = useMemo(() => {
    const ids = (selectedRestaurantIds || []).filter((id) => id && id !== 'all')
    return ids[0]
  }, [selectedRestaurantIds])

  const [data, setData] = useState<ManagerCockpit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const period = globalPeriod || 'today'

  const load = useCallback(async () => {
    if (!restaurantId) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await analyticsApi.managerCockpit({ restaurant_id: restaurantId, period })
      setData(resp.data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [restaurantId, period])

  useEffect(() => {
    void load()
  }, [load])

  const transition = async (id: string, to: 'accept' | 'dismiss' | 'done') => {
    setBusyId(id)
    try {
      await analyticsApi.actionTransition(id, to)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (!restaurantId) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-400">Выберите ресторан в фильтре сверху</p>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error) {
    return <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-4">{error}</div>
  }

  if (!data) return null

  const trend = data.summary.trend_vs_previous
  const sourceMixEntries = Object.entries(data.source_mix || {})
  const totalOrders = sourceMixEntries.reduce((sum, [, n]) => sum + n, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            Cockpit менеджера
          </h1>
          <p className="text-gray-500 mt-1">Что произошло, что не так и что сделать сегодня — за период «{period}»</p>
        </div>
        <button onClick={() => void load()} className="text-sm text-indigo-600 hover:underline">
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Выручка" value={formatCurrency(data.summary.revenue)} />
        <KpiCard label="Заказы" value={data.summary.orders.toString()} />
        <KpiCard label="Средний чек" value={formatCurrency(data.summary.avg_check)} />
        <KpiCard
          label="Тренд vs прошлый период"
          value={trend == null ? '—' : `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
          tone={trend == null ? 'gray' : trend >= 0 ? 'emerald' : 'rose'}
          icon={
            trend == null ? null : trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
          }
        />
      </div>

      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${HEALTH_TONES[data.business_health.status] || HEALTH_TONES.no_data}`}>
        {data.business_health.status === 'ok' ? (
          <CheckCircle2 className="w-6 h-6 mt-0.5" />
        ) : (
          <AlertTriangle className="w-6 h-6 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="font-semibold">
            Состояние данных: {HEALTH_LABELS[data.business_health.status] || data.business_health.status}
          </div>
          <div className="text-sm mt-1">{data.business_health.message}</div>
          {data.business_health.impacted_domains.length > 0 && (
            <div className="text-xs mt-2 opacity-80">
              Затронуты: {data.business_health.impacted_domains.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Ключевые риски</h2>
            <span className="text-xs text-gray-500">
              открытых: {data.actions_summary.open}, критичных: {data.actions_summary.critical}
            </span>
          </div>
          {data.top_risks.length === 0 ? (
            <p className="text-gray-400 text-sm">Критичных рисков нет</p>
          ) : (
            <ul className="space-y-2">
              {data.top_risks.map((risk) => (
                <li key={risk.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full">
                      {risk.priority}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-full">
                      {risk.domain}
                    </span>
                    <span className="font-medium text-gray-900">{risk.title}</span>
                  </div>
                  {risk.reason && <p className="text-sm text-gray-600 mt-1">{risk.reason}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            Источники заказов
          </h2>
          {sourceMixEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">Нет заказов за период</p>
          ) : (
            <ul className="space-y-2">
              {sourceMixEntries.map(([src, n]) => {
                const pct = totalOrders > 0 ? (n / totalOrders) * 100 : 0
                return (
                  <li key={src}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{src}</span>
                      <span className="text-gray-500">
                        {n} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Открытые действия</h2>
        {data.actions.length === 0 ? (
          <p className="text-gray-400 text-sm">Нет открытых действий</p>
        ) : (
          <ul className="space-y-2">
            {data.actions.map((a) => (
              <li key={a.id} className="border border-gray-100 rounded-xl p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-full">
                      {a.domain}/{a.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full">
                      {a.priority}
                    </span>
                    <span className="font-medium text-gray-900">{a.title}</span>
                  </div>
                  {a.reason && <p className="text-sm text-gray-600 mt-1">{a.reason}</p>}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    disabled={busyId === a.id}
                    onClick={() => void transition(a.id, 'accept')}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Принять
                  </button>
                  <button
                    disabled={busyId === a.id}
                    onClick={() => void transition(a.id, 'done')}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                  >
                    Выполнено
                  </button>
                  <button
                    disabled={busyId === a.id}
                    onClick={() => void transition(a.id, 'dismiss')}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">
        Обновлено: {new Date(data.generated_at).toLocaleString()}
      </p>
    </div>
  )
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₸'
}

function KpiCard({
  label,
  value,
  tone = 'indigo',
  icon,
}: {
  label: string
  value: string
  tone?: 'indigo' | 'emerald' | 'rose' | 'gray'
  icon?: ReactNode | null
}) {
  const tones: Record<string, string> = {
    indigo: 'border-gray-100',
    emerald: 'border-emerald-100',
    rose: 'border-rose-100',
    gray: 'border-gray-100',
  }
  return (
    <div className={`bg-white p-5 rounded-2xl border shadow-sm ${tones[tone]}`}>
      <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 text-gray-900">{value}</div>
    </div>
  )
}
