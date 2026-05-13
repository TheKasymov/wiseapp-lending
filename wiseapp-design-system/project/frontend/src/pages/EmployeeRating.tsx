import { UserCheck, AlertTriangle, ShieldAlert, ShieldCheck, Award, Info } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { useFilterStore } from '../store/filterStore'

export default function EmployeeRating() {
  const { globalPeriod } = useFilterStore()
  const { data, loading } = useAnalyticsData(
    (rid) => analyticsApi.trustScore({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  const employees = data?.employees || []
  const avgScore = data?.avg_trust_score || 0

  const ratingColors: Record<string, string> = {
    'Отлично': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'Хорошо': 'text-sky-600 bg-sky-50 border-sky-100',
    'Внимание': 'text-amber-600 bg-amber-50 border-amber-100',
    'Критично': 'text-rose-600 bg-rose-50 border-rose-100',
  }
  const scoreColor = (score: number) => score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-sky-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600'
  const scoreBg = (score: number) => score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-sky-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trust Score</h1>
        <p className="text-gray-500 mt-1">Рейтинг доверия сотрудников · Средний балл: <span className={`font-bold ${scoreColor(avgScore)}`}>{avgScore}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><UserCheck className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Всего сотрудников</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data?.total_employees || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Отлично (90+)</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{employees.filter((e: any) => e.trust_score >= 90).length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><ShieldAlert className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-gray-500">Критично (&lt;50)</span>
          </div>
          <p className="text-3xl font-bold text-rose-600">{employees.filter((e: any) => e.trust_score < 50).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Рейтинг сотрудников</h2>
        </div>
        {employees.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Award className="w-10 h-10 mx-auto mb-3" />
            <p>Нет данных о сотрудниках</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {employees.map((emp: any) => (
              <div key={emp.id} className="px-6 py-4 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${scoreBg(emp.trust_score)}`}>
                      {emp.trust_score}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{emp.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ratingColors[emp.rating] || 'text-gray-500 bg-gray-50'}`}>
                        {emp.rating}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{emp.role} · {emp.total_shifts} смен · Инцидентов: {emp.incidents?.total || 0}</p>
                    {emp.total_damage > 0 && (
                      <p className="text-sm text-rose-500 mt-0.5">Ущерб: {Math.round(emp.total_damage).toLocaleString()} ₸</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${scoreBg(emp.trust_score)}`} style={{ width: `${emp.trust_score}%` }} />
                    </div>
                  </div>
                </div>
                {emp.patterns && emp.patterns.length > 0 && (
                  <div className="mt-2 ml-16">
                    {emp.patterns.map((p: string, i: number) => (
                      <p key={i} className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-lg inline-block mr-2 mb-1">⚠️ {p}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
