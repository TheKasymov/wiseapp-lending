import { useState } from 'react'
import { Package, ArrowDownUp, AlertTriangle, Warehouse, Minus, Info, X } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { inventoryApi } from '../services/inventoryApi'
import { ImportWizard } from '../components/import/ImportWizard'
import { Download } from 'lucide-react'

export default function Inventory() {
  const { data: whData, loading } = useAnalyticsData((restaurantId) => inventoryApi.warehouses(restaurantId), 'inv')
  const [selectedWh, setSelectedWh] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [showWriteOff, setShowWriteOff] = useState(false)
  const [woForm, setWoForm] = useState({ item_id: '', quantity: 1, reason: '' })
  const [importOpen, setImportOpen] = useState(false)

  const warehouses = whData?.items || whData?.warehouses || whData || []

  const loadItems = async (whId: string) => {
    setSelectedWh(whId)
    try {
      const res = await inventoryApi.items(whId, { sort: 'name_asc', limit: 200, offset: 0 })
      setItems(res.data?.items || res.data || [])
    } catch { setItems([]) }
  }

  const handleWriteOff = async () => {
    try {
      await inventoryApi.writeOff(woForm)
      setShowWriteOff(false)
      if (selectedWh) loadItems(selectedWh)
    } catch (e) { console.error(e) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Складской учёт</h1>
        <div className="flex justify-between items-start mt-1">
          <p className="text-gray-500">Управление складами, остатками и движением товаров</p>
          <button 
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Импорт из Excel
          </button>
        </div>
      </div>

      <ImportWizard 
        domain="inventory"
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => selectedWh && loadItems(selectedWh)}
        title="Импорт ингредиентов из Excel"
      />

      {/* Warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.isArray(warehouses) && warehouses.length > 0 ? warehouses.map((wh: any) => (
          <button key={wh.id} onClick={() => loadItems(wh.id)}
            className={`text-left bg-white p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
              selectedWh === wh.id ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-100'
            }`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Warehouse className="w-5 h-5" /></div>
              <span className="font-semibold text-gray-900">{wh.name}</span>
            </div>
            <p className="text-sm text-gray-500">{wh.address || 'Основной склад'}</p>
          </button>
        )) : (
          <div className="col-span-3 bg-white rounded-2xl p-8 text-center border border-gray-100">
            <Warehouse className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">Склады не настроены</p>
          </div>
        )}
      </div>

      {/* Items table */}
      {selectedWh && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Товары на складе</h2>
            <button onClick={() => setShowWriteOff(true)}
              className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition flex items-center gap-2">
              <Minus className="w-4 h-4" /> Списать
            </button>
          </div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3" />
              <p>Нет товаров на складе</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Название</th>
                  <th className="px-6 py-3 text-right">Остаток</th>
                  <th className="px-6 py-3 text-left">Единица</th>
                  <th className="px-6 py-3 text-right">Мин. остаток</th>
                  <th className="px-6 py-3 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{item.min_quantity ?? item.min_stock ?? 0}</td>
                    <td className="px-6 py-4 text-right">
                      {item.quantity <= (item.min_quantity ?? item.min_stock ?? 0) ? (
                        <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium flex items-center gap-1 justify-end">
                          <AlertTriangle className="w-3 h-3" /> Мало
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">Ок</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Write-off modal */}
      {showWriteOff && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Списание товара</h3>
              <button onClick={() => setShowWriteOff(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Товар</label>
                <select value={woForm.item_id} onChange={e => setWoForm({...woForm, item_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm">
                  <option value="">Выберите товар</option>
                  {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
                <input type="number" min="1" value={woForm.quantity} onChange={e => setWoForm({...woForm, quantity: +e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Причина</label>
                <input type="text" value={woForm.reason} onChange={e => setWoForm({...woForm, reason: e.target.value})}
                  placeholder="Срок годности, порча..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              </div>
              <button onClick={handleWriteOff}
                className="w-full py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition">Списать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
