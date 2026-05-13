import { CloudSun, Thermometer, Droplets, Wind, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { analyticsApi } from '../services/analyticsApi'
import { KPICardSkeleton, ChartSkeleton } from '../components/Skeleton'
import { ErrorFallback } from '../components/ErrorFallback'
import { useFilterStore } from '../store/filterStore'

export default function WeatherImpact() {
  const { globalPeriod } = useFilterStore()
  const { data, loading, error, reload } = useAnalyticsData(
    (rid) => analyticsApi.weatherImpact({ restaurant_id: rid, period: globalPeriod.preset }),
    [globalPeriod.preset],
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-48 bg-gray-50 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
        </div>
        <ChartSkeleton />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <CloudSun className="h-8 w-8 text-yellow-500" />
            Влияние Погоды
          </h1>
          <p className="text-slate-400 mt-1">Корреляции, топ товары, прогноз</p>
        </div>
      </div>

      {/* Correlation Cards */}
      {data.correlations && (() => {
        const corrArray = Array.isArray(data.correlations) ? data.correlations : [];
        const findCorr = (keyword: string) => {
          const found = corrArray.find((c: any) =>
            (c.factor || '').toLowerCase().includes(keyword)
          );
          return found ? found.correlation : 0;
        };
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CorrelationCard
              icon={<Thermometer className="h-5 w-5 text-red-400" />}
              label="Температура"
              correlation={findCorr('температур')}
              color="red"
            />
            <CorrelationCard
              icon={<Droplets className="h-5 w-5 text-blue-400" />}
              label="Осадки"
              correlation={findCorr('осадки')}
              color="blue"
            />
            <CorrelationCard
              icon={<Wind className="h-5 w-5 text-cyan-400" />}
              label="Ветер"
              correlation={findCorr('ветер') || findCorr('wind')}
              color="cyan"
            />
            <CorrelationCard
              icon={<TrendingUp className="h-5 w-5 text-green-400" />}
              label="Влажность"
              correlation={findCorr('влажност') || findCorr('humid')}
              color="green"
            />
          </div>
        );
      })()}

      {/* Weather Impact on Orders */}
      {data.weather_groups && data.weather_groups.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Заказы по погодным условиям</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.weather_groups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="condition" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Bar dataKey="order_count" fill="#eab308" radius={[4, 4, 0, 0]} name="Кол-во заказов" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Weather-Dependent Products */}
      {data.top_products_by_weather && data.top_products_by_weather.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">🌤️ Топ товары по погоде</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.top_products_by_weather.map((group: any, gIdx: number) => (
              <div key={gIdx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                    {group.condition}
                  </span>
                </div>
                {(group.top_products || []).map((product: any, pIdx: number) => (
                  <div key={pIdx} className="flex justify-between items-center py-1">
                    <p className="text-sm text-slate-700">{product.product_name}</p>
                    <span className="text-xs text-slate-500">{product.order_count} заказов, {product.total_quantity} шт</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Forecast */}
      {data.forecast_with_weather && data.forecast_with_weather.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">🔮 Прогноз спроса с учётом погоды</h3>
          <div className="grid grid-cols-7 gap-3">
            {data.forecast_with_weather.map((day: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">{day.date?.slice(5) || ''}</p>
                <p className="text-2xl my-2">{day.precipitation > 2 ? '🌧️' : day.temperature < 0 ? '❄️' : day.temperature > 25 ? '☀️' : '🌤️'}</p>
                <p className="text-sm text-slate-800 font-semibold">{day.orders} заказов</p>
                <p className="text-xs text-slate-500">{day.revenue?.toLocaleString('ru-RU') || 0} ₸</p>
                <p className="text-xs text-slate-400 mt-1">{day.temperature}°C</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Рекомендации</h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="text-slate-500 text-sm flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CorrelationCard({ icon, label, correlation, color }: {
  icon: React.ReactNode
  label: string
  correlation: number
  color: string
}) {
  const bgColor = `bg-${color}-600/20`
  const textColor = `text-${color}-400`
  const value = correlation ? (correlation * 100).toFixed(0) : '0'
  const sign = correlation >= 0 ? '+' : ''

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-100`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>{icon}</div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${textColor}`}>{sign}{value}%</p>
      <p className="text-xs text-slate-400 mt-1">Корреляция с заказами</p>
    </div>
  )
}
