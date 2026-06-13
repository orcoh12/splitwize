import { useState } from 'react'
import { Banknote, CreditCard, Plus, Users, Check } from 'lucide-react'
import { PEOPLE, PEOPLE_NAMES, labelOf, colorOf } from '../lib/people'

/** Local datetime string (YYYY-MM-DDTHH:mm) for the datetime-local input. */
function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function AddExpenseForm({ onAdd }) {
  const [paidBy, setPaidBy] = useState(PEOPLE[0].name)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [description, setDescription] = useState('')
  const [split, setSplit] = useState(() => new Set(PEOPLE_NAMES))
  const [when, setWhen] = useState(nowLocal)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const toggle = (name) => {
    setSplit((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const reset = () => {
    setAmount('')
    setDescription('')
    setSplit(new Set(PEOPLE_NAMES))
    setMethod('cash')
    setWhen(nowLocal())
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const value = parseFloat(amount)
    if (!value || value <= 0) return setError('הזינו סכום חיובי')
    if (split.size === 0) return setError('בחרו לפחות אדם אחד לחלוקה')

    setSubmitting(true)
    try {
      await onAdd({
        paid_by: paidBy,
        amount: value,
        payment_method: method,
        description: description.trim(),
        split_between: PEOPLE_NAMES.filter((n) => split.has(n)),
        created_at: new Date(when).toISOString(),
      })
      reset()
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur"
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
        <Plus className="h-5 w-5 text-cyan-400" />
        הוצאה חדשה
      </h2>

      {/* Amount — the headline field */}
      <div className="relative mb-4">
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
          €
        </span>
        <input
          inputMode="decimal"
          dir="ltr"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="tabular w-full rounded-2xl border border-slate-700 bg-slate-950/60 py-4 pr-12 pl-4 text-left text-3xl font-bold text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
        />
      </div>

      {/* Payer + method row */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-400">מי שילם</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-slate-100 outline-none focus:border-cyan-500"
          >
            {PEOPLE.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-400">אמצעי תשלום</label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-1">
            <MethodButton
              active={method === 'cash'}
              onClick={() => setMethod('cash')}
              icon={Banknote}
              label="מזומן"
            />
            <MethodButton
              active={method === 'credit'}
              onClick={() => setMethod('credit')}
              icon={CreditCard}
              label="אשראי"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-400">תיאור (לא חובה)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ארוחת ערב, דלק, מלון…"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-slate-100 outline-none focus:border-cyan-500"
        />
      </div>

      {/* Split between */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
            <Users className="h-4 w-4" />
            מתחלקים ({split.size})
          </label>
          <div className="flex gap-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSplit(new Set(PEOPLE_NAMES))}
              className="text-cyan-400 hover:text-cyan-300"
            >
              בחר הכל
            </button>
            <button
              type="button"
              onClick={() => setSplit(new Set())}
              className="text-slate-500 hover:text-slate-300"
            >
              נקה
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PEOPLE.map((p) => {
            const on = split.has(p.name)
            return (
              <button
                type="button"
                key={p.name}
                onClick={() => toggle(p.name)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  on
                    ? 'border-transparent text-slate-950'
                    : 'border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600'
                }`}
                style={on ? { backgroundColor: colorOf(p.name) } : undefined}
              >
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Date / time */}
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-400">תאריך ושעה</label>
        <input
          type="datetime-local"
          dir="ltr"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="tabular w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-left text-slate-100 outline-none focus:border-cyan-500"
        />
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-gradient-to-l from-cyan-500 to-indigo-500 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? 'שומר…' : 'הוסף הוצאה'}
      </button>
    </form>
  )
}

function MethodButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
        active ? 'bg-slate-700 text-slate-50 shadow' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
