import { useState } from 'react'
import { Banknote, CreditCard, Plus, Users, Check } from 'lucide-react'
import { PEOPLE, PEOPLE_NAMES, labelOf, colorOf, currencySymbol } from '../lib/people'

/** Local datetime string (YYYY-MM-DDTHH:mm) for the datetime-local input. */
function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function AddExpenseForm({ onAdd }) {
  const [paidBy, setPaidBy] = useState(PEOPLE[0].name)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
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
    setCurrency('EUR')
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
        currency,
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
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50"
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
        <Plus className="h-5 w-5 text-cyan-600" />
        הוצאה חדשה
      </h2>

      {/* Amount — the headline field */}
      <div className="relative mb-1.5">
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
          {currencySymbol(currency)}
        </span>
        <input
          inputMode="decimal"
          dir="ltr"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="tabular w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pr-12 pl-28 text-left text-3xl font-bold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
        />
        {/* Currency toggle — EUR is the default */}
        <div className="absolute left-2 top-1/2 flex -translate-y-1/2 gap-0.5 rounded-xl bg-slate-100 p-0.5">
          {['EUR', 'ILS'].map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCurrency(c)}
              aria-label={c === 'EUR' ? 'אירו' : 'שקל'}
              className={`rounded-lg px-3 py-1.5 text-lg font-bold transition ${
                currency === c ? 'bg-white text-slate-900 shadow' : 'text-slate-400'
              }`}
            >
              {currencySymbol(c)}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        {currency === 'ILS'
          ? 'נרשם בשקלים · יחושב לאיחוד החשבון לפי השער הנוכחי'
          : 'ברירת מחדל: אירו'}
      </p>

      {/* Payer + method row */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">מי שילם</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 outline-none focus:border-cyan-500"
          >
            {PEOPLE.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">אמצעי תשלום</label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
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
        <label className="mb-1.5 block text-sm font-medium text-slate-600">תיאור (לא חובה)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ארוחת ערב, דלק, מלון…"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 outline-none focus:border-cyan-500"
        />
      </div>

      {/* Split between */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Users className="h-4 w-4" />
            מתחלקים ({split.size})
          </label>
          <div className="flex gap-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSplit(new Set(PEOPLE_NAMES))}
              className="text-cyan-600 hover:text-cyan-700"
            >
              בחר הכל
            </button>
            <button
              type="button"
              onClick={() => setSplit(new Set())}
              className="text-slate-500 hover:text-slate-700"
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
                    ? 'border-transparent text-slate-900'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
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
        <label className="mb-1.5 block text-sm font-medium text-slate-600">תאריך ושעה</label>
        <input
          type="datetime-local"
          dir="ltr"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="tabular w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-left text-slate-900 outline-none focus:border-cyan-500"
        />
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-gradient-to-l from-cyan-500 to-indigo-500 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-500/30 transition active:scale-[0.98] disabled:opacity-60"
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
        active ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
