import { labelOf, formatMoney } from './people'

/**
 * Build a paste-ready WhatsApp summary of the trip settlement.
 * Totals are in EUR (the base currency); the settle-up balances and transfers
 * are shown in ₪ at the current rate.
 *
 * @param {object} settlement  result of calculateSettlements
 * @param {number} rate        ILS per EUR (current rate)
 */
export function buildWhatsAppSummary(settlement, rate = 3.38) {
  const { total, perPerson, transfers } = settlement
  const ils = (v) => formatMoney((v || 0) * rate, 'ILS')
  const lines = []

  lines.push('💸 *סיכום חשבון הטיול* 💸')
  lines.push(`סה"כ הוצאות: ${formatMoney(total)}`)
  lines.push(`שער סגירה: €1 = ₪${rate.toFixed(2)}`)
  lines.push('')

  lines.push('*מאזן לכל אחד (בש"ח):*')
  for (const [name, p] of Object.entries(perPerson)) {
    const net = p.net
    const emoji = net > 0.001 ? '🟢' : net < -0.001 ? '🔴' : '⚪'
    const txt =
      net > 0.001
        ? `מקבל ${ils(net)}`
        : net < -0.001
          ? `חייב ${ils(-net)}`
          : 'מאוזן'
    lines.push(`${emoji} ${labelOf(name)}: ${txt}`)
  }
  lines.push('')

  lines.push('*העברות לסגירת החשבון (בש"ח):*')
  if (transfers.length === 0) {
    lines.push('הכל מאוזן, אין מה להעביר! 🎉')
  } else {
    for (const t of transfers) {
      lines.push(`➡️ ${labelOf(t.from)} ← ${labelOf(t.to)}: ${ils(t.amount)}`)
    }
  }
  lines.push('')
  lines.push('— נשלח מ-SplitWize')

  return lines.join('\n')
}

/** Open WhatsApp (or the share sheet) with the summary pre-filled. */
export function shareToWhatsApp(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener')
}
