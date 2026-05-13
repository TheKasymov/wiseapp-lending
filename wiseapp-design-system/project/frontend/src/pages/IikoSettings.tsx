import { useState, useEffect } from 'react'
import { Check, AlertTriangle, Loader2, Info, Shield, RefreshCw, Store, CheckCircle2, Plug, ChevronDown, Lock } from 'lucide-react'
import { iikoApi } from '../services/iikoApi'
import { useNavigate } from 'react-router-dom'
import { useRestaurantStore } from '../store/restaurantStore'
import { useFilterStore } from '../store/filterStore'
import { useAnalyticsCacheStore } from '../store/analyticsCacheStore'

type ConnectionStep = 'idle' | 'saving' | 'authenticating' | 'fetching_orgs' | 'creating' | 'done'

const stepLabels: Record<ConnectionStep, string> = {
  idle: '',
  saving: 'Проверяем API ключ...',
  authenticating: 'Проверяем подключение к iiko...',
  fetching_orgs: 'Загружаем организации...',
  creating: 'Создаём ресторан...',
  done: 'Готово!',
}

const isOwnershipError = (raw: string) =>
  raw.includes('already registered by another user') || raw.includes('already connected')

const translateError = (raw: string): string => {
  if (isOwnershipError(raw))
    return raw // обрабатывается отдельным UI-блоком
  if (raw.includes('invalid key hex') || raw.includes('encoding/hex'))
    return 'Ошибка конфигурации сервера шифрования. Обратитесь к администратору.'
  if (raw.includes('POS authenticate') || raw.includes('iiko authenticate'))
    return 'Не удалось авторизоваться в iiko. Проверьте API Login и API Password.'
  if (raw.includes('no organizations found'))
    return 'Нет доступных организаций для этого API ключа. Проверьте настройки в iikoOffice.'
  if (raw.includes('save credentials'))
    return 'Ошибка сохранения данных. Попробуйте ещё раз.'
  if (raw.includes('failed to connect'))
    return raw.split(': ').pop() || 'Ошибка подключения. Проверьте данные.'
  return raw
}

interface ConnectedRestaurant {
  id: string
  name: string
  address?: string
  status: string
  sync_status?: {
    last_menu_sync?: string
    sync_errors?: string[]
  }
}

export default function IikoSettings() {
  const navigate = useNavigate()
  const { setRestaurants: setStoreRestaurants } = useRestaurantStore()
  const { selectAllRestaurants } = useFilterStore()
  const { invalidateAll: invalidateAnalyticsCache } = useAnalyticsCacheStore()
  const [apiLogin, setApiLogin] = useState('')
  const [apiPassword, setApiPassword] = useState('')
  const [appId, setAppId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ownershipError, setOwnershipError] = useState(false)
  const [success, setSuccess] = useState(false)
  const [connectedRestaurant, setConnectedRestaurant] = useState<string>('')
  const [authWarning, setAuthWarning] = useState('')
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('idle')

  // Текущий статус подключения
  const [existingRestaurants, setExistingRestaurants] = useState<ConnectedRestaurant[]>([])
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [showReconnect, setShowReconnect] = useState(false)

  useEffect(() => {
    checkExistingConnection()
  }, [])

  const checkExistingConnection = async () => {
    setCheckingStatus(true)
    try {
      const response = await iikoApi.listRestaurants()
      if (response.data && response.data.length > 0) {
        setExistingRestaurants(response.data)
      }
    } catch {
      // Нет подключённых ресторанов — это нормально
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOwnershipError(false)
    setSuccess(false)
    setAuthWarning('')
    setConnectionStep('saving')

    try {
      // Animated steps
      await new Promise(r => setTimeout(r, 400))
      setConnectionStep('authenticating')

      // Автоопределение версии: если заполнены App ID и Client Secret → v2, иначе → v1
      const useV2 = appId.trim() !== '' && clientSecret.trim() !== ''
      const response = await iikoApi.connectCredentials({
        api_login: apiLogin,
        api_password: apiPassword,
        ...(useV2 ? { app_id: appId, client_secret: clientSecret, auth_version: 'v2' } : {}),
      })

      setConnectionStep('fetching_orgs')
      await new Promise(r => setTimeout(r, 300))
      setConnectionStep('creating')
      await new Promise(r => setTimeout(r, 300))
      setConnectionStep('done')

      setSuccess(true)
      setConnectedRestaurant(response.data.name)
      const warning = response.data.sync_status?.sync_errors?.[0] || ''
      if (warning) {
        setAuthWarning(warning)
      }

      // DB обновлена → инвалидируем все клиентские кэши
      setStoreRestaurants([response.data])  // ресторан сразу в хедере
      selectAllRestaurants()
      invalidateAnalyticsCache()            // старая аналитика устарела

      // Через 2 секунды переходим к ресторанам
      setTimeout(() => navigate('/restaurants'), 2000)
    } catch (err: any) {
      const rawError = err.response?.data?.error || 'Ошибка подключения. Проверьте данные.'
      if (isOwnershipError(rawError)) {
        setOwnershipError(true)
      } else {
        setError(translateError(rawError))
      }
      setConnectionStep('idle')
    } finally {
      setLoading(false)
    }
  }

  const isConnected = existingRestaurants.length > 0

  // Skeleton loading
  if (checkingStatus) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-56 bg-gray-100 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-80 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <div className="h-6 w-40 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-brand-100 rounded-xl">
            <Plug className="h-7 w-7 text-brand-600" />
          </div>
          Подключение iiko
        </h1>
        <p className="text-slate-400 mt-1 ml-14">Подключите вашу POS-систему для синхронизации данных</p>
      </div>

      {/* Already Connected State */}
      {isConnected && !showReconnect && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Status Header */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3">
            <div className="p-1.5 bg-emerald-100 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">iiko подключён</p>
              <p className="text-xs text-emerald-600">{existingRestaurants.length} {existingRestaurants.length === 1 ? 'ресторан' : 'ресторана'} синхронизированы</p>
              <p className="text-xs text-emerald-600">Подключение успешно: полнота аналитики зависит от доступных Public API endpoint и времени первой синхронизации.</p>
            </div>
          </div>

          {/* Restaurants List */}
          <div className="p-6 space-y-3">
            {existingRestaurants.map((rest) => (
              <div key={rest.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Store className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{rest.name}</p>
                    {rest.address && (
                      <p className="text-xs text-slate-400 mt-0.5">{rest.address}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  Активен
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => navigate('/restaurants')}
              className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Store className="h-4 w-4" />
              Управление ресторанами
            </button>
            <button
              onClick={() => setShowReconnect(true)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Переподключить
            </button>
          </div>
        </div>
      )}

      {/* Connection Form */}
      {(!isConnected || showReconnect) && (
        <>
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-lg mt-0.5 flex-shrink-0">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-800 mb-1">Где найти API ключи?</p>
              <p className="text-slate-500 leading-relaxed">
                Перейдите в <b className="text-slate-700">iikoOffice → Настройки → API</b> или обратитесь к вашему менеджеру iiko.
                Вам понадобятся API Login и API Password.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <form onSubmit={handleConnect} className="space-y-5">
              {/* API Login */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">API Login</label>
                <input
                  type="text"
                  value={apiLogin}
                  onChange={(e) => setApiLogin(e.target.value)}
                  placeholder="Ваш API ключ iiko"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                  required
                  autoComplete="off"
                />
              </div>

              {/* API Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">API Password</label>
                <input
                  type="password"
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                />
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Шифруется AES-256-GCM перед сохранением
                </p>
              </div>

              {/* Дополнительные настройки (v2 fields, hidden behind toggle) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                  Дополнительные настройки
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Заполните эти поля, если ваш менеджер iiko предоставил дополнительные ключи для расширенного доступа.
                    </p>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">App ID</label>
                      <input
                        type="text"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        placeholder="Опционально"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Client Secret</label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="Опционально"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Connection Progress */}
              {loading && connectionStep !== 'idle' && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                  <div className="space-y-2.5">
                    {(['saving', 'authenticating', 'fetching_orgs', 'creating', 'done'] as ConnectionStep[]).map((step, idx) => {
                      const stepOrder = ['saving', 'authenticating', 'fetching_orgs', 'creating', 'done']
                      const currentIdx = stepOrder.indexOf(connectionStep)
                      const thisIdx = idx
                      const isDone = thisIdx < currentIdx
                      const isCurrent = thisIdx === currentIdx
                      const isPending = thisIdx > currentIdx

                      if (isPending) return null

                      return (
                        <div key={step} className={`flex items-center gap-3 text-sm transition-all duration-300 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                          {isDone ? (
                            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 text-brand-600 animate-spin flex-shrink-0" />
                          ) : null}
                          <span className={isDone ? 'text-emerald-700' : 'text-brand-700 font-medium'}>
                            {stepLabels[step]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Ошибка: ключ занят другим пользователем */}
              {ownershipError && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5">
                    <Lock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">API ключ уже зарегистрирован</p>
                    <p className="text-amber-700 mt-1 leading-relaxed">
                      Этот API Login уже подключён в системе другим пользователем.
                      Первый зарегистрировавший ключ является его владельцем.
                    </p>
                    <p className="text-amber-600 mt-2 text-xs">
                      Если вы считаете, что это ошибка — обратитесь к администратору системы.
                    </p>
                  </div>
                </div>
              )}

              {/* Ошибка: прочие */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Ошибка подключения</p>
                    <p className="text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-800">Успешно подключено!</p>
                    <p className="text-emerald-600 mt-0.5">Ресторан: <b>{connectedRestaurant}</b>. Переходим...</p>
                  </div>
                </div>
              )}
              {authWarning && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Режим авторизации iiko</p>
                    <p className="text-amber-700 mt-0.5">{authWarning}</p>
                  </div>
                </div>
              )}
              {/* Submit */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-500/20 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Plug className="h-5 w-5" />
                    Подключить iiko
                  </>
                )}
              </button>

              {/* Back to connected state */}
              {showReconnect && (
                <button
                  type="button"
                  onClick={() => setShowReconnect(false)}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
                >
                  ← Назад к текущему подключению
                </button>
              )}
            </form>
          </div>

          {/* Security Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Безопасность
            </h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Пароли шифруются AES-256-GCM перед сохранением</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>iiko токен автоматически обновляется каждые 59 минут</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>При ошибке подключения данные не сохраняются</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

