import { useState } from 'react'
import { ClipboardCheck, Search, AlertCircle, CheckCircle2, Factory } from 'lucide-react'

// Моки для Умной Инвентаризации (План-Факт)
const MOCK_AUDIT = [
  { id: '1', name: 'Стейк Рибай Прайм', unit: 'kg', plan_quantity: 45.5, fact_quantity: 45.0, diff: -0.5, cost_diff: -4250, status: 'warning' },
  { id: '2', name: 'Лосось филе', unit: 'kg', plan_quantity: 12.0, fact_quantity: 12.0, diff: 0, cost_diff: 0, status: 'ok' },
  { id: '3', name: 'Сыр Моцарелла', unit: 'kg', plan_quantity: 24.0, fact_quantity: 20.0, diff: -4.0, cost_diff: -12800, status: 'critical' },
  { id: '4', name: 'Кофе зерновой Arabica', unit: 'kg', plan_quantity: 8.5, fact_quantity: 9.0, diff: +0.5, cost_diff: +6000, status: 'surplus' },
  { id: '5', name: 'Молоко 3.2%', unit: 'liters', plan_quantity: 36.0, fact_quantity: 36.0, diff: 0, cost_diff: 0, status: 'ok' },
  { id: '6', name: 'Булочка для бургера', unit: 'pcs', plan_quantity: 150, fact_quantity: 140, diff: -10, cost_diff: -1200, status: 'warning' },
]

export default function SmartInventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [audits, setAudits] = useState(MOCK_AUDIT)

  const filteredAudits = audits.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalShortage = audits.filter(a => a.cost_diff < 0).reduce((acc, a) => acc + Math.abs(a.cost_diff), 0)
  const totalSurplus = audits.filter(a => a.cost_diff > 0).reduce((acc, a) => acc + a.cost_diff, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Умная Инвентаризация</h1>
          <p className="text-gray-500 mt-1">План-фактный анализ на основе авто-списаний по техкартам</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
            <ClipboardCheck className="w-4 h-4" />
            Начать инвентаризацию
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Авто-списаний за сутки</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">482 <span className="text-sm font-normal text-gray-400">транзакции</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Общая недостача</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{totalShortage.toLocaleString()} ₸</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Общие излишки</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">+{totalSurplus.toLocaleString()} ₸</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по результатам инвентаризации..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none w-96 text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Сырье</th>
                <th className="px-6 py-4 text-center">Ед.</th>
                <th className="px-6 py-4 text-right">Учетный остаток (План)</th>
                <th className="px-6 py-4 text-right">Фактический остаток</th>
                <th className="px-6 py-4 text-right">Расхождение</th>
                <th className="px-6 py-4 text-right">Сумма расхождения</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAudits.map(item => {
                const diffColor = item.status === 'ok' ? 'text-gray-400' 
                  : item.status === 'surplus' ? 'text-emerald-600 font-medium' 
                  : item.status === 'critical' ? 'text-rose-600 font-bold' 
                  : 'text-amber-600 font-medium';
                  
                return (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{item.unit === 'kg' ? 'кг' : item.unit === 'liters' ? 'л' : 'шт'}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{item.plan_quantity}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      <div className="flex justify-end pr-2">
                        <input 
                          type="number" 
                          disabled
                          value={item.fact_quantity} 
                          className="w-20 text-right bg-transparent border-b border-gray-200 focus:border-brand-500 focus:outline-none px-1" 
                        />
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right ${diffColor}`}>
                      {item.diff > 0 ? '+' : ''}{item.diff !== 0 ? item.diff : '-'}
                    </td>
                    <td className={`px-6 py-4 text-right ${diffColor}`}>
                      {item.cost_diff > 0 ? '+' : ''}{item.cost_diff !== 0 ? `${item.cost_diff.toLocaleString()} ₸` : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
