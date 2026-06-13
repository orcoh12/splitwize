import { useState } from 'react'
import { ArrowLeft, Share2, Copy, Check, Wallet, Sparkles } from 'lucide-react'
import PersonAvatar from './PersonAvatar'
import { labelOf, colorOf, formatMoney } from '../lib/people'
import { buildWhatsAppSummary, shareToWhatsApp } from '../lib/whatsapp'

const TABS = [
  { key: 'combined', label: 'הכל' },
  { key: 'cash', label: 'מזומן' },
  { key: 'credit', label: 'אשראי' },
]

export default function SettlementView({ settlement, onToast }) {
  const [tab, setTab] = useState('combined')
  const [copied, setCopied] = useState(false)

  const view =
    tab === 'combined'
      ? { perPerson: settlement.perPerson, transfers: settlement.transfers, total: settlement.total }
      : settlement.byMethod[tab]

  const people = Object.entries(view.perPerson).filter(
    ([, p]) => p.paid !== 0 || p.share !== 0,
  )

  const copySummary = async () => {
    const text = buildWhatsAppSummary(settlement)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onToast?.('הסיכום הועתק ✓')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onToast?.('לא ניתן להעתיק')
    }
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-slate-700 text-slate-50 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transfers — the star of the show */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          סגירת חשבון
          <span className="text-sm font-normal text-slate-500">
            ({view.transfers.length} העברות)
          </span>
        </h3>

        {view.transfers.length === 0 ? (
          <p className="rounded-xl bg-emerald-500/10 px-4 py-6 text-center font-medium text-emerald-300">
            הכל מאוזן — אין העברות 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {view.transfers.map((t, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/50 p-3"
              >
                <div className="flex items-center gap-2">
                  <PersonAvatar name={t.from} size={36} showName />
                  <ArrowLeft className="h-4 w-4 shrink-0 text-slate-500" />
                  <PersonAvatar name={t.to} size={36} showName />
                </div>
                <span
                  className="tabular shrink-0 rounded-full px-3 py-1 font-bold"
                  style={{ backgroundColor: `${colorOf(t.from)}22`, color: colorOf(t.from) }}
                >
                  {formatMoney(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={copySummary}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/60 py-3 font-semibold text-slate-200 transition hover:border-slate-600"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? 'הועתק!' : 'העתק סיכום'}
        </button>
        <button
          onClick={() => shareToWhatsApp(buildWhatsAppSummary(settlement))}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 font-bold text-slate-950 transition active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4" />
          שתף ב-WhatsApp
        </button>
      </div>

      {/* Per-person balances */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
          <Wallet className="h-5 w-5 text-indigo-400" />
          מאזן אישי
        </h3>
        <ul className="space-y-2">
          {people.map(([name, p]) => {
            const net = p.net
            const positive = net > 0.001
            const negative = net < -0.001
            return (
              <li key={name} className="rounded-2xl bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <PersonAvatar name={name} size={36} showName />
                  <span
                    className={`tabular font-bold ${
                      positive ? 'text-emerald-400' : negative ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {formatMoney(net)}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                  <span>שילם {formatMoney(p.paid)}</span>
                  <span>חלקו {formatMoney(p.share)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
