import { labelOf, formatMoney } from './people'

/**
 * Build a paste-ready WhatsApp summary of the trip settlement.
 * Plain text + emojis so it reads well in the group chat.
 */
export function buildWhatsAppSummary(settlement) {
  const { total, perPerson, transfers } = settlement
  const lines = []

  lines.push('💸 *סיכום חשבון הטיול* 💸')
  lines.push(`סה"כ הוצאות: ${formatMoney(total)}`)
  lines.push('')

  lines.push('*מאזן לכל אחד:*')
  for (const [name, p] of Object.entries(perPerson)) {
    const net = p.net
    const emoji = net > 0.001 ? '🟢' : net < -0.001 ? '🔴' : '⚪'
    const txt =
      net > 0.001
        ? `מקבל ${formatMoney(net)}`
        : net < -0.001
          ? `חייב ${formatMoney(-net)}`
          : 'מאוזן'
    lines.push(`${emoji} ${labelOf(name)}: ${txt}`)
  }
  lines.push('')

  lines.push('*העברות לסגירת החשבון:*')
  if (transfers.length === 0) {
    lines.push('הכל מאוזן, אין מה להעביר! 🎉')
  } else {
    for (const t of transfers) {
      lines.push(`➡️ ${labelOf(t.from)} ← ${labelOf(t.to)}: ${formatMoney(t.amount)}`)
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
