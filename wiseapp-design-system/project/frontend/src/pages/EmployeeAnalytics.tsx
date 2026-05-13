import { useState } from 'react'
import { Users, Filter, Download } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { Skeleton, KPICardSkeleton, TableSkeleton } from '../components/Skeleton'
import { ImportWizard } from '../components/import/ImportWizard'
import { useFilterStore } from '../store/filterStore'
import { ErrorFallback } from '../components/ErrorFallback'

export default function EmployeeAnalytics() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedShift, setSelectedShift] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)
  const { globalPeriod } = useFilterStore()

  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.employee({
      restaurant_id: rid,
      employee_id: selectedEmployee || undefined,
      shift_id: selectedShift || undefined,
      period: globalPeriod.preset,
    }),
    [selectedEmployee, selectedShift, globalPeriod.preset],
  )

  const handleFilter = () => {
    reload()
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-64 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <Skeleton width="300" height="40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={6} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <ErrorFallback error={error} onRetry={reload} />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-500" />
            Аналитика Сотрудников
          </h1>
          <p className="text-slate-400 mt-1">Эффективность, смены, фильтры</p>
        </div>
        <button 
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          Импорт сотрудников из Excel
        </button>
      </div>

      <ImportWizard 
        domain="employees"
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => reload()}
        title="Импорт сотрудников из Excel"
      />

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-800"
          >
            <option value="">Все сотрудники</option>
            {data.employees?.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
            ))}
          </select>
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-brand-600 hover:bg-primary-700 text-slate-800 rounded-lg transition-all"
          >
            Применить
          </button>
        </div>
      </div>

      {/* Employee Stats */}
      {data.employee_stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <p className="text-sm text-slate-400">Заказы</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{data.employee_stats.total_orders}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <p className="text-sm text-slate-400">Выручка</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{data.employee_stats.total_revenue?.toLocaleString('ru-RU') || 0} ₸</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <p className="text-sm text-slate-400">Заказы/час</p>
            <p className="text-3xl font-bold text-brand-500 mt-2">{data.employee_stats.orders_per_hour || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <p className="text-sm text-slate-400">Выручка/час</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{data.employee_stats.revenue_per_hour?.toLocaleString('ru-RU') || 0} ₸</p>
          </div>
        </div>
      )}

      {/* Role Utilization */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Загрузка по ролям</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-3 text-slate-400 font-medium">Роль</th>
                <th className="text-left p-3 text-slate-400 font-medium">Сотрудников</th>
                <th className="text-left p-3 text-slate-400 font-medium">Смен</th>
                <th className="text-left p-3 text-slate-400 font-medium">Часов</th>
              </tr>
            </thead>
            <tbody>
              {data.role_utilization?.map((role: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-3 text-slate-800 font-medium capitalize">{role.role}</td>
                  <td className="p-3 text-slate-500">{role.total_employees}</td>
                  <td className="p-3 text-slate-500">{role.total_shifts}</td>
                  <td className="p-3 text-slate-500">{role.total_hours} ч</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Efficiency */}
      {data.operator_efficiency && data.operator_efficiency.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Эффективность операторов</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.operator_efficiency.map((op: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-800 font-medium">{op.operator_name}</p>
                  <span className="text-sm font-semibold text-brand-500">{op.conversion_rate}%</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Черновиков</p>
                    <p className="text-slate-800 font-semibold">{op.total_drafts}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Конвертировано</p>
                    <p className="text-green-400 font-semibold">{op.committed}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Заброшено</p>
                    <p className="text-red-400 font-semibold">{op.abandoned}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Инсайты</h3>
          <ul className="space-y-2">
            {data.insights.map((insight: string, idx: number) => (
              <li key={idx} className="text-slate-500 text-sm flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
