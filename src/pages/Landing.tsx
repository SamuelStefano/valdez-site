import { Link } from 'react-router-dom'
import { PLANS, TRIAL_DAYS, FOUNDER_PRICE, FOUNDER_SLOTS } from '../lib/plans'

// client_id é público por definição. As permissões são o mínimo que o bot usa:
// ver canal, mandar mensagem, anexar arquivo, entrar/falar na call e mudar o
// próprio apelido (o [REC] de consentimento).
const DEFAULT_INVITE =
  'https://discord.com/oauth2/authorize?client_id=1365865955925819546&permissions=70306816&scope=bot%20applications.commands'

const INVITE_URL = (import.meta.env.VITE_INVITE_URL as string | undefined) ?? DEFAULT_INVITE
const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL as string | undefined

function Cta({ className = '' }: { className?: string }) {
  if (!INVITE_URL) {
    return (
      <span className={`inline-block rounded-lg bg-edge px-6 py-3 font-semibold text-white/50 ${className}`}>
        Convite em breve
      </span>
    )
  }
  return (
    <a
      href={INVITE_URL}
      target="_blank"
      rel="noreferrer"
      className={`inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:brightness-110 ${className}`}
    >
      Adicionar ao meu servidor
    </a>
  )
}

const STEPS = [
  {
    title: 'Você adiciona o Valdez',
    body: 'Um clique. Ele entra na call sozinho quando alguém chega e sai quando esvazia.',
  },
  {
    title: 'Ele fica com o [REC] no nome',
    body: 'Ninguém é gravado sem saber. Quem não quiser aparecer usa /privacidade optout e some do buffer.',
  },
  {
    title: 'Alguém fala uma pérola',
    body: 'Você manda /clip 2min. O áudio dos últimos 2 minutos vira um arquivo no canal — e fica lá pra sempre.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-ink/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight">
            Valdez<span className="text-accent">.</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-white/70">
            <a href="#como-funciona" className="hover:text-white">
              Como funciona
            </a>
            <a href="#planos" className="hover:text-white">
              Planos
            </a>
            {INVITE_URL && (
              <a
                href={INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-accent px-4 py-2 font-semibold text-white transition hover:brightness-110"
              >
                Adicionar
              </a>
            )}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-5 pt-20 pb-16 text-center">
        <p className="mb-4 inline-block rounded-full border border-edge px-4 py-1 text-xs text-white/60">
          {TRIAL_DAYS} dias grátis · sem cartão
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          A melhor frase da call
          <br />
          <span className="text-accent">não pode morrer na call.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          O Valdez fica junto com vocês no canal de voz guardando os últimos minutos de áudio. Quando alguém
          solta uma pérola, um comando salva o momento no seu servidor — pra sempre.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Cta />
          <a href="#planos" className="rounded-lg border border-edge px-6 py-3 font-semibold text-white/80 hover:text-white">
            Ver planos
          </a>
        </div>
        <p className="mt-4 text-sm text-white/40">Funciona com música também. Sem fila paga, sem anúncio.</p>
      </section>

      <section id="como-funciona" className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Como funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-edge bg-panel p-6">
              <span className="text-sm font-bold text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="rounded-xl border border-edge bg-panel p-8">
          <h2 className="text-2xl font-bold">Por que eu fiz esse bot</h2>
          <p className="mt-4 leading-relaxed text-white/70">
            Eu jogo com os mesmos amigos há anos e toda semana alguém fala uma coisa absurda que a gente ia
            querer ouvir de novo. Procurei um bot que gravasse a call e só achei coisa cara, complicada ou que
            exigia baixar arquivo de site nenhum. Fiz o Valdez pro meu servidor. Aí os amigos dos amigos
            começaram a pedir — e aqui está ele.
          </p>
          <p className="mt-4 leading-relaxed text-white/70">
            A música veio junto porque os bons bots de música viraram pagos ou pararam de funcionar. Está tudo
            no mesmo bot, no mesmo preço.
          </p>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Preço por servidor, não por pessoa</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
          Quem paga é o dono do servidor. Todo mundo lá dentro usa sem pagar nada.
        </p>

        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-center text-sm">
          🏅 <strong>Preço de fundador:</strong> os primeiros {FOUNDER_SLOTS} servidores travam{' '}
          <strong>R$ {FOUNDER_PRICE}/mês para sempre</strong>, em qualquer plano. Depois disso o preço sobe.
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl border bg-panel p-6 ${
                plan.highlight ? 'border-accent' : 'border-edge'
              }`}
            >
              {plan.highlight && (
                <span className="mb-3 self-start rounded-full bg-accent px-3 py-1 text-xs font-bold">
                  Mais escolhido
                </span>
              )}
              <h3 className="font-semibold">{plan.label}</h3>
              <p className="mt-1 text-sm text-white/50">{plan.tagline}</p>
              <p className="mt-4 text-3xl font-bold">
                R$ {plan.price}
                <span className="text-base font-normal text-white/50">/mês</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-white/70">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Cta />
          <p className="mt-3 text-sm text-white/40">
            Começa com {TRIAL_DAYS} dias completos. Se não assinar, o bot só para de entrar na call — nada
            some do seu servidor.
          </p>
        </div>
      </section>

      <footer className="border-t border-edge">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-white/50">
          <span>Valdez · feito por Samuel Stefano</span>
          <div className="flex gap-5">
            <Link to="/privacidade" className="hover:text-white">
              Privacidade
            </Link>
            <Link to="/termos" className="hover:text-white">
              Termos
            </Link>
            {SUPPORT_URL && (
              <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="hover:text-white">
                Suporte
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
