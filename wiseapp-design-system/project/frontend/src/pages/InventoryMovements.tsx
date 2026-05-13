import { useState, useEffect } from 'react'
import { Package, Search, ArrowDownRight, ArrowUpRight, Warehouse } from 'lucide-react'
import { inventoryApi } from '../services/inventoryApi'

interface WarehouseItem {
  id: string
  name: string
  unit: string
  quantity: number
  min_quantity?: number
  min_stock?: number
  unit_cost?: number
}

interface WarehouseInfo {
  id: string
  name: string
  type?: string
}

interface InventoryTransaction {
  id: string
  transaction_type: string
  quantity_changed: number
  reason?: string | null
  created_at: string
}

export default function InventoryMovements() {
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([])
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [activeWarehouse, setActiveWarehouse] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [sort, setSort] = useState<'name_asc' | 'name_desc' | 'quantity_desc' | 'quantity_asc'>('name_asc')
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [txType, setTxType] = useState<string>('')
  const [txCreatedFrom, setTxCreatedFrom] = useState('')
  const [txCreatedTo, setTxCreatedTo] = useState('')
  const [txSort, setTxSort] = useState<'created_at_desc' | 'created_at_asc'>('created_at_desc')
  const [txLimit] = useState(10)
  const [txOffset, setTxOffset] = useState(0)
  const [txTotal, setTxTotal] = useState(0)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loadingWh, setLoadingWh] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingTx, setLoadingTx] = useState(false)

  useEffect(() => {
    inventoryApi.warehouses()
      .then((res) => {
        const data: WarehouseInfo[] = res.data?.items || res.data?.warehouses || res.data || []
        setWarehouses(data)
        if (data.length > 0) {
          setActiveWarehouse(data[0].id)
        }
      })
      .catch(() => setWarehouses([]))
      .finally(() => setLoadingWh(false))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    if (!activeWarehouse) return
    setLoadingItems(true)
    inventoryApi.items(activeWarehouse, {
      search: debouncedSearch || undefined,
      lowStock: lowStockOnly || undefined,
      sort,
      limit,
      offset,
    })
      .then((res) => {
        const body = res.data || {}
        const nextItems: WarehouseItem[] = body.items || body.inventory_items || []
        setItems(Array.isArray(nextItems) ? nextItems : [])
        setTotal(typeof body.total === 'number' ? body.total : (Array.isArray(nextItems) ? nextItems.length : 0))
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoadingItems(false))
  }, [activeWarehouse, debouncedSearch, lowStockOnly, sort, limit, offset])

  useEffect(() => {
    setOffset(0)
  }, [activeWarehouse, debouncedSearch, lowStockOnly, sort])

  useEffect(() => {
    if (!items.length) {
      setSelectedItemId(null)
      return
    }
    if (!selectedItemId || !items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id)
    }
  }, [items, selectedItemId])

  useEffect(() => {
    setTxOffset(0)
  }, [selectedItemId, txType, txCreatedFrom, txCreatedTo, txSort])

  useEffect(() => {
    if (!selectedItemId) {
      setTransactions([])
      setTxTotal(0)
      return
    }
    setLoadingTx(true)
    inventoryApi.transactions(selectedItemId, {
      type: txType || undefined,
      createdFrom: txCreatedFrom || undefined,
      createdTo: txCreatedTo || undefined,
      sort: txSort,
      limit: txLimit,
      offset: txOffset,
    })
      .then((res) => {
        const body = res.data || {}
        const nextItems: InventoryTransaction[] = body.items || body.transactions || []
        setTransactions(Array.isArray(nextItems) ? nextItems : [])
        setTxTotal(typeof body.total === 'number' ? body.total : (Array.isArray(nextItems) ? nextItems.length : 0))
      })
      .catch(() => {
        setTransactions([])
        setTxTotal(0)
      })
      .finally(() => setLoadingTx(false))
  }, [selectedItemId, txType, txCreatedFrom, txCreatedTo, txSort, txLimit, txOffset])

  const page = Math.floor(offset / limit) + 1
  const pages = Math.max(1, Math.ceil(total / limit))
  const txPage = Math.floor(txOffset / txLimit) + 1
  const txPages = Math.max(1, Math.ceil(txTotal / txLimit))

  if (loadingWh) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Склад и Движение</h1>
          <p className="text-gray-500 mt-1">Управление остатками, приходами и списаниями</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowDownRight className="w-4 h-4" />
            Списание
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
            <ArrowUpRight className="w-4 h-4" />
            Приход
          </button>
        </div>
      </div>

      {warehouses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Warehouse className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400 font-medium">Склады не настроены</p>
          <p className="text-gray-300 text-sm mt-1">Добавьте склады в разделе «Складской учёт»</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 flex-wrap">
            {warehouses.map((w) => (
              <button
                key={w.id}
                onClick={() => setActiveWarehouse(w.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeWarehouse === w.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Поиск по сырью..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none w-80 text-sm transition-all"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  Только мало остатка
                </label>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"
                >
                  <option value="name_asc">Имя A-Z</option>
                  <option value="name_desc">Имя Z-A</option>
                  <option value="quantity_desc">Остаток убыв.</option>
                  <option value="quantity_asc">Остаток возр.</option>
                </select>
              </div>
            </div>

            {loadingItems ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 font-medium">Нет товаров на складе</p>
                {searchTerm && (
                  <p className="text-gray-300 text-sm mt-1">Попробуйте изменить поисковый запрос</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Наименование</th>
                      <th className="px-6 py-4 text-right">Остаток</th>
                      <th className="px-6 py-4 text-right">Ед. изм.</th>
                      <th className="px-6 py-4 text-right">Цена за ед.</th>
                      <th className="px-6 py-4 text-right">Сумма на складе</th>
                      <th className="px-6 py-4 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const minStock = item.min_quantity ?? item.min_stock ?? 0
                      const unitCost = item.unit_cost ?? 0
                      const isLow = item.quantity <= minStock
                      const unitLabel =
                        item.unit === 'kg' ? 'кг'
                        : item.unit === 'liters' || item.unit === 'л' ? 'л'
                        : item.unit === 'pcs' ? 'шт'
                        : item.unit
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={`hover:bg-gray-50/80 transition-colors group cursor-pointer ${
                            selectedItemId === item.id ? 'bg-brand-50/40' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5" />
                              </div>
                              <span className="font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 text-right text-gray-500">{unitLabel}</td>
                          <td className="px-6 py-4 text-right text-gray-500">
                            {unitCost > 0 ? `${unitCost.toLocaleString('ru-RU')} ₸` : '—'}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {unitCost > 0 ? `${(item.quantity * unitCost).toLocaleString('ru-RU')} ₸` : '—'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100">
                                Заканчивается
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                В норме
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
              <p className="text-sm text-gray-500">
                Показано {items.length} из {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={offset <= 0}
                  onClick={() => setOffset((v) => Math.max(0, v - limit))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
                >
                  Назад
                </button>
                <span className="text-sm text-gray-600">Страница {page} из {pages}</span>
                <button
                  disabled={offset + limit >= total}
                  onClick={() => setOffset((v) => v + limit)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
                >
                  Вперёд
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">История движений по товару</h2>
              <div className="text-sm text-gray-500">
                {selectedItemId ? `Товар: ${items.find((i) => i.id === selectedItemId)?.name || '—'}` : 'Выберите товар'}
              </div>
            </div>

            <div className="p-5 border-b border-gray-100 flex flex-wrap gap-3">
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"
              >
                <option value="">Все типы</option>
                <option value="in">Приход</option>
                <option value="write_off">Списание</option>
                <option value="back_flush">Автосписание</option>
                <option value="reconciliation">Инвентаризация</option>
              </select>
              <input
                type="date"
                value={txCreatedFrom}
                onChange={(e) => setTxCreatedFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"
              />
              <input
                type="date"
                value={txCreatedTo}
                onChange={(e) => setTxCreatedTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"
              />
              <select
                value={txSort}
                onChange={(e) => setTxSort(e.target.value as typeof txSort)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"
              >
                <option value="created_at_desc">Сначала новые</option>
                <option value="created_at_asc">Сначала старые</option>
              </select>
            </div>

            {loadingTx ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-10 text-center text-gray-400">Нет движений по выбранному товару</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Дата</th>
                      <th className="px-6 py-4">Тип</th>
                      <th className="px-6 py-4 text-right">Количество</th>
                      <th className="px-6 py-4">Причина</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(tx.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tx.transaction_type}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{tx.quantity_changed}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{tx.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
              <p className="text-sm text-gray-500">
                Показано {transactions.length} из {txTotal}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={txOffset <= 0}
                  onClick={() => setTxOffset((v) => Math.max(0, v - txLimit))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
                >
                  Назад
                </button>
                <span className="text-sm text-gray-600">Страница {txPage} из {txPages}</span>
                <button
                  disabled={txOffset + txLimit >= txTotal}
                  onClick={() => setTxOffset((v) => v + txLimit)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
                >
                  Вперёд
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
