import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/authApi'
import { User, Mail, Phone, Lock, Save, Check, AlertTriangle, Shield } from 'lucide-react'

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setPhone(user.phone || '')
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { data } = await authApi.updateProfile({
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
      })
      setUser(data)
      setMessage('Профиль обновлён')
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setError('Ошибка обновления профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    setPasswordLoading(true)
    try {
      await authApi.changePassword(oldPassword, newPassword)
      setPasswordMessage('Пароль успешно изменён')
      setOldPassword('')
      setNewPassword('')
      setTimeout(() => setPasswordMessage(''), 3000)
    } catch {
      setPasswordError('Неверный старый пароль')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Generate initials for avatar
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map(n => n.charAt(0).toUpperCase())
    .join('') || (user?.email?.charAt(0).toUpperCase() || 'U')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-brand-100 rounded-xl">
            <User className="h-7 w-7 text-brand-600" />
          </div>
          Профиль
        </h1>
        <p className="text-slate-400 mt-1 ml-14">Управление личными данными и безопасностью</p>
      </div>

      {/* Avatar + Email Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl">{initials}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Пользователь'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-sm text-slate-500">{user?.email}</span>
            </div>
            {user?.role && (
              <span className="inline-flex items-center mt-2 text-xs font-bold px-2.5 py-0.5 bg-brand-50 text-brand-600 rounded-full tracking-wide">
                {user.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <User className="h-5 w-5 text-slate-400" />
          Личные данные
        </h2>

        {message && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span className="text-emerald-700 font-medium">{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Имя</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="Имя"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Фамилия</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="Фамилия"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Телефон</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-sm shadow-brand-500/20 active:scale-[0.99]"
          >
            {loading ? (
              <span>Сохранение...</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Сохранить
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <Shield className="h-5 w-5 text-slate-400" />
          Безопасность
        </h2>

        {passwordMessage && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span className="text-emerald-700 font-medium">{passwordMessage}</span>
          </div>
        )}
        {passwordError && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 font-medium">{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Текущий пароль</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Новый пароль</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="Минимум 8 символов"
                required
                minLength={8}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold rounded-xl transition-all active:scale-[0.99]"
          >
            {passwordLoading ? (
              <span>Изменение...</span>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Изменить пароль
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
