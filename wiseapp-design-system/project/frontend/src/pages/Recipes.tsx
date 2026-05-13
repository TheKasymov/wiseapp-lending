import { useState } from 'react'
import { BookOpen, Plus, ChevronRight, Package, Info, X } from 'lucide-react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { inventoryApi } from '../services/inventoryApi'

export default function Recipes() {
  const { data, loading, refetch } = useAnalyticsData((restaurantId) => inventoryApi.recipes(restaurantId), 'recipes')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', product_name: '', ingredients: [{ name: '', quantity: 1, unit: 'г' }] })
  const [expanded, setExpanded] = useState<string | null>(null)

  const recipes = data?.items || data?.recipes || data || []

  const addIngredient = () => setForm({...form, ingredients: [...form.ingredients, { name: '', quantity: 1, unit: 'г' }]})

  const handleCreate = async () => {
    try {
      await inventoryApi.createRecipe(form)
      setShowForm(false)
      setForm({ name: '', product_name: '', ingredients: [{ name: '', quantity: 1, unit: 'г' }] })
      refetch()
    } catch (e) { console.error(e) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Техкарты</h1>
          <p className="text-gray-500 mt-1">Управление рецептами и составом блюд</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Новая техкарта
        </button>
      </div>

      {Array.isArray(recipes) && recipes.length > 0 ? (
        <div className="space-y-3">
          {recipes.map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><BookOpen className="w-5 h-5" /></div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-sm text-gray-500">{r.product_name || 'Без привязки к продукту'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-sm">{r.ingredients?.length || 0} ингредиентов</span>
                  <ChevronRight className={`w-5 h-5 transition-transform ${expanded === r.id ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expanded === r.id && r.ingredients && (
                <div className="px-6 pb-4 border-t border-gray-100">
                  <table className="w-full text-sm mt-3">
                    <thead className="text-gray-500 text-xs uppercase">
                      <tr><th className="text-left py-2">Ингредиент</th><th className="text-right py-2">Кол-во</th><th className="text-left py-2 pl-3">Ед.</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {r.ingredients.map((ing: any, i: number) => (
                        <tr key={i}><td className="py-2 text-gray-900">{ing.name}</td><td className="py-2 text-right">{ing.quantity}</td><td className="py-2 pl-3 text-gray-500">{ing.unit}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-lg">Техкарты не созданы</p>
          <p className="text-gray-400 text-sm mt-1">Создайте первую техкарту для отслеживания расхода ингредиентов</p>
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Новая техкарта</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название техкарты</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Капучино 300мл" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Продукт из меню</label>
                <input value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})}
                  placeholder="Капучино" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ингредиенты</label>
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={ing.name} onChange={e => { const ings = [...form.ingredients]; ings[i].name = e.target.value; setForm({...form, ingredients: ings}) }}
                      placeholder="Молоко" className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm" />
                    <input type="number" value={ing.quantity} onChange={e => { const ings = [...form.ingredients]; ings[i].quantity = +e.target.value; setForm({...form, ingredients: ings}) }}
                      className="w-20 border border-gray-300 rounded-xl px-3 py-2 text-sm" />
                    <select value={ing.unit} onChange={e => { const ings = [...form.ingredients]; ings[i].unit = e.target.value; setForm({...form, ingredients: ings}) }}
                      className="w-20 border border-gray-300 rounded-xl px-3 py-2 text-sm">
                      <option>г</option><option>мл</option><option>шт</option><option>кг</option><option>л</option>
                    </select>
                  </div>
                ))}
                <button onClick={addIngredient} className="text-sm text-indigo-500 hover:text-indigo-700 font-medium">+ Добавить ингредиент</button>
              </div>
              <button onClick={handleCreate} className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition">Создать техкарту</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
