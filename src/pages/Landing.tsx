import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PLANS,
  FREE,
  LIFETIME,
  TRIAL_DAYS,
  TRIAL_PLAN,
  FOUNDER_PRICE,
  FOUNDER_SLOTS,
} from '../lib/plans'
import { supabase } from '../lib/supabase'
import type { PublicFeedback } from '../lib/metrics'
import { useSession, useIsAdmin, signInWithDiscord, signOut } from '../lib/auth'
import { Aurora, CountUp, Reveal, Spotlight, useReveal } from '../components/motion'
import { CommandWheel } from '../components/CommandWheel'

// client_id é público por definição. As permissões são o mínimo que o bot usa:
// ver canal, mandar mensagem, anexar arquivo, entrar/falar na call e mudar o
// próprio apelido (o [REC] de consentimento).
const DEFAULT_INVITE =
  'https://discord.com/oauth2/authorize?client_id=1365865955925819546&permissions=70306816&scope=bot%20applications.commands'

const INVITE_URL = (import.meta.env.VITE_INVITE_URL as string | undefined) ?? DEFAULT_INVITE
const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL as string | undefined
const AVATAR = `${import.meta.env.BASE_URL}valdez.webp`

function seed(i: number) {
  return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
}

// O número de vagas só aparece quando o banco responde. Um contador chumbado no
// bundle seria exatamente o "countdown falso" que a seção promete não ter.
function useFounderSlotsLeft() {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase.rpc('founder_slots_left').then(({ data, error }) => {
      if (alive && !error && typeof data === 'number') setLeft(data)
    })
    return () => {
      alive = false
    }
  }, [])
  return left
}

// Depoimento aqui só existe se a pessoa marcou `publicar` no /feedback e eu
// aprovei no painel. Enquanto não houver nenhum, a seção convida em vez de
// inventar — este bot tem um punhado de servidores e prova social falsa some com
// a única coisa que ele tem pra vender.
function usePublicFeedback() {
  const [rows, setRows] = useState<PublicFeedback[] | null>(null)
  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase
      .from('public_feedback')
      .select('id,username,rating,message,created_at')
      .limit(6)
      .then(({ data, error }) => {
        if (alive) setRows(error ? [] : ((data ?? []) as PublicFeedback[]))
      })
    return () => {
      alive = false
    }
  }, [])
  return rows
}

function Cta({ children, big = false }: { children: React.ReactNode; big?: boolean }) {
  return (
    <a
      href={INVITE_URL}
      target="_blank"
      rel="noreferrer"
      className={`group relative inline-block overflow-hidden rounded-xl bg-accent font-bold text-white shadow-[0_8px_40px_rgba(255,77,61,0.4)] transition hover:-translate-y-0.5 hover:bg-accent-soft hover:shadow-[0_12px_50px_rgba(255,77,61,0.55)] ${
        big ? 'px-9 py-4 text-lg' : 'px-7 py-4 text-[17px]'
      }`}
    >
      <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
    </a>
  )
}

const STEPS = [
  { n: '01', t: 'Adiciona o bot', d: 'Um clique, permissões mínimas, pronto. Ele já sabe o que fazer.' },
  {
    n: '02',
    t: 'Ele entra na call sozinho',
    d: 'Avisa [REC] no canal e começa a gravar os últimos minutos em loop.',
  },
  {
    n: '03',
    t: '/clip e a zoeira tá salva',
    d: 'O áudio do momento cai no canal. Mesmo que a frase já tenha passado.',
  },
]

const PAINS = [
  {
    t: '"Volta, volta — o que ele falou?"',
    d: 'Ninguém consegue repetir igual. O timing morre, a voz morre, a piada morre.',
  },
  {
    t: 'Contar depois nunca funciona',
    d: '"Tinha que estar lá" é o jeito educado de dizer que o momento se perdeu.',
  },
  {
    t: 'Gravar tudo é pior ainda',
    d: 'Ninguém vai ouvir 4 horas de call atrás de 8 segundos. E ninguém quer isso salvo.',
  },
]

const FEATURES = [
  {
    icon: '🏆',
    t: 'Quem vive na call sobe de nível.',
    d: (
      <>
        Cada minuto em call vira XP. Vira nível. Vira posição no <Cmd>/leaderboard</Cmd> do servidor.
        Aquele amigo que passa a madrugada online finalmente tem onde provar isso.
      </>
    ),
  },
  {
    icon: '⏱️',
    t: 'O contador de horas fica na call.',
    d: (
      <>
        Quem quiser deixa o contador ligado e ele fica lá, ao vivo, somando o tempo de cada um. Quem
        não quiser desliga e usa <Cmd>/horas</Cmd> só quando pedir.
      </>
    ),
  },
  {
    icon: '🎧',
    t: 'Sai MP3, não sai formato estranho.',
    d: 'O clipe chega como MP3 no canal. Baixa e toca em qualquer celular, manda no zap, joga no vídeo. Nada de arquivo que só abre em programa de nerd.',
  },
  {
    icon: '🎵',
    t: 'E toca música, de quebra.',
    d: (
      <>
        <Cmd>/play</Cmd> com link do YouTube, do Spotify ou só o nome da faixa já no Básico —
        playlist e álbum inteiros no Pro. Um bot a menos pra manter no servidor.
      </>
    ),
  },
  {
    icon: '🛡️',
    t: 'O clipe é seu. O resto morre.',
    d: (
      <>
        O bot avisa <strong className="text-accent">[REC]</strong> no apelido e qualquer membro pode
        dar opt-out. O áudio fora da janela é descartado continuamente — o Valdez não guarda call
        nenhuma em servidor nenhum.
      </>
    ),
  },
  {
    icon: '💬',
    t: 'Tem gente do outro lado.',
    d: 'Bug ou dúvida: no Básico você abre ticket aqui no site, no Pro fala comigo direto no Discord e no Máximo tem meu WhatsApp. Não existe robô de atendimento no meio.',
  },
]

const FAQ = [
  {
    q: 'Isso é legal? Posso gravar meus amigos?',
    a: 'Pode, desde que eles saibam — e o bot garante que saibam. Enquanto está capturando, ele mantém [REC] no próprio apelido dentro do servidor, à vista de todo mundo. Se o Discord não deixar ele mudar o apelido, ele simplesmente não liga a captura. Consentimento aqui não é uma caixinha escondida no cadastro.',
  },
  {
    q: 'O áudio da minha call fica guardado em algum servidor?',
    a: 'Não. Ele existe só na memória, pelos minutos do seu plano, e é descartado continuamente — passou da janela, sumiu. Áudio só vira arquivo quando alguém usa /clip ou /replay, e mesmo esse arquivo é enviado pro seu canal do Discord e apagado da nossa máquina em seguida.',
  },
  {
    q: 'E se alguém não quiser ser gravado?',
    a: 'Usa /privacidade optout e pronto. A voz dessa pessoa não entra no buffer nem por um instante, e o que já estava guardado dela é descartado na hora. Sem pedir pra admin, sem negociar.',
  },
  {
    q: 'Preciso de cartão pra testar?',
    a: `Não. Todo servidor novo começa com ${TRIAL_DAYS} dias do ${TRIAL_PLAN} liberado por inteiro, sem cartão e sem cadastro. Se você não assinar, nada é cobrado e o bot continua na call no grátis, com 30 segundos de buffer.`,
  },
  {
    q: 'Quem paga: eu ou cada pessoa do servidor?',
    a: 'Só você, dono do servidor. O plano é por servidor e todo mundo lá dentro usa sem pagar nada. Não existe cobrança por membro, por hora de call nem por clipe.',
  },
  {
    q: 'Comecei no Básico. Se eu quiser subir no meio do mês, pago tudo de novo?',
    a: 'Não. O que sobrou do mês que você já pagou vira crédito: você completa só a diferença pelos dias que ainda faltam, e a data de vencimento nem muda. Subir do Básico pro Pro faltando 20 dias custa R$ 13,33, não R$ 30. E se você é fundador, o upgrade sai de graça — R$ 10/mês travado vale em qualquer plano.',
  },
  {
    q: 'Se eu cancelar, perco os clipes?',
    a: 'Não. Os clipes já publicados são mensagens no canal do seu servidor — eles ficam lá pra sempre, mesmo que você cancele. O que para é o bot entrar na call de novo.',
  },
  {
    q: 'Trava a call? Come banda?',
    a: 'Não. O bot é um participante como outro qualquer da call e o processamento é todo do lado dele. Ninguém precisa instalar nada, ninguém precisa deixar programa aberto.',
  },
  {
    q: 'Por que não uso o Craig, que é de graça?',
    a: 'O Craig grava a sessão inteira pra você editar depois — é ferramenta de podcast. O Valdez é o contrário: ele não te entrega 4 horas, te entrega os 30 segundos que importaram, no canal, na hora, em português, com ranking e nível em cima. São trabalhos diferentes.',
  },
]

const COMMANDS = [
  '/clip',
  '/replay',
  '/horas',
  '/leaderboard',
  '/play',
  '/config',
  '/privacidade',
  '/assinatura',
  '/feedback',
]

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-edge bg-ink px-2 py-0.5 font-mono text-[0.9em] text-[#e8eaf0]">
      {children}
    </code>
  )
}

function WaveformDemo() {
  const bars = useMemo(() => {
    const half = Array.from({ length: 200 }, (_, i) => ({
      h: `${(18 + seed(i) * 50).toFixed(0)}px`,
      hot: i % 60 > 32 && i % 60 < 48,
    }))
    // Duplicado: o translateX(-50%) só emenda sem salto se as duas metades forem iguais.
    return [...half, ...half]
  }, [])

  const playerBars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        delay: `${(seed(i + 7) * 1.2).toFixed(2)}s`,
        op: (0.5 + seed(i + 3) * 0.5).toFixed(2),
      })),
    [],
  )

  return (
    <div className="relative mx-auto mt-16 max-w-[860px]">
      <div className="relative overflow-hidden rounded-2xl border border-edge bg-panel p-5">
        <div className="mb-3.5 flex items-center justify-between font-mono text-xs text-muted">
          <span>buffer · últimos 15 min</span>
          <span className="flex items-center gap-1.5 text-accent">
            <span className="h-[7px] w-[7px] animate-[recBlink_1.4s_infinite] rounded-full bg-accent" />
            REC
          </span>
        </div>
        <div className="relative h-[72px] overflow-hidden rounded-lg">
          <div className="absolute flex h-full w-max animate-[waveScroll_14s_linear_infinite] items-center gap-[3px]">
            {bars.map((b, i) => (
              <span
                key={i}
                className={`inline-block w-1 flex-none rounded-sm ${b.hot ? 'bg-accent' : 'bg-[#3a4256]'}`}
                style={{ height: b.h }}
              />
            ))}
          </div>
          <div className="absolute inset-y-0 right-[22%] w-[26%] animate-[glowPulse_2.4s_ease-in-out_infinite] rounded-lg border-2 border-accent bg-accent/10 shadow-[0_0_30px_rgba(255,77,61,0.25)]" />
        </div>
        <div className="mt-3.5 font-mono text-[13px] text-muted">
          admin: <span className="text-[#e8eaf0]">/clip 2min</span>
          <span className="ml-0.5 inline-block h-4 w-2 animate-[recBlink_1s_steps(1)_infinite] bg-accent align-[-3px]" />
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-[560px] animate-[clipPop_0.8s_cubic-bezier(0.2,0.9,0.3,1.2)_0.4s_both] rounded-2xl border border-edge bg-panel p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex gap-3">
          <img
            src={AVATAR}
            alt=""
            className="h-[42px] w-[42px] flex-none animate-[floatY_4s_ease-in-out_infinite] rounded-full"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold">Valdez</span>
              <span className="rounded bg-[#5865f2] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                ✓ BOT
              </span>
              <span className="text-xs text-muted">hoje às 23:47</span>
            </div>
            <div className="mt-0.5 text-sm text-body">
              🎬 Clipe salvo — pedido por{' '}
              <span className="rounded bg-[#5865f2]/15 px-1 py-px text-[#7aa7ff]">@pedrão</span>
            </div>
            <div className="mt-2.5 rounded-md border-l-4 border-accent bg-ink px-3.5 py-3">
              <div className="mb-2 text-sm font-bold">🔊 clip-23h47.mp3 · 1:30</div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-accent text-[13px] text-white">
                  ▶
                </span>
                <div className="flex h-7 flex-1 items-center gap-0.5">
                  {playerBars.map((p, i) => (
                    <span
                      key={i}
                      className="h-full flex-1 origin-center animate-[barBounce_1.2s_ease-in-out_infinite] rounded-sm bg-accent"
                      style={{ animationDelay: p.delay, opacity: p.op }}
                    />
                  ))}
                </div>
                <span className="flex-none font-mono text-[11px] text-muted">0:00 / 2:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Account() {
  const { session, ready } = useSession()
  const isAdmin = useIsAdmin(session)
  const [error, setError] = useState<string | null>(null)

  if (!supabase || !ready) return null

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={async () => {
            const res = await signInWithDiscord('/')
            if (res?.error) setError(res.error.message)
          }}
          className="hidden rounded-[10px] border border-edge bg-panel px-3.5 py-2.5 text-sm font-semibold text-body transition hover:border-[#5865f2] hover:text-white sm:block"
        >
          Entrar com Discord
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  const name =
    (session.user.user_metadata?.full_name as string | undefined) ??
    (session.user.user_metadata?.name as string | undefined) ??
    session.user.email

  return (
    <div className="hidden items-center gap-3 text-sm sm:flex">
      {isAdmin && (
        <Link to="/admin" className="font-semibold text-accent hover:underline">
          Painel
        </Link>
      )}
      <span className="max-w-[16ch] truncate text-muted">{name}</span>
      <button onClick={() => void signOut()} className="text-muted hover:text-[#e8eaf0]">
        Sair
      </button>
    </div>
  )
}

// Os dados vêm por prop de propósito: o useReveal só reobserva os `.reveal` novos
// quando o Landing re-renderiza, então estado que faz a seção aparecer tem que
// morar lá em cima. Guardado aqui, a seção monta invisível pra sempre.
function Feedbacks({ rows }: { rows: PublicFeedback[] | null }) {
  if (rows === null) return null

  return (
    <section id="feedbacks" className="mx-auto my-24 max-w-[1100px] scroll-mt-24 px-5 sm:px-10 lg:px-16">
      <Reveal>
        <div className="mb-4 text-center font-mono text-xs tracking-[0.1em] text-accent">
          QUEM USA
        </div>
        <h2 className="m-0 mb-9 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
          {rows.length > 0 ? 'O que dizem de dentro da call' : 'Ainda não tem depoimento aqui'}
        </h2>
      </Reveal>

      {rows.length > 0 ? (
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((f, i) => (
            <Reveal key={f.id} delay={Math.min(i, 4) * 60}>
              <figure className="m-0 h-full rounded-2xl border border-edge bg-panel/50 p-6">
                {f.rating && <div className="mb-3 text-accent">{'★'.repeat(f.rating)}</div>}
                <blockquote className="m-0 text-[15px] leading-relaxed text-[#e8eaf0]">
                  {f.message}
                </blockquote>
                <figcaption className="mt-4 font-mono text-xs text-muted">
                  @{f.username ?? 'anônimo'}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal>
          <div className="mx-auto max-w-[620px] rounded-2xl border border-edge bg-panel/50 p-8 text-center">
            <p className="m-0 text-[15px] leading-relaxed text-muted">
              O Valdez é novo e eu não vou inventar elogio pra encher esta seção. Se você já usa,
              manda <Cmd>/feedback</Cmd> no seu servidor e marca <strong>publicar</strong> — o que
              você escrever aparece aqui, com seu nome do Discord e mais nada.
            </p>
            <p className="m-0 mt-4 text-[13px] text-muted/70">
              Sem seu ok, nenhum recado sai do Discord.
            </p>
          </div>
        </Reveal>
      )}
    </section>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-edge bg-panel px-6 py-5 transition hover:border-[#3a4256] open:border-accent/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold marker:content-none">
        {q}
        <span className="flex-none text-accent transition-transform duration-300 group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
    </details>
  )
}

export default function Landing() {
  useReveal()
  const slotsLeft = useFounderSlotsLeft()
  const feedbacks = usePublicFeedback()

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Aurora />

      <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-edge bg-ink/80 px-5 py-4 backdrop-blur-md sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <img src={AVATAR} alt="" className="h-[34px] w-[34px] rounded-[10px] border border-edge" />
          <span className="text-lg font-extrabold tracking-tight">Valdez</span>
        </div>
        <div className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="#como-funciona" className="hover:text-[#e8eaf0]">
            Como funciona
          </a>
          <a href="#comandos" className="hover:text-[#e8eaf0]">
            Comandos
          </a>
          <a href="#planos" className="hover:text-[#e8eaf0]">
            Planos
          </a>
          <a href="#faq" className="hover:text-[#e8eaf0]">
            Dúvidas
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Account />
          <a
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-[10px] bg-accent px-4.5 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,77,61,0.35)] transition hover:bg-accent-soft"
          >
            Adicionar ao Discord
          </a>
        </div>
      </nav>

      <header className="relative mx-auto max-w-[1200px] px-5 pt-14 pb-10 sm:px-10 lg:px-16 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,rgba(255,77,61,0.12),transparent_70%)]" />
        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-panel px-3.5 py-1.5 font-mono text-xs text-muted">
            <span className="h-2 w-2 animate-[recBlink_1.4s_infinite] rounded-full bg-accent" />
            [REC] gravando os últimos minutos, sempre
          </div>
          <h1 className="m-0 max-w-[14ch] text-[clamp(38px,7vw,76px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
            A frase já passou.{' '}
            <span className="text-accent [text-shadow:0_0_40px_rgba(255,77,61,0.4)]">
              Você salva mesmo assim.
            </span>
          </h1>
          <p className="m-0 max-w-[52ch] text-[clamp(16px,2.2vw,20px)] leading-relaxed text-pretty text-muted">
            O Valdez fica na call gravando os últimos minutos em loop. Alguém soltou a pérola?{' '}
            <Cmd>/clip</Cmd> e o áudio cai no canal em MP3. Um botão de replay da vida real.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Cta>Adicionar ao Discord</Cta>
            <a
              href="#planos"
              className="inline-block rounded-xl border border-edge bg-panel px-7 py-4 text-[17px] font-semibold transition hover:border-[#3a4256] hover:text-white"
            >
              Ver planos
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-xs text-muted">
            <span>✓ {TRIAL_DAYS} dias do {TRIAL_PLAN}, completo</span>
            <span>✓ Sem cartão</span>
            <span>✓ Sai quando quiser</span>
            <span>✓ Leva 30 segundos</span>
          </div>
        </div>

        <WaveformDemo />
      </header>

      <div className="relative overflow-hidden border-y border-edge bg-panel/40 py-3.5">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-10 font-mono text-sm text-muted">
          {[...COMMANDS, ...COMMANDS, ...COMMANDS, ...COMMANDS].map((c, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              {c}
              <span className="text-accent/50">·</span>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[linear-gradient(90deg,var(--color-ink),transparent)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[linear-gradient(270deg,var(--color-ink),transparent)]" />
      </div>

      <section
        id="comandos"
        className="mx-auto my-24 max-w-[1150px] scroll-mt-24 px-5 sm:px-10 lg:px-16"
      >
        <Reveal>
          <h2 className="m-0 mb-2 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
            Onze comandos. Nenhum manual.
          </h2>
          <p className="mx-auto m-0 mb-12 max-w-[54ch] text-center text-[15px] text-muted">
            Ninguém do seu servidor vai ler documentação. Por isso é tudo comando de uma linha, com
            nome óbvio. Clique em qualquer um pra ver o que ele faz.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <CommandWheel />
        </Reveal>
      </section>

      <Reveal as="section" className="mx-auto my-20 max-w-[1000px] px-5 sm:px-10 lg:px-16">
        <h2 className="m-0 mb-3 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
          Toda call boa tem um momento que ninguém consegue repetir.
        </h2>
        <p className="mx-auto m-0 mb-10 max-w-[54ch] text-center text-[15px] text-muted">
          E aí vem sempre a mesma cena.
        </p>
        <div className="grid gap-4.5 sm:grid-cols-3">
          {PAINS.map((p, i) => (
            <Reveal key={p.t} delay={i * 90}>
              <div className="h-full rounded-2xl border border-edge bg-panel/60 p-6.5">
                <div className="mb-2 text-[17px] font-bold text-body">{p.t}</div>
                <div className="text-sm leading-relaxed text-muted">{p.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-[46ch] text-center text-[clamp(18px,2.6vw,24px)] font-semibold leading-snug tracking-[-0.02em]">
          O problema nunca foi <span className="text-muted line-through">gravar</span>. Foi{' '}
          <span className="text-accent">achar</span>.
        </p>
      </Reveal>

      <Reveal
        as="section"
        className="mx-auto my-20 max-w-[1100px] scroll-mt-24 px-5 sm:px-10 lg:px-16"
      >
        <div id="como-funciona" />
        <h2 className="m-0 mb-9 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
          Três passos. Zero configuração.
        </h2>
        <div className="grid gap-4.5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <Spotlight className="h-full rounded-2xl border border-edge bg-panel p-6.5 transition hover:-translate-y-1 hover:border-accent hover:shadow-[0_12px_40px_rgba(255,77,61,0.12)]">
                <div className="mb-3 font-mono text-[13px] text-accent">{s.n}</div>
                <div className="mb-2 text-lg font-bold">{s.t}</div>
                <div className="text-sm leading-relaxed text-muted">{s.d}</div>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <section className="mx-auto my-20 grid max-w-[1100px] gap-4.5 px-5 sm:px-10 md:grid-cols-3 lg:px-16">
        {FEATURES.map((f, i) => (
          <Reveal key={f.t} delay={(i % 3) * 90}>
            <Spotlight className="h-full rounded-2xl border border-edge bg-panel p-7 transition hover:-translate-y-1 hover:border-[#3a4256]">
              <div className="mb-3 text-[26px]">{f.icon}</div>
              <h3 className="m-0 mb-2 text-xl font-bold">{f.t}</h3>
              <p className="m-0 text-sm leading-relaxed text-muted">{f.d}</p>
            </Spotlight>
          </Reveal>
        ))}
      </section>

      <Reveal as="section" className="mx-auto my-24 max-w-[900px] px-5 sm:px-10 lg:px-16">
        <h2 className="m-0 mb-9 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
          Por que não resolver do jeito de sempre?
        </h2>
        <div className="overflow-hidden rounded-2xl border border-edge">
          <table className="w-full text-sm">
            <thead className="bg-panel text-left">
              <tr className="text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-4 font-semibold">&nbsp;</th>
                <th className="px-4 py-4 font-semibold">Não gravar</th>
                <th className="px-4 py-4 font-semibold">Gravar a call inteira</th>
                <th className="px-4 py-4 font-semibold text-accent">Valdez</th>
              </tr>
            </thead>
            <tbody className="bg-panel/40">
              {[
                ['Salvar depois que a frase passou', '✕', '✓', '✓'],
                ['Achar o momento sem garimpar', '✕', '✕', '✓'],
                ['Todo mundo sabe que tá gravando', '—', 'depende', '✓ sempre'],
                ['Sai pronto pra mandar no zap', '✕', '✕', '✓ MP3'],
                ['Custo por mês', 'R$ 0', 'seu tempo', `R$ ${PLANS[0].price}+`],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-edge">
                  <td className="px-4 py-3.5 text-body">{row[0]}</td>
                  <td className="px-4 py-3.5 text-muted">{row[1]}</td>
                  <td className="px-4 py-3.5 text-muted">{row[2]}</td>
                  <td className="px-4 py-3.5 font-semibold text-accent">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      <Reveal as="section" className="mx-auto my-14 max-w-[900px] px-5 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-[20px] border border-accent/50 bg-[linear-gradient(135deg,rgba(255,77,61,0.12),#12151d_55%)] p-7 sm:p-11">
          <div className="absolute top-0 left-0 h-0.5 w-2/5 animate-[sweep_3.2s_linear_infinite] bg-[linear-gradient(90deg,transparent,#ff4d3d,transparent)]" />
          <div className="flex flex-wrap items-center justify-between gap-7">
            <div className="min-w-[260px] flex-1">
              <div className="mb-2.5 font-mono text-xs tracking-[0.1em] text-accent">
                OFERTA DE FUNDADOR
              </div>
              <h2 className="m-0 mb-2.5 text-[clamp(24px,4vw,36px)] font-extrabold leading-tight tracking-[-0.03em]">
                Os {FOUNDER_SLOTS} primeiros pagam R$ {FOUNDER_PRICE}/mês. Em qualquer plano. Pra
                sempre.
              </h2>
              <p className="m-0 text-[15px] leading-relaxed text-muted">
                O Valdez é novo e eu prefiro ser honesto sobre isso: os primeiros servidores entram
                pagando pouco porque estão apostando cedo. Depois o preço sobe e não volta. Sem
                countdown falso — quando as vagas acabarem, acabou.
              </p>
            </div>
            {slotsLeft !== null && (
              <div className="flex-none text-center">
                <div className="text-[clamp(48px,8vw,72px)] font-extrabold leading-none tracking-[-0.04em] text-accent [text-shadow:0_0_40px_rgba(255,77,61,0.4)]">
                  <CountUp to={slotsLeft} />
                </div>
                <div className="mt-1.5 font-mono text-xs text-muted">
                  vagas restantes de {FOUNDER_SLOTS}
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      <section id="planos" className="mx-auto my-24 max-w-[1150px] scroll-mt-24 px-5 sm:px-10 lg:px-16">
        <Reveal>
          <h2 className="m-0 mb-2 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
            Um preço. O servidor inteiro usa.
          </h2>
          <p className="mx-auto m-0 mb-8 max-w-[54ch] text-center text-[15px] text-muted">
            Quem paga é você, dono do servidor — nunca cada membro. Todo servidor começa com{' '}
            <strong className="text-body">
              {TRIAL_DAYS} dias do {TRIAL_PLAN}
            </strong>
            , o plano do meio, liberado por inteiro e sem cartão. Quando o teste acaba, o bot{' '}
            <strong className="text-body">continua na call no grátis</strong> — ele não vai embora.
          </p>
        </Reveal>

        <Reveal delay={60}>
          <div className="mb-4.5 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[18px] border border-edge bg-panel px-6.5 py-6 sm:px-9">
            <div className="min-w-[180px]">
              <div className="text-lg font-bold">{FREE.label}</div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-[34px] font-extrabold tracking-[-0.03em]">R$ 0</span>
                <span className="text-sm text-muted">pra sempre</span>
              </div>
              <div className="mt-1 text-[13px] italic text-muted">{FREE.tagline}</div>
            </div>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              {FREE.features.map((f) => (
                <div key={f} className="flex gap-2.5 text-sm leading-snug text-body">
                  <span className="flex-none text-muted">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <div className="grid items-stretch gap-4.5 sm:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 90}>
              <div
                className={`relative flex h-full flex-col rounded-[18px] border bg-panel px-6.5 py-7 transition hover:-translate-y-1.5 ${
                  plan.highlight
                    ? 'border-accent shadow-[0_0_50px_rgba(255,77,61,0.18)]'
                    : 'border-edge'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold tracking-wide whitespace-nowrap text-white">
                    MAIS USADO
                  </div>
                )}
                <div className="text-lg font-bold">{plan.label}</div>
                <div className="mt-3.5 mb-1 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-extrabold tracking-[-0.03em]">
                    R$ {plan.price}
                  </span>
                  <span className="text-sm text-muted">/mês</span>
                </div>
                <div className="mb-5 text-[13px] italic text-muted">{plan.tagline}</div>
                <div className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex gap-2.5 text-sm leading-snug text-body">
                      <span className="flex-none text-accent">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-edge pt-4 text-[13px] text-muted">
                  {plan.support}
                </div>
                <a
                  href={INVITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-6 rounded-[10px] border py-3.5 text-center text-[15px] font-bold transition hover:opacity-85 ${
                    plan.highlight
                      ? 'border-accent bg-accent text-white'
                      : 'border-[#3a4256] bg-panel text-[#e8eaf0]'
                  }`}
                >
                  Começar com {TRIAL_DAYS} dias do {TRIAL_PLAN}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-4.5 flex flex-wrap items-center gap-8 rounded-[18px] border border-[#5865f2]/45 bg-[linear-gradient(120deg,rgba(88,101,242,0.12),#12151d_60%)] px-6.5 py-7 sm:px-9">
            <div className="min-w-[240px] flex-1">
              <div className="mb-2 font-mono text-xs tracking-[0.1em] text-[#7aa7ff]">
                PAGAMENTO ÚNICO
              </div>
              <h3 className="m-0 mb-2 text-[clamp(21px,3vw,29px)] font-extrabold tracking-[-0.02em]">
                {LIFETIME.label} — R$ {LIFETIME.price}, e acabou.
              </h3>
              <p className="m-0 max-w-[46ch] text-sm leading-relaxed text-muted">
                {LIFETIME.tagline} São {LIFETIME.monthsToBreakEven} meses de {LIFETIME.equivalentTo}{' '}
                pagos de uma vez — do sexto mês em diante o Valdez é seu de graça, pra sempre.{' '}
                <strong className="text-body">Só {LIFETIME.slots} servidores</strong> podem pegar
                isso.
              </p>
            </div>
            <div className="grid min-w-[220px] flex-1 gap-2.5">
              {LIFETIME.features.map((f) => (
                <div key={f} className="flex gap-2.5 text-sm leading-snug text-body">
                  <span className="flex-none text-[#7aa7ff]">✓</span>
                  <span>{f}</span>
                </div>
              ))}
              <a
                href={INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 rounded-[10px] bg-[#5865f2] py-3.5 text-center text-[15px] font-bold text-white transition hover:brightness-110"
              >
                Quero o vitalício
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-9 grid gap-4.5 sm:grid-cols-3">
            {[
              ['Sem cartão pra testar', 'O teste não pede cartão. Se você sumir, nada é cobrado.'],
              [
                'Sem fidelidade e sem travar no plano',
                'Cancela quando quiser. E subir de plano no meio do mês custa só a diferença dos dias que faltam.',
              ],
              [
                'Sem perder o que já é seu',
                'Os clipes são mensagens no seu canal. Cancelar não apaga nada.',
              ],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-edge bg-panel/50 p-5">
                <div className="mb-1.5 flex items-center gap-2 text-[15px] font-bold">
                  <span className="text-accent">✓</span>
                  {t}
                </div>
                <p className="m-0 text-sm leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal as="section" className="mx-auto my-24 max-w-[760px] px-5 text-center sm:px-10 lg:px-16">
        <div className="mb-4 font-mono text-xs tracking-[0.1em] text-accent">POR QUE EU FIZ ISSO</div>
        <blockquote className="m-0 text-[clamp(20px,3.4vw,30px)] font-semibold leading-snug tracking-[-0.02em]">
          "Eu jogava com meus amigos e as melhores frases morriam na call. Não existia bot barato que
          gravasse voz. Então eu fiz o meu."
        </blockquote>
        <div className="mt-4 text-sm text-muted">— Samuel Stefano, criador do Valdez</div>
      </Reveal>

      <Feedbacks rows={feedbacks} />

      <section id="faq" className="mx-auto my-24 max-w-[820px] scroll-mt-24 px-5 sm:px-10 lg:px-16">
        <Reveal>
          <h2 className="m-0 mb-9 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
            O que todo mundo pergunta antes de instalar
          </h2>
        </Reveal>
        <div className="grid gap-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i, 4) * 60}>
              <FaqItem q={f.q} a={f.a} />
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="mx-auto mt-24 mb-20 max-w-[800px] px-5 text-center sm:px-10 lg:px-16">
        <h2 className="m-0 mb-3.5 text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.035em]">
          A próxima pérola vai rolar hoje à noite.
        </h2>
        <p className="m-0 mb-7 text-[17px] text-muted">Ou você salva, ou vira "tinha que estar lá".</p>
        <Cta big>Adicionar o Valdez ao Discord</Cta>
        <p className="mt-4 font-mono text-xs text-muted">
          {TRIAL_DAYS} dias do {TRIAL_PLAN} · sem cartão · sai quando quiser
        </p>
      </Reveal>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-edge px-5 py-7 text-[13px] text-muted sm:px-10 lg:px-16">
        <span>© {new Date().getFullYear()} Valdez · feito por Samuel Stefano</span>
        <div className="flex gap-5">
          <Link to="/termos" className="text-muted hover:text-[#e8eaf0]">
            Termos
          </Link>
          <Link to="/privacidade" className="text-muted hover:text-[#e8eaf0]">
            Privacidade
          </Link>
          {SUPPORT_URL && (
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="text-muted hover:text-[#e8eaf0]">
              Suporte
            </a>
          )}
        </div>
      </footer>
    </div>
  )
}
