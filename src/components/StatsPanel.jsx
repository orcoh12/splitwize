import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, Crown, Flame, Coins } from 'lucide-react'
import { labelOf, colorOf, formatMoney } from '../lib/people'

export default function StatsPanel({ expenses, settlement }) {
  const { total, perPerson } = settlement

  const paidEntries = Object.entries(perPerson)
    .map(([name, p]) => ({ name, label: labelOf(name), paid: p.paid, color: colorOf(name) }))
    .filter((e) => e.paid > 0)
    .sort((a, b) => b.paid - a.paid)

  const top = paidEntries[0]
  const bottom = paidEntries[paidEntries.length - 1]
  const biggest = expenses.reduce(
    (max, e) => (Number(e.amount) > Number(max?.amount || 0) ? e : max),
    null,
  )

  const chartData = paidEntries.map((e) => ({ name: e.label, value: e.paid, color: e.color }))

  return (
    <div className="space-y-5">
      {/* Headline total */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-bl from-cyan-500/10 to-indigo-500/10 p-6 text-center shadow-xl">
        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl animate-glow" />
        <p className="text-sm font-medium text-slate-400">סך כל ההוצאות בטיול</p>
        <p className="tabular mt-1 text-4xl font-black text-slate-50">{formatMoney(total)}</p>
        <p className="mt-1 text-xs text-slate-500">{expenses.length} הוצאות</p>
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Crown}
          tint="#fbbf24"
          label="שילם הכי הרבה"
          value={top ? labelOf(top.name) : '—'}
          sub={top ? formatMoney(top.paid) : ''}
        />
        <StatCard
          icon={Coins}
          tint="#34d399"
          label="שילם הכי מעט"
          value={bottom && bottom !== top ? labelOf(bottom.name) : '—'}
          sub={bottom && bottom !== top ? formatMoney(bottom.paid) : ''}
        />
        <StatCard
          icon={Flame}
          tint="#fb7185"
          label="ההוצאה הגדולה"
          value={biggest ? formatMoney(biggest.amount) : '—'}
          sub={biggest ? biggest.description || labelOf(biggest.paid_by) : ''}
          wide
        />
      </div>

      {/* Per-person breakdown */}
      {chartData.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-100">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            פילוח לפי משלם
          </h3>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatMoney(v)}
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      direction: 'rtl',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend / bars */}
            <ul className="w-full flex-1 space-y-2">
              {paidEntries.map((e) => {
                const pct = total > 0 ? (e.paid / total) * 100 : 0
                return (
                  <li key={e.name}>
                    <div className="mb-0.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: e.color }}
                        />
                        <span className="text-slate-300">{e.label}</span>
                      </span>
                      <span className="tabular text-slate-400">{formatMoney(e.paid)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: e.color }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, tint, wide }) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg ${
        wide ? 'col-span-2' : ''
      }`}
    >
      <div className="mb-2 inline-flex rounded-xl p-2" style={{ backgroundColor: `${tint}1a` }}>
        <Icon className="h-5 w-5" style={{ color: tint }} />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="truncate text-lg font-bold text-slate-100">{value}</p>
      {sub && <p className="tabular truncate text-sm text-slate-400">{sub}</p>}
    </div>
  )
}
