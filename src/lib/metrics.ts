export interface Guild {
  guild_id: string
  name: string | null
  member_count: number | null
  owner_id: string | null
  last_seen_at: string | null
  joined_at: string
  left_at: string | null
}

export interface License {
  guild_id: string
  plan: string
  status: string
  price_cents: number
  founder: boolean
  started_at: string
  expires_at: string | null
}

export interface EventRow {
  guild_id: string
  kind: string
  seconds: number | null
  bytes: number | null
  created_at: string
}

export interface Feedback {
  id: number
  guild_id: string
  guild_name: string | null
  username: string | null
  rating: number | null
  message: string
  handled: boolean
  created_at: string
}

export interface Heartbeat {
  guilds: number
  connected: number
  buffering: number
  uptime_seconds: number | null
  version: string | null
  at: string
}

export interface Payment {
  guild_id: string
  amount_cents: number
  method: string
  paid_at: string
}

export interface Snapshot {
  guilds: Guild[]
  licenses: License[]
  events: EventRow[]
  feedback: Feedback[]
  heartbeats: Heartbeat[]
  payments: Payment[]
}

export const DAY = 86_400_000

// O vitalício é caixa de uma vez só. Somar ele no MRR inflaria a métrica que
// decide se este negócio se paga todo mês.
export const RECURRING_PLANS = ['basic', 'pro', 'max']

export const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const pct = (n: number) => `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`

export const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export function daysAgo(iso: string | null): number {
  if (!iso) return Infinity
  return (Date.now() - new Date(iso).getTime()) / DAY
}

export function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

export interface Metrics {
  mrr: number
  arr: number
  arpa: number
  paying: License[]
  lifetime: License[]
  trials: License[]
  expired: License[]
  cashTotal: number
  cash30: number
  churnRate: number
  churned30: number
  ltv: number | null
  conversion: number | null
  activeGuilds: Guild[]
  newGuilds30: Guild[]
  members: number
  clips30: number
  clips7: number
  atRisk: Guild[]
  neverUsed: Guild[]
  online: boolean
  uptime: number | null
  avgRating: number | null
  nps: number | null
  planMix: { plan: string; n: number; mrr: number }[]
}

export function computeMetrics(d: Snapshot): Metrics {
  const now = Date.now()
  const activeGuilds = d.guilds.filter((g) => !g.left_at)
  const byGuild = new Map(d.licenses.map((l) => [l.guild_id, l]))

  const active = d.licenses.filter((l) => l.status === 'active')
  const paying = active.filter((l) => RECURRING_PLANS.includes(l.plan))
  const lifetime = d.licenses.filter((l) => l.plan === 'lifetime')
  const trials = active.filter((l) => l.plan === 'trial')
  const expired = d.licenses.filter((l) => l.status !== 'active')

  const mrr = paying.reduce((s, l) => s + l.price_cents, 0)
  const arpa = paying.length ? mrr / paying.length : 0

  const cashTotal = d.payments.reduce((s, p) => s + p.amount_cents, 0)
  const cash30 = d.payments
    .filter((p) => now - new Date(p.paid_at).getTime() < 30 * DAY)
    .reduce((s, p) => s + p.amount_cents, 0)

  // Churn conta servidor que estava pagando e saiu. Base é quem já estava dentro
  // há 30 dias — senão uma instalação nova de ontem diluiria a conta.
  const churnedGuilds = d.guilds.filter(
    (g) => g.left_at && now - new Date(g.left_at).getTime() < 30 * DAY,
  )
  const churned30 = churnedGuilds.filter((g) =>
    RECURRING_PLANS.includes(byGuild.get(g.guild_id)?.plan ?? ''),
  ).length
  const base = paying.length + churned30
  const churnRate = base > 0 ? churned30 / base : 0
  const ltv = churnRate > 0 ? arpa / churnRate : null

  const endedTrials = expired.filter((l) => l.plan === 'trial').length
  const conversion = endedTrials + paying.length > 0 ? paying.length / (endedTrials + paying.length) : null

  const clipKinds = new Set(['clip', 'replay'])
  const clipEvents = d.events.filter((e) => clipKinds.has(e.kind))
  const clips30 = clipEvents.length
  const clips7 = clipEvents.filter((e) => now - new Date(e.created_at).getTime() < 7 * DAY).length

  const lastEventByGuild = new Map<string, number>()
  for (const e of d.events) {
    const t = new Date(e.created_at).getTime()
    if (t > (lastEventByGuild.get(e.guild_id) ?? 0)) lastEventByGuild.set(e.guild_id, t)
  }

  // Servidor que paga e não usa é o que cancela no mês seguinte. Separar de quem
  // nunca usou importa: um é resgate, o outro é onboarding quebrado.
  const usable = activeGuilds.filter((g) => RECURRING_PLANS.includes(byGuild.get(g.guild_id)?.plan ?? ''))
  const atRisk = usable.filter((g) => {
    const last = lastEventByGuild.get(g.guild_id)
    return last !== undefined && now - last > 14 * DAY
  })
  const neverUsed = usable.filter((g) => !lastEventByGuild.has(g.guild_id))

  const hb = d.heartbeats[0] ?? null
  const online = hb ? now - new Date(hb.at).getTime() < 5 * 60_000 : false

  const rated = d.feedback.filter((f) => f.rating !== null)
  const avgRating = rated.length ? rated.reduce((s, f) => s + (f.rating ?? 0), 0) / rated.length : null
  // NPS adaptado da escala 1–5: 5 promove, 4 é neutro, 3 ou menos detrata.
  const nps = rated.length
    ? ((rated.filter((f) => (f.rating ?? 0) === 5).length -
        rated.filter((f) => (f.rating ?? 0) <= 3).length) /
        rated.length) *
      100
    : null

  const planMix = ['trial', ...RECURRING_PLANS, 'lifetime'].map((plan) => {
    const rows = active.filter((l) => l.plan === plan)
    return {
      plan,
      n: rows.length,
      mrr: RECURRING_PLANS.includes(plan) ? rows.reduce((s, l) => s + l.price_cents, 0) : 0,
    }
  })

  return {
    mrr,
    arr: mrr * 12,
    arpa,
    paying,
    lifetime,
    trials,
    expired,
    cashTotal,
    cash30,
    churnRate,
    churned30,
    ltv,
    conversion,
    activeGuilds,
    newGuilds30: activeGuilds.filter((g) => now - new Date(g.joined_at).getTime() < 30 * DAY),
    members: activeGuilds.reduce((s, g) => s + (g.member_count ?? 0), 0),
    clips30,
    clips7,
    atRisk,
    neverUsed,
    online,
    uptime: hb?.uptime_seconds ?? null,
    avgRating,
    nps,
    planMix,
  }
}

export function dailySeries(events: EventRow[], days: number, kinds: string[]) {
  const wanted = new Set(kinds)
  const out: { key: string; label: string; n: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = d.toISOString().slice(0, 10)
    out.push({
      key,
      label: shortDay(key),
      n: events.filter((e) => wanted.has(e.kind) && e.created_at.slice(0, 10) === key).length,
    })
  }
  return out
}

// Curva acumulada de servidores: entra em joined_at, sai em left_at. É a única
// série histórica que dá pra montar sem uma tabela de snapshot diária.
export function guildGrowth(guilds: Guild[], days: number) {
  const out: { label: string; n: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const at = Date.now() - i * DAY
    const n = guilds.filter(
      (g) =>
        new Date(g.joined_at).getTime() <= at && (!g.left_at || new Date(g.left_at).getTime() > at),
    ).length
    out.push({ label: shortDay(new Date(at).toISOString()), n })
  }
  return out
}
