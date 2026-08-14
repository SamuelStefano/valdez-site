import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Guild {
  guild_id: string
  name: string | null
  member_count: number | null
  last_seen_at: string | null
  joined_at: string
}

interface License {
  guild_id: string
  plan: string
  status: string
  price_cents: number
  founder: boolean
  expires_at: string | null
}

interface EventRow {
  kind: string
  created_at: string
}

interface Feedback {
  id: number
  guild_name: string | null
  username: string | null
  rating: number | null
  message: string
  created_at: string
}

interface Heartbeat {
  guilds: number
  connected: number
  buffering: number
  uptime_seconds: number | null
  at: string
}

interface Payment {
  amount_cents: number
  paid_at: string
}

interface Data {
  guilds: Guild[]
  licenses: License[]
  events: EventRow[]
  feedback: Feedback[]
  heartbeat: Heartbeat | null
  payments: Payment[]
}

const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={send} className="w-full max-w-sm rounded-xl border border-edge bg-panel p-8">
        <h1 className="text-xl font-bold">Painel do Valdez</h1>
        <p className="mt-2 text-sm text-white/50">Mandamos um link de acesso pro seu e-mail.</p>
        {sent ? (
          <p className="mt-6 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm">
            Link enviado. Abra o e-mail nesta mesma aba.
          </p>
        ) : (
          <>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="mt-6 w-full rounded-lg border border-edge bg-ink px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <button className="mt-3 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold transition hover:brightness-110">
              Entrar
            </button>
          </>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </form>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  )
}

function Chart({ events }: { events: EventRow[] }) {
  const days: { label: string; n: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      label: day(key),
      n: events.filter((e) => e.created_at.slice(0, 10) === key && (e.kind === 'clip' || e.kind === 'replay'))
        .length,
    })
  }
  const max = Math.max(1, ...days.map((d) => d.n))

  return (
    <div className="rounded-xl border border-edge bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-white/40">Clipes por dia (14 dias)</p>
      <div className="mt-4 flex h-32 items-end gap-1">
        {days.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.n}`}>
            <div
              className="w-full rounded-t bg-accent/70"
              style={{ height: `${Math.max(2, (d.n / max) * 100)}%` }}
            />
            <span className="text-[10px] text-white/30">{d.label.slice(0, 2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Dashboard({ session }: { session: Session }) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const sb = supabase!
    const since = new Date(Date.now() - 30 * 86400_000).toISOString()
    const [guilds, licenses, events, feedback, heartbeat, payments] = await Promise.all([
      sb.from('guilds').select('guild_id,name,member_count,last_seen_at,joined_at').is('left_at', null),
      sb.from('licenses').select('guild_id,plan,status,price_cents,founder,expires_at'),
      sb.from('events').select('kind,created_at').gte('created_at', since),
      sb.from('feedback').select('id,guild_name,username,rating,message,created_at').order('created_at', { ascending: false }).limit(30),
      sb.from('heartbeats').select('guilds,connected,buffering,uptime_seconds,at').order('at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('payments').select('amount_cents,paid_at'),
    ])

    const failed = [guilds, licenses, events, feedback, heartbeat, payments].find((r) => r.error)
    if (failed?.error) {
      setError(failed.error.message)
      return
    }

    setData({
      guilds: guilds.data ?? [],
      licenses: licenses.data ?? [],
      events: events.data ?? [],
      feedback: feedback.data ?? [],
      heartbeat: heartbeat.data ?? null,
      payments: payments.data ?? [],
    })
  }, [])

  useEffect(() => {
    void load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-sm">
          Sem acesso aos dados: {error}
          <br />
          <span className="text-white/50">
            Confira se o seu usuário está em <code>valdez.admins</code> e se o schema está exposto na API.
          </span>
        </p>
      </div>
    )
  }

  if (!data) return <p className="p-16 text-center text-white/40">Carregando...</p>

  const paying = data.licenses.filter((l) => l.status === 'active' && l.plan !== 'trial')
  const trial = data.licenses.filter((l) => l.status === 'active' && l.plan === 'trial')
  const mrr = paying.reduce((sum, l) => sum + l.price_cents, 0)
  const received = data.payments.reduce((sum, p) => sum + p.amount_cents, 0)
  const members = data.guilds.reduce((sum, g) => sum + (g.member_count ?? 0), 0)
  const clips = data.events.filter((e) => e.kind === 'clip' || e.kind === 'replay').length
  const hbAge = data.heartbeat ? (Date.now() - new Date(data.heartbeat.at).getTime()) / 60000 : Infinity
  const online = hbAge < 5

  const licenseByGuild = new Map(data.licenses.map((l) => [l.guild_id, l]))

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Painel do Valdez</h1>
          <p className="text-sm text-white/40">{session.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${online ? 'text-green-400' : 'text-red-400'}`}>
            ● bot {online ? 'online' : 'sem sinal'}
          </span>
          <button
            onClick={() => supabase!.auth.signOut()}
            className="rounded-lg border border-edge px-4 py-2 text-sm text-white/70 hover:text-white"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="MRR" value={brl(mrr)} hint={`${paying.length} servidor(es) pagando`} />
        <Kpi label="Já recebido" value={brl(received)} hint={`${data.payments.length} pagamento(s)`} />
        <Kpi label="Servidores" value={String(data.guilds.length)} hint={`${trial.length} em teste`} />
        <Kpi label="Alcance" value={members.toLocaleString('pt-BR')} hint="membros nos servidores" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Chart events={data.events} />
        </div>
        <div className="grid gap-4">
          <Kpi label="Clipes (30 dias)" value={String(clips)} />
          <Kpi
            label="Estabilidade"
            value={data.heartbeat ? `${data.heartbeat.connected}/${data.heartbeat.guilds} em call` : '—'}
            hint={
              data.heartbeat?.uptime_seconds
                ? `no ar há ${Math.floor(data.heartbeat.uptime_seconds / 3600)}h`
                : undefined
            }
          />
        </div>
      </div>

      <h2 className="mt-10 mb-3 font-semibold">Servidores</h2>
      <div className="overflow-x-auto rounded-xl border border-edge bg-panel">
        <table className="w-full text-sm">
          <thead className="border-b border-edge text-left text-xs uppercase text-white/40">
            <tr>
              <th className="px-4 py-3">Servidor</th>
              <th className="px-4 py-3">Membros</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Vence</th>
            </tr>
          </thead>
          <tbody>
            {data.guilds.map((g) => {
              const l = licenseByGuild.get(g.guild_id)
              return (
                <tr key={g.guild_id} className="border-b border-edge/50 last:border-0">
                  <td className="px-4 py-3">{g.name ?? g.guild_id}</td>
                  <td className="px-4 py-3 text-white/60">{g.member_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    {l?.plan ?? '—'}
                    {l?.founder && <span className="ml-2 text-xs text-accent">fundador</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={l?.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                      {l?.status ?? '—'}
                    </span>
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

      <h2 className="mt-10 mb-3 font-semibold">Feedback</h2>
      <div className="grid gap-3">
        {data.feedback.length === 0 && <p className="text-sm text-white/40">Nenhum feedback ainda.</p>}
        {data.feedback.map((f) => (
          <div key={f.id} className="rounded-xl border border-edge bg-panel p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
              <span className="text-white/70">{f.username ?? 'anônimo'}</span>
              <span>·</span>
              <span>{f.guild_name ?? '—'}</span>
              <span>·</span>
              <span>{new Date(f.created_at).toLocaleString('pt-BR')}</span>
              {f.rating && <span className="text-accent">{'★'.repeat(f.rating)}</span>}
            </div>
            <p className="mt-2 text-sm text-white/80">{f.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

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
