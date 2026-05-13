import { useEffect, useState } from 'react'
import { AlertCircle, BarChart2, DollarSign, Loader2, Package, Search, TrendingUp } from 'lucide-react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { analyticsApi } from '../services/analyticsApi'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import ProductCompareSelector from '../components/widgets/ProductCompareSelector'
import { useFilterStore } from '../store/filterStore'
import { ErrorFallback } from '../components/ErrorFallback'
import type { AnalyticsNoDataMeta } from '../types/api'
import { getNoDataDescription, getNoDataTitle, getNoDataWindowLabel } from '../utils/noDataReason'

export default function ProductAnalytics() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [trendData, setTrendData] = useState<any[]>([])
  const [loadingTrend, setLoadingTrend] = useState(false)
  const { globalPeriod } = useFilterStore()

  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.financial({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  const financialData = (data || {}) as {
    restaurant_id?: string
    kpis?: { total_revenue?: number }
    top_products?: any[]
    no_data?: AnalyticsNoDataMeta
  }

  const topProducts = financialData.top_products || []
  const activeProduct = selectedProduct || topProducts[0] || null
  const noData = financialData.no_data
  const noDataTitle = getNoDataTitle(noData)
  const noDataDescription = getNoDataDescription(noData)
  const noDataWindow = getNoDataWindowLabel(noData)

  useEffect(() => {
    if (!activeProduct || !financialData.restaurant_id) {
      setTrendData([])
      return
    }

    let isMounted = true
    setLoadingTrend(true)

    analyticsApi.productTrend({
      restaurant_id: financialData.restaurant_id,
      product_name: activeProduct.product_name,
      period: globalPeriod.preset,
    })
      .then((res) => {
        if (!isMounted) return
        const formatted = (res.data?.trend || []).map((t: any) => {
          const d = new Date(t.date)
          return {
            ...t,
            dateStr: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
          }
        })
        setTrendData(formatted)
      })
      .catch((err) => {
        console.error('Failed to load product trend:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingTrend(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeProduct?.product_name, financialData.restaurant_id, globalPeriod.preset])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-64 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[380px] bg-white border border-gray-100 rounded-2xl animate-pulse" />
          <div className="h-[380px] bg-white border border-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorFallback error={error} onRetry={reload} />
  }

  const filteredProducts = topProducts.filter((p: any) =>
    (p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalRevenue = Number(financialData.kpis?.total_revenue || 0)
  const sharePercent = activeProduct && totalRevenue > 0
    ? ((activeProduct.total_revenue / totalRevenue) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Аналитика Товаров</h1>
          <p className="text-slate-500 font-medium mt-1">Детальная статистика и динамика продаж по каждой позиции</p>
        </div>
      </div>

      {noData && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">{noDataTitle}</p>
              <p className="text-sm text-blue-800">{noDataDescription}</p>
              {noDataWindow && <p className="text-xs text-blue-700 mt-1">{noDataWindow}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-[28px] border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)] flex flex-col h-[700px]">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-brand-500" />
              Топ позиций
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filteredProducts.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-slate-500">
                {topProducts.length === 0
                  ? 'Список товаров пуст: за выбранный период нет заказов.'
                  : 'По этому поисковому запросу ничего не найдено.'}
              </div>
            )}
            {filteredProducts.map((product: any, idx: number) => {
              const isSelected = activeProduct?.product_name === product.product_name
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedProduct(product)}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-brand-50 border-brand-200 shadow-sm ring-1 ring-brand-100'
                      : 'bg-white border-transparent hover:bg-gray-50'
                  } border`}
                >
                  <p className={`font-bold text-[15px] mb-1 truncate ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>
                    {idx + 1}. {product.product_name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-slate-500">{product.order_count} шт</span>
                    <span className={`text-sm font-bold ${isSelected ? 'text-brand-600' : 'text-slate-700'}`}>
                      {Number(product.total_revenue || 0).toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeProduct ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-0.5">Выручка (период)</p>
                    <p className="text-xl font-bold text-slate-800">{Number(activeProduct.total_revenue || 0).toLocaleString('ru-RU')} ₸</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-0.5">Продажи</p>
                    <p className="text-xl font-bold text-slate-800">{Number(activeProduct.order_count || 0)} шт</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-brand-50 text-brand-600 rounded-2xl">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-0.5">Доля в выручке</p>
                    <p className="text-xl font-bold text-slate-800">{sharePercent}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Динамика продаж по дням</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">{activeProduct.product_name}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <BarChart2 className="h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="h-[350px]">
                  {loadingTrend ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                    </div>
                  ) : trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="dateStr" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} dy={10} />
                        <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} dx={-10} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                        />
                        <Bar yAxisId="left" dataKey="sales" name="Количество (шт)" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                      Нет данных за период
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <ProductCompareSelector availableProducts={topProducts || []} initialProductIds={[activeProduct.product_id]} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white rounded-[28px] border border-gray-100 shadow-sm h-full min-h-[400px] px-6 text-center">
              <Package className="h-16 w-16 text-gray-200 mb-4" />
              {noData ? (
                <>
                  <p className="text-lg font-bold text-slate-700">{noDataTitle}</p>
                  <p className="text-sm text-slate-500 mt-2">{noDataDescription}</p>
                  {noDataWindow && <p className="text-xs text-slate-400 mt-2">{noDataWindow}</p>}
                </>
              ) : (
                <p className="text-lg font-bold text-slate-400">Выберите товар для показа аналитики</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
