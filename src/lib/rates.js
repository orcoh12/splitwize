/**
 * Live EUR→ILS exchange rate, used to display settlement transfers in shekels.
 *
 * The whole ledger is kept in EUR (the base/default currency). Expenses entered
 * in ILS are converted to EUR for the math, and the final settlement transfers
 * are converted back to ILS at the *current* rate for display.
 *
 * Safety: if every network source fails we fall back to a recent constant so
 * the app never breaks — `live: false` lets the UI flag that it's approximate.
 */

// Recent EUR→ILS (ECB, mid-2026). Only used if all live sources are unreachable.
export const FALLBACK_EUR_ILS = 3.38

const SOURCES = [
  {
    url: 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=ILS',
    pick: (d) => d?.rates?.ILS,
    date: (d) => d?.date,
  },
  {
    url: 'https://open.er-api.com/v6/latest/EUR',
    pick: (d) => d?.rates?.ILS,
    date: (d) => d?.time_last_update_utc,
  },
]

/**
 * @returns {Promise<{rate:number, date:(string|null), live:boolean}>}
 *          rate = ILS per 1 EUR
 */
export async function fetchEurIls() {
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, { signal: AbortSignal.timeout?.(6000) })
      if (!res.ok) continue
      const data = await res.json()
      const rate = src.pick(data)
      if (typeof rate === 'number' && rate > 0) {
        return { rate, date: src.date(data) || null, live: true }
      }
    } catch {
      // try next source
    }
  }
  return { rate: FALLBACK_EUR_ILS, date: null, live: false }
}
