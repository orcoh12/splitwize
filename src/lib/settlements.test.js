import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateSettlements, minimizeTransfers } from './settlements.js'

test('empty input → zero everything', () => {
  const r = calculateSettlements([])
  assert.equal(r.total, 0)
  assert.deepEqual(r.transfers, [])
})

test('single expense split evenly leaves payer a creditor', () => {
  const r = calculateSettlements(
    [{ paid_by: 'Or', amount: 100, payment_method: 'cash', split_between: ['Or', 'Nir'] }],
    { people: ['Or', 'Nir'] },
  )
  assert.equal(r.total, 100)
  assert.equal(r.perPerson.Or.net, 50) // paid 100, share 50
  assert.equal(r.perPerson.Nir.net, -50)
  assert.deepEqual(r.transfers, [{ from: 'Nir', to: 'Or', amount: 50 }])
})

test('balances always sum to zero', () => {
  const r = calculateSettlements([
    { paid_by: 'Or', amount: 90, payment_method: 'cash', split_between: ['Or', 'Nir', 'Jamie'] },
    { paid_by: 'Nir', amount: 30, payment_method: 'credit', split_between: ['Or', 'Nir', 'Jamie'] },
  ])
  const sum = Object.values(r.perPerson).reduce((s, p) => s + p.net, 0)
  assert.ok(Math.abs(sum) < 1e-9)
})

test('penny-perfect split of an indivisible amount', () => {
  // 100 / 3 = 33.33... — parts must sum back to exactly 100
  const r = calculateSettlements(
    [{ paid_by: 'Or', amount: 100, payment_method: 'cash', split_between: ['Or', 'Nir', 'Jamie'] }],
    { people: ['Or', 'Nir', 'Jamie'] },
  )
  const shares = Object.values(r.perPerson).reduce((s, p) => s + p.share, 0)
  assert.equal(Math.round(shares * 100) / 100, 100)
})

test('minimizeTransfers produces minimal, balanced transfers', () => {
  // Or +60, Jamie +40, Nir -50, Avishai -50  → at most 3 transfers
  const transfers = minimizeTransfers({ Or: 6000, Jamie: 4000, Nir: -5000, Avishai: -5000 })
  const received = {}
  const sent = {}
  for (const t of transfers) {
    received[t.to] = (received[t.to] || 0) + t.amount
    sent[t.from] = (sent[t.from] || 0) + t.amount
  }
  assert.equal(received.Or, 60)
  assert.equal(received.Jamie, 40)
  assert.equal(sent.Nir, 50)
  assert.equal(sent.Avishai, 50)
  assert.ok(transfers.length <= 3)
})

test('cash and credit are tallied separately in byMethod', () => {
  const r = calculateSettlements(
    [
      { paid_by: 'Or', amount: 50, payment_method: 'cash', split_between: ['Or', 'Nir'] },
      { paid_by: 'Nir', amount: 80, payment_method: 'credit', split_between: ['Or', 'Nir'] },
    ],
    { people: ['Or', 'Nir'] },
  )
  assert.equal(r.byMethod.cash.total, 50)
  assert.equal(r.byMethod.credit.total, 80)
})

test('a person sharing but never paying just owes their share', () => {
  const r = calculateSettlements(
    [{ paid_by: 'Or', amount: 120, payment_method: 'cash', split_between: ['Or', 'Nir', 'Jamie'] }],
    { people: ['Or', 'Nir', 'Jamie'] },
  )
  assert.equal(r.perPerson.Jamie.net, -40)
})
