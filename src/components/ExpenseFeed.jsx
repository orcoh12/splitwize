import { useState } from 'react'
import { Banknote, CreditCard, Trash2, Receipt } from 'lucide-react'
import PersonAvatar from './PersonAvatar'
import { labelOf, colorOf, formatMoney, PEOPLE_NAMES } from '../lib/people'

function timeAgo(iso) {
  const d = new Date(iso)
  return d.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ExpenseFeed({ expenses, onDelete }) {
  const [confirmId, setConfirmId] = useState(null)

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Receipt className="h-10 w-10 text-slate-400" />
        <p className="text-slate-500">עדיין אין הוצאות. הוסיפו את הראשונה!</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {expenses.map((e) => {
        const coversAll = (e.split_between?.length || 0) === PEOPLE_NAMES.length
        const isConfirming = confirmId === e.id
        return (
          <li
            key={e.id}
            className="animate-pop-in relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* Payer color stripe */}
            <span
              className="absolute inset-y-0 right-0 w-1.5"
              style={{ backgroundColor: colorOf(e.paid_by) }}
            />

            <div className="flex items-start gap-3 pr-2">
              <PersonAvatar name={e.paid_by} size={44} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-slate-900">
                    {labelOf(e.paid_by)}
                    {e.description && (
                      <span className="font-normal text-slate-500"> · {e.description}</span>
                    )}
                  </span>
                  <span className="tabular shrink-0 text-lg font-bold text-slate-900">
                    {formatMoney(e.amount, e.currency)}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    {e.payment_method === 'credit' ? (
                      <CreditCard className="h-3.5 w-3.5" />
                    ) : (
                      <Banknote className="h-3.5 w-3.5" />
                    )}
                    {e.payment_method === 'credit' ? 'אשראי' : 'מזומן'}
                  </span>
                  <span>·</span>
                  <span className="tabular" dir="rtl">{timeAgo(e.created_at)}</span>
                </div>

                {/* Who it covers */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {coversAll ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      כולם · {formatMoney(e.amount / e.split_between.length, e.currency)} לאחד
                    </span>
                  ) : (
                    e.split_between?.map((n) => (
                      <span
                        key={n}
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: `${colorOf(n)}26`, color: colorOf(n) }}
                      >
                        {labelOf(n)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Delete */}
              <div className="shrink-0">
                {isConfirming ? (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        onDelete(e.id)
                        setConfirmId(null)
                      }}
                      className="rounded-lg bg-rose-500 px-2 py-1 text-xs font-bold text-white"
                    >
                      מחק
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="rounded-lg bg-slate-200 px-2 py-1 text-xs text-slate-700"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(e.id)}
                    aria-label="מחק הוצאה"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
