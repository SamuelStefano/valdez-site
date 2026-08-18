import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseReady } from '../lib/supabase'
import { useSession, signInWithDiscord, signOut } from '../lib/auth'
import { PLANS, LIFETIME, FOUNDER_PRICE } from '../lib/plans'

interface Guild {
  guild_id: string
  name: string | null
  icon_url: string | null
  plan: string | null
  status: string | null
  expires_at: string | null
}

interface Checkout {
  paymentUrl: string | null
  brCode: string | null
  qrCodeImage: string | null
  priceCents: number
  founder: boolean
}

const INVITE = 'https://discord.com/oauth2/authorize?client_id=1365865955925819546&permissions=8&scope=bot%20applications.commands'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link to="/" className="text-sm text-white/50 hover:text-white">
        ← Voltar
      </Link>
      {children}
    </div>
  )
}

export default function Assinar() {
  const { session, ready } = useSession()
  const [guilds, setGuilds] = useState<Guild[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<Checkout | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !session) {
      setGuilds(null)
      return
    }
    let alive = true
    void supabase.rpc('my_guilds').then(({ data, error }) => {
      if (!alive) return
      if (error) setError('Não consegui listar seus servidores.')
      else setGuilds((data ?? []) as Guild[])
    })
    return () => {
      alive = false
    }
  }, [session])

  async function start(plan: string) {
    if (!supabase || !selected) return
    setBusy(plan)
    setError(null)
    try {
      const { data, error } = await supabase.functions.invoke('valdez-checkout', {
        body: { guildId: selected, plan },
      })
      if (error) throw error
      setCheckout(data as Checkout)
    } catch {
      setError('Não consegui abrir a cobrança. Tenta de novo em instantes.')
    } finally {
      setBusy(null)
    }
  }

  if (!supabaseReady) {
    return (
      <Shell>
        <h1 className="mt-6 text-3xl font-bold">Assinar</h1>
        <p className="mt-4 text-white/60">Pagamento ainda não está configurado.</p>
      </Shell>
    )
  }

  if (!ready) {
    return (
      <Shell>
        <p className="mt-10 text-white/50">Carregando…</p>
      </Shell>
    )
  }

  if (!session) {
    return (
      <Shell>
        <h1 className="mt-6 text-3xl font-bold">Assinar o Valdez</h1>
        <p className="mt-3 text-white/60">
          Entre com o Discord pra eu saber quais servidores são seus. Só o dono do servidor pode
          assinar — nunca cobramos por membro.
        </p>
        <button
          onClick={() => void signInWithDiscord('/assinar')}
          className="mt-7 rounded-xl bg-[#5865f2] px-6 py-3 font-semibold text-white transition hover:brightness-110"
        >
          Entrar com Discord
        </button>
      </Shell>
    )
  }

  if (checkout) {
    return (
      <Shell>
        <h1 className="mt-6 text-3xl font-bold">Falta só pagar</h1>
        <p className="mt-3 text-white/60">
          Assim que o Pix cair, o plano liga sozinho no seu servidor. Costuma levar menos de um
          minuto.
        </p>
        {checkout.qrCodeImage && (
          <img
            src={checkout.qrCodeImage}
            alt="QR Code do Pix"
            className="mt-7 w-56 rounded-xl bg-white p-3"
          />
        )}
        {checkout.brCode && (
          <div className="mt-5">
            <p className="mb-2 text-sm text-white/50">Ou copie o código Pix:</p>
            <code className="block max-w-full overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/70">
              {checkout.brCode}
            </code>
          </div>
        )}
        {checkout.paymentUrl && (
          <a
            href={checkout.paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white"
          >
            Abrir página de pagamento
          </a>
        )}
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assinar o Valdez</h1>
        <button onClick={() => void signOut()} className="text-sm text-white/40 hover:text-white">
          Sair
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <h2 className="mt-9 mb-3 text-lg font-semibold">1. Escolha o servidor</h2>
      {guilds === null ? (
        <p className="text-white/50">Carregando seus servidores…</p>
      ) : guilds.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-white/60">
            Não achei nenhum servidor seu com o Valdez dentro. Convide o bot primeiro — o plano
            grátis não pede cartão.
          </p>
          <a
            href={INVITE}
            className="mt-4 inline-block rounded-lg bg-[#5865f2] px-5 py-2.5 text-sm font-semibold"
          >
            Adicionar ao meu servidor
          </a>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {guilds.map((g) => {
            const on = selected === g.guild_id
            const paying = g.status === 'active' && g.plan !== 'owner'
            return (
              <button
                key={g.guild_id}
                onClick={() => setSelected(g.guild_id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                  on ? 'border-accent bg-accent/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                {g.icon_url ? (
                  <img src={g.icon_url} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                )}
                <div className="min-w-0">
                  <div className="truncate font-semibold">{g.name ?? g.guild_id}</div>
                  <div className="text-xs text-white/45">
                    {paying ? `Já está no ${g.plan}` : 'No grátis'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <h2 className="mt-10 mb-3 text-lg font-semibold">2. Escolha o plano</h2>
      <div className="grid gap-3">
        {[...PLANS, { id: 'lifetime', label: LIFETIME.label, price: LIFETIME.price, tagline: LIFETIME.tagline }].map(
          (p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div>
                <div className="font-semibold">{p.label}</div>
                <div className="text-sm text-white/50">{p.tagline}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono text-lg font-bold">R$ {p.price}</div>
                  <div className="text-[11px] text-white/40">
                    {p.id === 'lifetime' ? 'uma vez' : '/mês'}
                  </div>
                </div>
                <button
                  disabled={!selected || busy !== null}
                  onClick={() => void start(p.id)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {busy === p.id ? '…' : 'Assinar'}
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <p className="mt-6 text-sm text-white/40">
        Enquanto houver vaga de fundador, qualquer plano mensal sai por R$ {FOUNDER_PRICE} e o preço
        fica travado enquanto você não cancelar.
      </p>
    </Shell>
  )
}
