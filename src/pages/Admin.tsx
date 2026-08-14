import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useSession, signInWithDiscord, signOut } from '../lib/auth'
import {
  brl,
  computeMetrics,
  dailySeries,
  daysAgo,
  duration,
  guildGrowth,
  pct,
  RECURRING_PLANS,
  type Feedback,
  type Guild,
  type License,
  type Metrics,
  type Snapshot,
} from '../lib/metrics'

const PLAN_LABEL: Record<string, string> = {
  trial: 'Teste',
  basic: 'Básico',
  pro: 'Pro',
  max: 'Máximo',
  lifetime: 'Vitalício',
}

const TABS = ['Visão geral', 'Servidores', 'Receita', 'Uso', 'Feedback', 'Saúde'] as const
type Tab = (typeof TABS)[number]

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={send} className="w-full max-w-sm rounded-xl border border-edge bg-panel p-8">
        <h1 className="text-xl font-bold">Painel do Valdez</h1>
        <p className="mt-2 text-sm text-white/50">Acesso restrito.</p>
        {/* Senha, não link mágico: o SMTP nativo do Supabase corta em 2 e-mails
            por hora e trancava o dono do painel do lado de fora. */}
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="mt-6 w-full rounded-lg border border-edge bg-ink px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="senha"
          className="mt-3 w-full rounded-lg border border-edge bg-ink px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <button
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => void signInWithDiscord('/admin')}
          className="mt-3 w-full rounded-lg border border-edge px-4 py-3 text-sm font-semibold text-body transition hover:border-[#5865f2]"
        >
          Entrar com Discord
        </button>
        <Link to="/" className="mt-6 block text-center text-xs text-white/40 hover:text-white">
          ← Voltar para o site
        </Link>
      </form>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-edge bg-panel p-5 ${className}`}>{children}</div>
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'bad' | 'warn'
}) {
  const color =
    tone === 'good' ? 'text-green-400' : tone === 'bad' ? 'text-red-400' : tone === 'warn' ? 'text-amber-400' : ''
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </Card>
  )
}

function Bars({
  title,
  data,
  color = 'bg-accent/70',
  format = (n: number) => String(n),
}: {
  title: string
  data: { label: string; n: number }[]
  color?: string
  format?: (n: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.n))
  const step = Math.ceil(data.length / 8)
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-white/40">{title}</p>
      <div className="mt-4 flex h-36 items-end gap-1">
        {data.map((d, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-t transition group-hover:brightness-150 ${color}`}
              style={{ height: `${Math.max(2, (d.n / max) * 100)}%` }}
            />
            <span className="text-[10px] text-white/30">
              {i % step === 0 ? d.label.slice(0, 5) : ''}
            </span>
            <span className="pointer-events-none absolute -top-7 z-10 rounded border border-edge bg-ink px-2 py-1 text-[11px] whitespace-nowrap opacity-0 transition group-hover:opacity-100">
              {d.label}: {format(d.n)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PlanMix({ mix }: { mix: Metrics['planMix'] }) {
  const total = Math.max(1, mix.reduce((s, m) => s + m.n, 0))
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-white/40">Distribuição de planos</p>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-ink">
        {mix.map((m) => (
          <div
            key={m.plan}
            className={
              m.plan === 'trial'
                ? 'bg-white/25'
                : m.plan === 'lifetime'
                  ? 'bg-[#5865f2]'
                  : m.plan === 'max'
                    ? 'bg-accent'
                    : m.plan === 'pro'
                      ? 'bg-accent/70'
                      : 'bg-accent/40'
            }
            style={{ width: `${(m.n / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        {mix.map((m) => (
          <div key={m.plan} className="flex items-center justify-between">
            <span className="text-white/60">{PLAN_LABEL[m.plan]}</span>
            <span>
              {m.n}
              {m.mrr > 0 && <span className="ml-2 text-white/40">{brl(m.mrr)}/mês</span>}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Funnel({ m }: { m: Metrics }) {
  const installed = m.activeGuilds.length + m.expired.length
  const steps = [
    ['Instalaram o bot', installed],
    ['Teste ativo agora', m.trials.length],
    ['Viraram pagante', m.paying.length + m.lifetime.length],
  ] as const
  const max = Math.max(1, ...steps.map((s) => s[1]))
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-white/40">Funil</p>
      <div className="mt-4 grid gap-3">
        {steps.map(([label, n]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-white/60">{label}</span>
              <span className="font-semibold">{n}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-white/40">
        Conversão teste → pago: {m.conversion === null ? '—' : pct(m.conversion)}
      </p>
    </Card>
  )
}

type SortKey = 'name' | 'members' | 'plan' | 'clips' | 'last' | 'expires'

function Servers({ d, m }: { d: Snapshot; m: Metrics }) {
  const [query, setQuery] = useState('')
  const [only, setOnly] = useState<'todos' | 'pagando' | 'teste' | 'risco'>('todos')
  const [sort, setSort] = useState<SortKey>('clips')

  const byGuild = useMemo(() => new Map(d.licenses.map((l) => [l.guild_id, l])), [d.licenses])
  const clipsByGuild = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of d.events) {
      if (e.kind !== 'clip' && e.kind !== 'replay') continue
      map.set(e.guild_id, (map.get(e.guild_id) ?? 0) + 1)
    }
    return map
  }, [d.events])
  const atRisk = useMemo(() => new Set(m.atRisk.concat(m.neverUsed).map((g) => g.guild_id)), [m])

  const rows = useMemo(() => {
    const list = m.activeGuilds.filter((g) => {
      const l = byGuild.get(g.guild_id)
      if (query && !(g.name ?? g.guild_id).toLowerCase().includes(query.toLowerCase())) return false
      if (only === 'pagando') return l ? RECURRING_PLANS.includes(l.plan) || l.plan === 'lifetime' : false
      if (only === 'teste') return l?.plan === 'trial'
      if (only === 'risco') return atRisk.has(g.guild_id)
      return true
    })
    const value = (g: Guild) => {
      const l = byGuild.get(g.guild_id)
      switch (sort) {
        case 'name':
          return (g.name ?? '').toLowerCase()
        case 'members':
          return -(g.member_count ?? 0)
        case 'plan':
          return -(l?.price_cents ?? 0)
        case 'clips':
          return -(clipsByGuild.get(g.guild_id) ?? 0)
        case 'last':
          return daysAgo(g.last_seen_at)
        case 'expires':
          return l?.expires_at ? new Date(l.expires_at).getTime() : Infinity
      }
    }
    return [...list].sort((a, b) => (value(a) > value(b) ? 1 : value(a) < value(b) ? -1 : 0))
  }, [m.activeGuilds, byGuild, clipsByGuild, query, only, sort, atRisk])

  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      onClick={() => setSort(k)}
      className={`cursor-pointer px-4 py-3 select-none hover:text-white ${sort === k ? 'text-accent' : ''}`}
    >
      {children}
    </th>
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar servidor..."
          className="w-56 rounded-lg border border-edge bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="flex gap-1 rounded-lg border border-edge bg-panel p-1 text-sm">
          {(['todos', 'pagando', 'teste', 'risco'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOnly(f)}
              className={`rounded-md px-3 py-1.5 capitalize transition ${
                only === f ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-sm text-white/40">{rows.length} servidor(es)</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-edge bg-panel">
        <table className="w-full text-sm">
          <thead className="border-b border-edge text-left text-xs uppercase text-white/40">
            <tr>
              <Th k="name">Servidor</Th>
              <Th k="members">Membros</Th>
              <Th k="plan">Plano</Th>
              <Th k="clips">Clipes 30d</Th>
              <Th k="last">Visto</Th>
              <Th k="expires">Vence</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const l = byGuild.get(g.guild_id)
              const clips = clipsByGuild.get(g.guild_id) ?? 0
              const seen = daysAgo(g.last_seen_at)
              return (
                <tr key={g.guild_id} className="border-b border-edge/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {atRisk.has(g.guild_id) && (
                        <span title="paga e não usa há 14 dias" className="text-amber-400">
                          ▲
                        </span>
                      )}
                      <span>{g.name ?? g.guild_id}</span>
                      {l?.founder && <span className="text-xs text-accent">fundador</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{g.member_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={l?.status === 'active' ? '' : 'text-red-400 line-through'}>
                      {PLAN_LABEL[l?.plan ?? ''] ?? '—'}
                    </span>
                    {l && l.price_cents > 0 && (
                      <span className="ml-2 text-xs text-white/40">{brl(l.price_cents)}</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${clips === 0 ? 'text-white/30' : ''}`}>{clips}</td>
                  <td className="px-4 py-3 text-white/60">
                    {seen === Infinity ? '—' : seen < 1 ? 'hoje' : `há ${Math.floor(seen)}d`}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {l?.expires_at ? new Date(l.expires_at).toLocaleDateString('pt-BR') : 'sem prazo'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Revenue({ d, m }: { d: Snapshot; m: Metrics }) {
  const names = useMemo(
    () => new Map(d.guilds.map((g) => [g.guild_id, g.name ?? g.guild_id])),
    [d.guilds],
  )
  const recent = [...d.payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at)).slice(0, 40)
  const byMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of d.payments) {
      const k = p.paid_at.slice(0, 7)
      map.set(k, (map.get(k) ?? 0) + p.amount_cents)
    }
    return [...map.entries()]
      .sort()
      .slice(-12)
      .map(([k, v]) => ({ label: k.slice(5) + '/' + k.slice(2, 4), n: v }))
  }, [d.payments])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="MRR" value={brl(m.mrr)} hint={`${m.paying.length} assinatura(s) recorrente(s)`} />
        <Kpi label="ARR" value={brl(m.arr)} hint="MRR × 12" />
        <Kpi label="Ticket médio" value={brl(m.arpa)} hint="MRR ÷ assinantes" />
        <Kpi
          label="LTV estimado"
          value={m.ltv === null ? '—' : brl(m.ltv)}
          hint={m.ltv === null ? 'precisa de churn medido' : 'ticket ÷ churn'}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Caixa total" value={brl(m.cashTotal)} hint={`${d.payments.length} pagamento(s)`} />
        <Kpi label="Caixa 30 dias" value={brl(m.cash30)} />
        <Kpi
          label="Vitalícios vendidos"
          value={String(m.lifetime.length)}
          hint={brl(m.lifetime.reduce((s, l) => s + l.price_cents, 0)) + ' de caixa único'}
        />
        <Kpi
          label="Churn 30 dias"
          value={pct(m.churnRate)}
          tone={m.churnRate > 0.05 ? 'bad' : 'good'}
          hint={`${m.churned30} servidor(es) pagante(s) saíram`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Bars title="Caixa por mês" data={byMonth} format={brl} />
        </div>
        <PlanMix mix={m.planMix} />
      </div>

      <h2 className="mt-10 mb-3 font-semibold">Pagamentos</h2>
      <div className="overflow-x-auto rounded-xl border border-edge bg-panel">
        <table className="w-full text-sm">
          <thead className="border-b border-edge text-left text-xs uppercase text-white/40">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Servidor</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-white/40">
                  Nenhum pagamento registrado.
                </td>
              </tr>
            )}
            {recent.map((p, i) => (
              <tr key={i} className="border-b border-edge/50 last:border-0">
                <td className="px-4 py-3 text-white/60">
                  {new Date(p.paid_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">{names.get(p.guild_id) ?? p.guild_id}</td>
                <td className="px-4 py-3 text-white/60">{p.method}</td>
                <td className="px-4 py-3 font-semibold">{brl(p.amount_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Usage({ d, m }: { d: Snapshot; m: Metrics }) {
  const clips = dailySeries(d.events, 30, ['clip', 'replay'])
  const music = dailySeries(d.events, 30, ['music'])
  const kinds = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of d.events) map.set(e.kind, (map.get(e.kind) ?? 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [d.events])
  const secondsClipped = d.events.reduce((s, e) => s + (e.seconds ?? 0), 0)
  const perServer = m.activeGuilds.length ? m.clips30 / m.activeGuilds.length : 0

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Clipes 30 dias" value={String(m.clips30)} hint={`${m.clips7} nos últimos 7`} />
        <Kpi label="Clipes por servidor" value={perServer.toFixed(1)} hint="média em 30 dias" />
        <Kpi label="Áudio salvo" value={duration(secondsClipped)} hint="somando todos os clipes" />
        <Kpi
          label="Servidores sem uso"
          value={String(m.atRisk.length + m.neverUsed.length)}
          tone={m.atRisk.length + m.neverUsed.length > 0 ? 'warn' : 'good'}
          hint={`${m.neverUsed.length} nunca usaram`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Bars title="Clipes por dia (30 dias)" data={clips} />
        <Bars title="Músicas por dia (30 dias)" data={music} color="bg-[#5865f2]/70" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Bars title="Servidores ativos (30 dias)" data={guildGrowth(d.guilds, 30)} color="bg-green-500/60" />
        <Card>
          <p className="text-xs uppercase tracking-wide text-white/40">Eventos por tipo (30 dias)</p>
          <div className="mt-4 grid gap-2 text-sm">
            {kinds.length === 0 && <span className="text-white/40">Nenhum evento.</span>}
            {kinds.map(([k, n]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-mono text-white/60">{k}</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {(m.atRisk.length > 0 || m.neverUsed.length > 0) && (
        <>
          <h2 className="mt-10 mb-3 font-semibold">Risco de cancelamento</h2>
          <div className="grid gap-3">
            {m.neverUsed.map((g) => (
              <Card key={g.guild_id} className="flex items-center justify-between gap-4">
                <span>{g.name ?? g.guild_id}</span>
                <span className="text-sm text-red-400">nunca usou — onboarding travou</span>
              </Card>
            ))}
            {m.atRisk.map((g) => (
              <Card key={g.guild_id} className="flex items-center justify-between gap-4">
                <span>{g.name ?? g.guild_id}</span>
                <span className="text-sm text-amber-400">paga e não usa há mais de 14 dias</span>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function FeedbackTab({ d, m }: { d: Snapshot; m: Metrics }) {
  const [minRating, setMinRating] = useState(0)
  const rows = d.feedback.filter((f) => (f.rating ?? 0) >= minRating)
  const dist = [5, 4, 3, 2, 1].map((r) => ({
    r,
    n: d.feedback.filter((f) => f.rating === r).length,
  }))
  const maxDist = Math.max(1, ...dist.map((x) => x.n))

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Nota média"
          value={m.avgRating === null ? '—' : m.avgRating.toFixed(1)}
          tone={m.avgRating !== null && m.avgRating < 4 ? 'warn' : 'good'}
          hint="de 1 a 5"
        />
        <Kpi
          label="NPS"
          value={m.nps === null ? '—' : String(Math.round(m.nps))}
          tone={m.nps !== null && m.nps < 0 ? 'bad' : 'good'}
          hint="5 promove, 4 neutro, ≤3 detrata"
        />
        <Kpi label="Mensagens" value={String(d.feedback.length)} />
        <Kpi
          label="Sem resposta"
          value={String(d.feedback.filter((f) => !f.handled).length)}
          tone={d.feedback.some((f) => !f.handled) ? 'warn' : 'good'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-white/40">Distribuição de notas</p>
          <div className="mt-4 grid gap-2">
            {dist.map((x) => (
              <div key={x.r} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-white/60">{x.r}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink">
                  <div className="h-full bg-accent" style={{ width: `${(x.n / maxDist) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-white/40">{x.n}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-3 lg:col-span-2">
          <div className="flex gap-1 rounded-lg border border-edge bg-panel p-1 text-sm">
            {[0, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setMinRating(r)}
                className={`rounded-md px-3 py-1.5 transition ${
                  minRating === r ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {r === 0 ? 'Tudo' : `${r}★ ou mais`}
              </button>
            ))}
          </div>
          {rows.length === 0 && <p className="text-sm text-white/40">Nenhum feedback ainda.</p>}
          {rows.map((f: Feedback) => (
            <Card key={f.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                <span className="text-white/70">{f.username ?? 'anônimo'}</span>
                <span>·</span>
                <span>{f.guild_name ?? '—'}</span>
                <span>·</span>
                <span>{new Date(f.created_at).toLocaleString('pt-BR')}</span>
                {f.rating && <span className="text-accent">{'★'.repeat(f.rating)}</span>}
                {!f.handled && <span className="text-amber-400">pendente</span>}
              </div>
              <p className="mt-2 text-sm text-white/80">{f.message}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}

function Health({ d, m }: { d: Snapshot; m: Metrics }) {
  const hb = d.heartbeats[0] ?? null
  // Cada batida vale 1 min. Furo na série é o bot fora do ar — é assim que dá
  // pra medir disponibilidade sem uma sonda externa.
  const expected = 24 * 60
  const last24 = d.heartbeats.filter((h) => Date.now() - new Date(h.at).getTime() < 86_400_000)
  const availability = Math.min(1, last24.length / expected)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Bot"
          value={m.online ? 'online' : 'sem sinal'}
          tone={m.online ? 'good' : 'bad'}
          hint={hb ? `último sinal ${new Date(hb.at).toLocaleTimeString('pt-BR')}` : undefined}
        />
        <Kpi
          label="No ar há"
          value={m.uptime ? duration(m.uptime) : '—'}
          hint={hb?.version ? `versão ${hb.version}` : undefined}
        />
        <Kpi
          label="Disponibilidade 24h"
          value={last24.length ? pct(availability) : '—'}
          tone={availability < 0.95 ? 'warn' : 'good'}
          hint={`${last24.length} de ${expected} batidas`}
        />
        <Kpi
          label="Em call agora"
          value={hb ? `${hb.connected}/${hb.guilds}` : '—'}
          hint={hb ? `${hb.buffering} com buffer ativo` : undefined}
        />
      </div>

      <div className="mt-4">
        <Bars
          title="Servidores em call (por hora, 24h)"
          data={(() => {
            const out: { label: string; n: number }[] = []
            for (let i = 23; i >= 0; i--) {
              const from = Date.now() - (i + 1) * 3600_000
              const to = Date.now() - i * 3600_000
              const inHour = d.heartbeats.filter((h) => {
                const t = new Date(h.at).getTime()
                return t >= from && t < to
              })
              out.push({
                label: `${new Date(to).getHours()}h`,
                n: inHour.length ? Math.max(...inHour.map((h) => h.connected)) : 0,
              })
            }
            return out
          })()}
          color="bg-green-500/60"
        />
      </div>

      <h2 className="mt-10 mb-3 font-semibold">Últimas batidas</h2>
      <div className="overflow-x-auto rounded-xl border border-edge bg-panel">
        <table className="w-full text-sm">
          <thead className="border-b border-edge text-left text-xs uppercase text-white/40">
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Servidores</th>
              <th className="px-4 py-3">Em call</th>
              <th className="px-4 py-3">Gravando</th>
              <th className="px-4 py-3">No ar há</th>
            </tr>
          </thead>
          <tbody>
            {d.heartbeats.slice(0, 20).map((h, i) => (
              <tr key={i} className="border-b border-edge/50 last:border-0">
                <td className="px-4 py-3 text-white/60">{new Date(h.at).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3">{h.guilds}</td>
                <td className="px-4 py-3">{h.connected}</td>
                <td className="px-4 py-3">{h.buffering}</td>
                <td className="px-4 py-3 text-white/60">
                  {h.uptime_seconds ? duration(h.uptime_seconds) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Overview({ d, m }: { d: Snapshot; m: Metrics }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="MRR" value={brl(m.mrr)} hint={`${m.paying.length} assinatura(s)`} />
        <Kpi label="Caixa total" value={brl(m.cashTotal)} hint={`${brl(m.cash30)} nos últimos 30d`} />
        <Kpi
          label="Servidores"
          value={String(m.activeGuilds.length)}
          hint={`+${m.newGuilds30.length} em 30d · ${m.trials.length} em teste`}
        />
        <Kpi label="Alcance" value={m.members.toLocaleString('pt-BR')} hint="membros nos servidores" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Ticket médio" value={brl(m.arpa)} />
        <Kpi
          label="Churn 30d"
          value={pct(m.churnRate)}
          tone={m.churnRate > 0.05 ? 'bad' : 'good'}
        />
        <Kpi label="Conversão teste" value={m.conversion === null ? '—' : pct(m.conversion)} />
        <Kpi
          label="Bot"
          value={m.online ? 'online' : 'sem sinal'}
          tone={m.online ? 'good' : 'bad'}
          hint={m.uptime ? `no ar há ${duration(m.uptime)}` : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Bars title="Clipes por dia (30 dias)" data={dailySeries(d.events, 30, ['clip', 'replay'])} />
        </div>
        <Funnel m={m} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Bars
            title="Servidores ativos (30 dias)"
            data={guildGrowth(d.guilds, 30)}
            color="bg-green-500/60"
          />
        </div>
        <PlanMix mix={m.planMix} />
      </div>

      {(m.atRisk.length > 0 || m.neverUsed.length > 0) && (
        <Card className="mt-4 border-amber-500/40 bg-amber-500/5">
          <p className="text-sm">
            <span className="text-amber-400">▲</span> {m.atRisk.length + m.neverUsed.length}{' '}
            servidor(es) pagam e não estão usando. Veja em <strong>Uso</strong>.
          </p>
        </Card>
      )}
    </>
  )
}

function Dashboard({ session }: { session: Session }) {
  const [d, setD] = useState<Snapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('Visão geral')
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    const sb = supabase!
    const since = new Date(Date.now() - 30 * 86400_000).toISOString()
    const [guilds, licenses, events, feedback, heartbeats, payments] = await Promise.all([
      sb.from('guilds').select('guild_id,name,member_count,owner_id,last_seen_at,joined_at,left_at'),
      sb.from('licenses').select('guild_id,plan,status,price_cents,founder,started_at,expires_at'),
      sb.from('events').select('guild_id,kind,seconds,bytes,created_at').gte('created_at', since),
      sb
        .from('feedback')
        .select('id,guild_id,guild_name,username,rating,message,handled,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      sb.from('heartbeats').select('guilds,connected,buffering,uptime_seconds,version,at').order('at', { ascending: false }).limit(1500),
      sb.from('payments').select('guild_id,amount_cents,method,paid_at'),
    ])

    const failed = [guilds, licenses, events, feedback, heartbeats, payments].find((r) => r.error)
    if (failed?.error) {
      setError(failed.error.message)
      return
    }

    setD({
      guilds: (guilds.data ?? []) as Guild[],
      licenses: (licenses.data ?? []) as License[],
      events: events.data ?? [],
      feedback: (feedback.data ?? []) as Feedback[],
      heartbeats: heartbeats.data ?? [],
      payments: payments.data ?? [],
    })
    setLoadedAt(new Date())
  }, [])

  useEffect(() => {
    void load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  const m = useMemo(() => (d ? computeMetrics(d) : null), [d])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-sm">
          Sem acesso aos dados: {error}
          <br />
          <span className="text-white/50">
            Confira se o seu usuário está em <code>valdez.admins</code> e se o schema está exposto na
            API.
          </span>
        </p>
        <Link to="/" className="mt-6 inline-block text-sm text-white/40 hover:text-white">
          ← Voltar para o site
        </Link>
      </div>
    )
  }

  if (!d || !m) return <p className="p-16 text-center text-white/40">Carregando...</p>

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-xs text-white/40 hover:text-white">
            ← Voltar para o site
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Painel do Valdez</h1>
          <p className="text-sm text-white/40">{session.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${m.online ? 'text-green-400' : 'text-red-400'}`}>
            ● bot {m.online ? 'online' : 'sem sinal'}
          </span>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-edge px-4 py-2 text-sm text-white/70 hover:text-white"
          >
            Atualizar
          </button>
          <button
            onClick={() => void signOut()}
            className="rounded-lg border border-edge px-4 py-2 text-sm text-white/70 hover:text-white"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-1 border-b border-edge">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition ${
              tab === t
                ? 'border-accent font-semibold text-white'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Visão geral' && <Overview d={d} m={m} />}
        {tab === 'Servidores' && <Servers d={d} m={m} />}
        {tab === 'Receita' && <Revenue d={d} m={m} />}
        {tab === 'Uso' && <Usage d={d} m={m} />}
        {tab === 'Feedback' && <FeedbackTab d={d} m={m} />}
        {tab === 'Saúde' && <Health d={d} m={m} />}
      </div>

      {loadedAt && (
        <p className="mt-10 text-center text-xs text-white/25">
          Atualizado às {loadedAt.toLocaleTimeString('pt-BR')} · recarrega sozinho a cada minuto
        </p>
      )}
    </div>
  )
}

export default function Admin() {
  const { session, ready } = useSession()

  if (!supabase) {
    return (
      <p className="p-16 text-center text-white/40">
        Painel não configurado — faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
      </p>
    )
  }
  if (!ready) return <p className="p-16 text-center text-white/40">Carregando...</p>
  return session ? <Dashboard session={session} /> : <Login />
}
