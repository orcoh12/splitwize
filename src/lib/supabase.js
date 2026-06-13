import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null

const TABLE = 'expenses'

/* -------------------------------------------------------------------------- */
/*  Local (offline / no-backend) fallback                                     */
/*  Lets the app run instantly without Supabase, with cross-tab live sync     */
/*  via BroadcastChannel — mirrors the realtime behaviour of the backend.     */
/* -------------------------------------------------------------------------- */
const LS_KEY = 'splitwize:expenses'
const channel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('splitwize')
    : null

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeLocal(rows) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows))
  channel?.postMessage({ type: 'change' })
}

function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
}

/* -------------------------------------------------------------------------- */
/*  Unified data API — same shape whether backed by Supabase or localStorage  */
/* -------------------------------------------------------------------------- */
export const db = {
  async list() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }
    return readLocal().sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    )
  },

  async add(expense) {
    const row = {
      paid_by: expense.paid_by,
      amount: expense.amount,
      description: expense.description || null,
      payment_method: expense.payment_method || 'cash',
      split_between: expense.split_between,
      created_at: expense.created_at || new Date().toISOString(),
    }
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const full = { id: uuid(), ...row }
    const rows = readLocal()
    rows.push(full)
    writeLocal(rows)
    return full
  },

  async remove(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
      return
    }
    writeLocal(readLocal().filter((r) => r.id !== id))
  },

  /**
   * Subscribe to live changes. Calls `onChange()` whenever data changes
   * from any source (other tabs, other devices). Returns an unsubscribe fn.
   */
  subscribe(onChange) {
    if (isSupabaseConfigured) {
      const sub = supabase
        .channel('public:expenses')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: TABLE },
          () => onChange(),
        )
        .subscribe()
      return () => supabase.removeChannel(sub)
    }
    const handler = () => onChange()
    channel?.addEventListener('message', handler)
    window.addEventListener('storage', handler)
    return () => {
      channel?.removeEventListener('message', handler)
      window.removeEventListener('storage', handler)
    }
  },
}
