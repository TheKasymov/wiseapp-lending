import { useState, useEffect } from 'react'
import { Store, RefreshCw, Plus, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { iikoApi } from '../services/iikoApi'
import { EmptyState } from '../components/ui'
import { getErrorMessage } from '../utils/errors'
import { formatTimeAgo, getSyncIndicator } from '../utils/time'
import type { Restaurant } from '../types/api'

const scopeLabel = (scope?: string) => {
  switch (scope) {
    case 'prices':
      return 'Цены'
    case 'orders':
      return 'Заказы'
    case 'access_token':
      return 'Токен доступа'
    case 'organizations':
      return 'Организации'
    default:
      return scope || 'Проверка'
  }
}

const statusHint = (status?: string, fallback?: string) => {
  if (status === 'permission_denied') return 'Нет прав API'
  if (status === 'unsupported_by_docs') return 'Недоступно в Public API docs'
  if (status === 'error') return 'Ошибка синхронизации'
  return fallback || 'Не синхронизировано'
}

const fallbackReasonHint = (reason?: string) => {
  switch (reason) {
    case 'source_empty':
      return 'delivery-источник вернул пустой набор заказов'
    case 'invalid_ratio':
      return 'слишком высокая доля невалидных заказов в delivery'
    case 'permission_or_unsupported':
      return 'delivery-канал недоступен по правам/версии API'
    case 'cooldown':
      return 'table fallback в режиме cooldown'
    default:
      return null
  }
}

const noDataReasonHint = (reason?: string) => {
  switch (reason) {
    case 'source_empty':
      return 'источник не вернул заказы'
    case 'only_deleted':
      return 'в источнике только удаленные заказы'
    case 'only_zero_sum':
      return 'в источнике только нулевые суммы'
    case 'permission_blocked':
      return 'источник заблокирован по правам API'
    default:
      return null
  }
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncingEmployees, setSyncingEmployees] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    setLoading(true)
    try {
      const response = await iikoApi.listRestaurants()
      setRestaurants(response.data || [])
      setError('')
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки ресторанов'))
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    try {
      await iikoApi.triggerSync(id)
      setTimeout(() => loadRestaurants(), 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка синхронизации'))
      console.error('Sync error:', err)
    } finally {
      setSyncing(null)
    }
  }

  const handleEmployeesSync = async (id: string) => {
    setSyncingEmployees(id)
    try {
      await iikoApi.triggerEmployeeSync(id)
      setTimeout(() => loadRestaurants(), 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка синхронизации сотрудников'))
      console.error('Employee sync error:', err)
    } finally {
      setSyncingEmployees(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-48 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-50 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="h-6 w-48 bg-gray-50 rounded animate-pulse mb-3" />
            <div className="h-4 w-64 bg-gray-50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="Нет подключённых ресторанов"
        description="Подключите ваш iiko аккаунт для начала работы"
        actionLabel="Подключить iiko"
        onAction={() => {}}
      >
        <Link
          to="/settings/iiko"
          className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all font-semibold shadow-sm shadow-brand-500/20"
        >
          <Plus className="h-4 w-4" />
          Подключить iiko
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Store className="h-8 w-8 text-amber-500" />
            Рестораны
          </h1>
          <p className="text-slate-400 mt-1">Управление ресторанами и синхронизация</p>
        </div>
        <Link
          to="/settings/iiko"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all font-semibold text-sm shadow-sm shadow-brand-500/20"
        >
          <Plus className="h-4 w-4" />
          Подключить iiko
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {restaurants.map((restaurant) => {
          const menuSync = getSyncIndicator(restaurant.sync_status?.last_menu_sync)
          const priceSync = getSyncIndicator(restaurant.sync_status?.last_price_sync)
          const isSyncing = syncing === restaurant.id
          const isSyncingEmployees = syncingEmployees === restaurant.id
          const successfulScopes = [
            { label: 'Меню', syncedAt: restaurant.sync_status?.last_menu_sync },
            {
              label: 'Цены',
              syncedAt:
                restaurant.sync_status?.price_status === 'permission_denied' ||
                restaurant.sync_status?.price_status === 'unsupported_by_docs' ||
                restaurant.sync_status?.price_status === 'error'
                  ? undefined
                  : restaurant.sync_status?.last_price_sync,
            },
            {
              label: 'Остатки',
              syncedAt:
                restaurant.sync_status?.stock_status === 'permission_denied' ||
                restaurant.sync_status?.stock_status === 'unsupported_by_docs' ||
                restaurant.sync_status?.stock_status === 'error'
                  ? undefined
                  : restaurant.sync_status?.last_stock_sync,
            },
            {
              label: 'Заказы',
              syncedAt:
                restaurant.sync_status?.orders_status === 'permission_denied' ||
                restaurant.sync_status?.orders_status === 'unsupported_by_docs' ||
                restaurant.sync_status?.orders_status === 'error'
                  ? undefined
                  : restaurant.sync_status?.last_orders_sync,
            },
          ]
            .filter((scope) => Boolean(scope.syncedAt))
            .map((scope) => scope.label)

          const limitedChecks = (restaurant.sync_status?.permission_matrix || []).filter(
            (p) => p.status === 'permission_denied' || p.status === 'unsupported_by_docs'
          )
          const ordersDiagnostics = restaurant.sync_status?.orders_diagnostics
          const fallbackHint = fallbackReasonHint(ordersDiagnostics?.fallback_reason)
          const noDataHint = noDataReasonHint(ordersDiagnostics?.no_data_reason)

          const syncCards = [
            {
              label: 'Меню',
              sync: menuSync,
              text: formatTimeAgo(restaurant.sync_status?.last_menu_sync),
            },
            {
              label: 'Цены',
              sync: priceSync,
              text:
                restaurant.sync_status?.price_status === 'permission_denied'
                  ? statusHint('permission_denied')
                  : formatTimeAgo(restaurant.sync_status?.last_price_sync),
              forcedColor: restaurant.sync_status?.price_status === 'permission_denied' ? 'text-amber-600' : '',
            },
          ]

          return (
            <div key={restaurant.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{restaurant.name}</h3>
                  {restaurant.address && (
                    <p className="text-sm text-slate-400 mt-1">{restaurant.address}</p>
                  )}
                  {restaurant.provider_org_id && (
                    <p className="text-xs text-slate-400 mt-1">
                      iiko Org ID: {restaurant.provider_org_id}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEmployeesSync(restaurant.id)}
                    disabled={isSyncingEmployees || isSyncing}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 rounded-lg text-sm text-slate-500 transition-all"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncingEmployees ? 'animate-spin' : ''}`} />
                    {isSyncingEmployees ? 'Синк сотрудников...' : 'Синк сотрудников'}
                  </button>
                  <button
                    onClick={() => handleSync(restaurant.id)}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 rounded-lg text-sm text-slate-500 transition-all"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Синхронизация...' : 'Синхронизировать всё'}
                  </button>
                </div>
              </div>

              {(restaurant.sync_status?.data_limited || limitedChecks.length > 0) && limitedChecks.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-900">
                      {limitedChecks.some((c) => c.status === 'permission_denied')
                        ? 'Данные ограничены: нет части прав в iiko API'
                        : 'Данные ограничены: часть endpoint недоступна в Public API docs'}
                    </p>
                  </div>
                  {limitedChecks.map((check, idx) => (
                    <p key={`${restaurant.id}-perm-${idx}`} className="text-xs text-amber-700">
                      {scopeLabel(check.scope)}: {check.message || 'Нет доступа'}
                      {check.correlation_id ? ` (correlationId: ${check.correlation_id})` : ''}
                    </p>
                  ))}
                </div>
              )}

              {ordersDiagnostics && (
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700">
                    Качество синка заказов: {ordersDiagnostics.sync_quality || 'unknown'}
                  </p>
                  {ordersDiagnostics.fallback_triggered && (
                    <p className="text-xs text-slate-600 mt-1">
                      Fallback активирован
                      {fallbackHint ? `: ${fallbackHint}` : ''}
                    </p>
                  )}
                  {noDataHint && (
                    <p className="text-xs text-slate-600 mt-1">
                      Причина пустых данных: {noDataHint}
                    </p>
                  )}
                </div>
              )}

              {successfulScopes.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs font-semibold text-emerald-900">
                    Успешно подтянулось: {successfulScopes.join(', ')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {syncCards.map(({ label, sync, text, forcedColor }) => (
                  <div key={label} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <sync.icon className={`h-4 w-4 ${forcedColor || sync.color}`} />
                      <span className="text-sm text-slate-500">{label}</span>
                    </div>
                    <p className={`text-xs ${forcedColor || sync.color}`}>{text}</p>
                  </div>
                ))}
              </div>

              {(restaurant.sync_status?.sync_errors?.length || 0) > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-900 mb-1">Предупреждение интеграции</p>
                  {restaurant.sync_status?.sync_errors?.map((msg, idx) => (
                    <p key={`${restaurant.id}-warn-${idx}`} className="text-xs text-amber-700">
                      {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
