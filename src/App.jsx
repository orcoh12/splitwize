import { useEffect, useMemo, useState, useCallback } from 'react'
import { Receipt, Scale, BarChart3, Wifi, WifiOff, CloudOff } from 'lucide-react'
import AddExpenseForm from './components/AddExpenseForm'
import ExpenseFeed from './components/ExpenseFeed'
import SettlementView from './components/SettlementView'
import StatsPanel from './components/StatsPanel'
import { db, isSupabaseConfigured } from './lib/supabase'
import { calculateSettlements } from './lib/settlements'
import { PEOPLE_NAMES } from './lib/people'

const TABS = [
  { key: 'expenses', label: 'הוצאות', icon: Receipt },
  { key: 'settle', label: 'סגירת חשבון', icon: Scale },
  { key: 'stats', label: 'סטטיסטיקה', icon: BarChart3 },
]

export default function App() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('expenses')
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((message, tone = 'default') => {
    const id = crypto.randomUUID?.() ?? String(Math.random())
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const data = await db.list()
      setExpenses(data)
    } catch (err) {
      pushToast('שגיאה בטעינת הנתונים', 'error')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [pushToast])

  // Initial load + live subscription
  useEffect(() => {
    refresh()
    const unsubscribe = db.subscribe(refresh)
    return unsubscribe
  }, [refresh])

  const addExpense = async (expense) => {
    // Optimistic insert
    const optimistic = { id: `tmp-${Date.now()}`, ...expense, _optimistic: true }
    setExpenses((prev) => [optimistic, ...prev])
    try {
      await db.add(expense)
      pushToast('ההוצאה נוספה ✓')
      await refresh()
    } catch (err) {
      setExpenses((prev) => prev.filter((e) => e.id !== optimistic.id))
      pushToast('שמירה נכשלה', 'error')
      throw err
    }
  }

  const deleteExpense = async (id) => {
    const prev = expenses
    setExpenses((p) => p.filter((e) => e.id !== id))
    try {
      await db.remove(id)
      pushToast('ההוצאה נמחקה')
    } catch (err) {
      setExpenses(prev)
      pushToast('מחיקה נכשלה', 'error')
      console.error(err)
    }
  }

  const settlement = useMemo(
    () => calculateSettlements(expenses, { people: PEOPLE_NAMES }),
    [expenses],
  )

  return (
    <div dir="rtl" lang="he" className="mx-auto flex min-h-full max-w-lg flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-bl from-cyan-400 to-indigo-500 font-black text-slate-950">
              €
            </div>
            <div>
              <h1 className="text-lg font-black leading-none text-slate-50">SplitWize</h1>
              <p className="text-[11px] text-slate-500">חשבון הטיול שלנו</p>
            </div>
          </div>
          <ConnectionBadge />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-5 pb-28">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-900/60" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'expenses' && (
              <div className="space-y-5">
                <AddExpenseForm onAdd={addExpense} />
                <ExpenseFeed expenses={expenses} onDelete={deleteExpense} />
              </div>
            )}
            {tab === 'settle' && <SettlementView settlement={settlement} onToast={pushToast} />}
            {tab === 'stats' && <StatsPanel expenses={expenses} settlement={settlement} />}
          </>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-slate-800 bg-slate-950/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
        <div className="grid grid-cols-3">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition ${
                  active ? 'text-cyan-400' : 'text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto rounded-full px-5 py-2.5 text-sm font-semibold shadow-xl ${
              t.tone === 'error'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 text-slate-900'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}

function ConnectionBadge() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <span
        className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300"
        title="הנתונים נשמרים מקומית בדפדפן. הגדירו Supabase לסנכרון בין מכשירים."
      >
        <CloudOff className="h-3.5 w-3.5" />
        מקומי
      </span>
    )
  }
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
      }`}
    >
      {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {online ? 'מחובר · חי' : 'לא מחובר'}
    </span>
  )
}
