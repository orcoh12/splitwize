/**
 * settlements.js — pure, unit-testable expense math.
 *
 * The headline export is `calculateSettlements(expenses)`, which turns a list
 * of raw expense rows into everything the dashboard needs: per-person totals,
 * net balances, and the *minimum* set of transfers needed to settle up.
 *
 * Expense row shape (matches the Supabase schema):
 *   {
 *     paid_by:        string,        // person name
 *     amount:         number,        // total paid
 *     payment_method: 'cash'|'credit',
 *     split_between:  string[],      // people sharing this expense
 *   }
 *
 * All money is computed in integer "agorot" (×100) internally to dodge
 * floating-point drift, then rounded back to 2 decimals on the way out.
 */

const toCents = (n) => Math.round(Number(n || 0) * 100)
const toMoney = (cents) => Math.round(cents) / 100

/**
 * Greedy debt minimization: repeatedly settle the biggest creditor against
 * the biggest debtor. Produces a near-minimal number of transfers (optimal
 * for the common cases on a trip; the exact problem is NP-hard, greedy is the
 * standard practical choice).
 *
 * @param {Object<string, number>} balancesCents  net balance per person, in cents
 *        (positive = is owed money, negative = owes money)
 * @returns {{from: string, to: string, amount: number}[]}
 */
export function minimizeTransfers(balancesCents) {
  const creditors = [] // owed money  (net > 0)
  const debtors = [] // owe money   (net < 0)

  for (const [name, cents] of Object.entries(balancesCents)) {
    if (cents > 0) creditors.push({ name, cents })
    else if (cents < 0) debtors.push({ name, cents: -cents })
  }

  // Stable, deterministic ordering: biggest first, then by name.
  const bySize = (a, b) => b.cents - a.cents || a.name.localeCompare(b.name)
  creditors.sort(bySize)
  debtors.sort(bySize)

  const transfers = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const pay = Math.min(debtor.cents, creditor.cents)

    if (pay > 0) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: toMoney(pay),
      })
    }

    debtor.cents -= pay
    creditor.cents -= pay
    if (debtor.cents <= 0) i++
    if (creditor.cents <= 0) j++
  }

  return transfers
}

/**
 * Compute per-person paid / share / net for a set of expenses.
 * @returns {{
 *   perPerson: Object<string,{paid:number,paidCash:number,paidCredit:number,share:number,net:number}>,
 *   balancesCents: Object<string,number>,
 *   total: number
 * }}
 */
function tally(expenses, people) {
  const perPerson = {}
  for (const name of people) {
    perPerson[name] = {
      paid: 0,
      paidCash: 0,
      paidCredit: 0,
      share: 0,
      net: 0,
    }
  }

  let totalCents = 0

  for (const e of expenses) {
    const amountCents = toCents(e.amount)
    if (amountCents <= 0) continue
    totalCents += amountCents

    // Payer's contribution
    if (!perPerson[e.paid_by]) {
      perPerson[e.paid_by] = { paid: 0, paidCash: 0, paidCredit: 0, share: 0, net: 0 }
    }
    perPerson[e.paid_by].paid += amountCents
    if (e.payment_method === 'credit') perPerson[e.paid_by].paidCredit += amountCents
    else perPerson[e.paid_by].paidCash += amountCents

    // Split the cost across participants. We distribute the integer remainder
    // one agora at a time so the parts sum *exactly* to the total.
    const participants = (e.split_between && e.split_between.length
      ? e.split_between
      : [e.paid_by]
    ).slice()
    const base = Math.floor(amountCents / participants.length)
    let remainder = amountCents - base * participants.length
    for (const name of participants) {
      if (!perPerson[name]) {
        perPerson[name] = { paid: 0, paidCash: 0, paidCredit: 0, share: 0, net: 0 }
      }
      let s = base
      if (remainder > 0) {
        s += 1
        remainder -= 1
      }
      perPerson[name].share += s
    }
  }

  const balancesCents = {}
  for (const [name, p] of Object.entries(perPerson)) {
    p.net = p.paid - p.share
    balancesCents[name] = p.net
    // Convert the working cents fields to money for the returned object.
    p.paid = toMoney(p.paid)
    p.paidCash = toMoney(p.paidCash)
    p.paidCredit = toMoney(p.paidCredit)
    p.share = toMoney(p.share)
    p.net = toMoney(p.net)
  }

  return { perPerson, balancesCents, total: toMoney(totalCents) }
}

/**
 * Main entry point.
 *
 * @param {Array} expenses               raw expense rows
 * @param {Object} [opts]
 * @param {string[]} [opts.people]       the fixed roster (so people with no
 *                                       activity still appear). Defaults to the
 *                                       distinct names found in the expenses.
 * @returns {{
 *   people: string[],
 *   total: number,
 *   perPerson: Object,
 *   transfers: {from:string,to:string,amount:number}[],
 *   byMethod: { cash: object, credit: object }
 * }}
 */
export function calculateSettlements(expenses = [], opts = {}) {
  // Determine roster.
  const found = new Set()
  for (const e of expenses) {
    if (e.paid_by) found.add(e.paid_by)
    for (const n of e.split_between || []) found.add(n)
  }
  const people = opts.people && opts.people.length ? opts.people : [...found]

  const combined = tally(expenses, people)
  const transfers = minimizeTransfers({ ...combined.balancesCents })

  const cashExpenses = expenses.filter((e) => e.payment_method !== 'credit')
  const creditExpenses = expenses.filter((e) => e.payment_method === 'credit')
  const cash = tally(cashExpenses, people)
  const credit = tally(creditExpenses, people)

  return {
    people,
    total: combined.total,
    perPerson: combined.perPerson,
    transfers,
    byMethod: {
      cash: {
        total: cash.total,
        perPerson: cash.perPerson,
        transfers: minimizeTransfers({ ...cash.balancesCents }),
      },
      credit: {
        total: credit.total,
        perPerson: credit.perPerson,
        transfers: minimizeTransfers({ ...credit.balancesCents }),
      },
    },
  }
}
