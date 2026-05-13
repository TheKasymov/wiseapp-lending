import { useState, useEffect } from 'react'
import { Users, Plus, ToggleLeft, ToggleRight, X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { teamApi, TeamMember } from '../services/teamApi'

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">Активен</span>
  }
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 ring-1 ring-slate-200">Отключён</span>
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'point_manager') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">Менеджер точки</span>
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">{role}</span>
}

interface CreateModalProps {
  onClose: () => void
  onCreated: (member: TeamMember) => void
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    setLoading(true)
    try {
      const res = await teamApi.create({
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      })
      onCreated(res.data)
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Этот email уже зарегистрирован')
      } else {
        setError('Ошибка создания аккаунта')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Добавить участника команды</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="Иван"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Фамилия</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="Иванов"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="manager@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="Минимум 6 символов"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700">
            Участник получит роль <strong>Менеджер точки</strong>. Он сможет видеть аналитику, но не изменять настройки подключения iiko.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-slate-900 text-sm font-bold hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    teamApi.list()
      .then(res => setMembers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Не удалось загрузить список участников'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreated = (member: TeamMember) => {
    setMembers(prev => [...prev, member])
    setShowCreate(false)
    setSuccessMsg(`Аккаунт ${member.email} создан`)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const toggleStatus = async (member: TeamMember) => {
    setTogglingId(member.id)
    const next = member.status === 'active' ? 'suspended' : 'active'
    try {
      await teamApi.updateStatus(member.id, next)
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: next } : m))
    } catch {
      // silent
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-500" />
            Команда
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Управляйте доступом участников вашей сети</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-slate-900 rounded-xl font-bold text-sm hover:bg-brand-400 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Добавить участника
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">Участников пока нет</p>
          <p className="text-sm mt-1">Добавьте менеджеров ваших ресторанов</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Участник</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Роль</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Добавлен</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {member.first_name || member.last_name
                        ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
                        : '—'}
                    </div>
                    <div className="text-xs text-slate-400">{member.email}</div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={member.role} /></td>
                  <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(member.created_at).toLocaleDateString('ru-KZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleStatus(member)}
                      disabled={togglingId === member.id}
                      title={member.status === 'active' ? 'Отключить' : 'Активировать'}
                      className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      {member.status === 'active'
                        ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                        : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
