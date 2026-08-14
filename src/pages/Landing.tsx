import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANS, TRIAL_DAYS, TRIAL_PLAN, FOUNDER_PRICE, FOUNDER_SLOTS } from '../lib/plans'
import { supabase } from '../lib/supabase'

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

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
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

function Cta({ children, big = false }: { children: React.ReactNode; big?: boolean }) {
  return (
    <a
      href={INVITE_URL}
      target="_blank"
      rel="noreferrer"
      className={`inline-block rounded-xl bg-accent font-bold text-white shadow-[0_8px_40px_rgba(255,77,61,0.4)] transition hover:-translate-y-0.5 hover:bg-accent-soft ${
        big ? 'px-9 py-4 text-lg' : 'px-7 py-4 text-[17px]'
      }`}
    >
      {children}
    </a>
  )
}

const STEPS = [
  {
    n: '01',
    t: 'Adiciona o bot',
    d: 'Um clique, permissões mínimas, pronto. Ele já sabe o que fazer.',
  },
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
              <div className="mb-2 text-sm font-bold">🔊 clip-23h47.ogg · 2:00</div>
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

export default function Landing() {
  useReveal()
  const slotsLeft = useFounderSlotsLeft()

  return (
    <div className="min-h-screen overflow-x-hidden">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-edge bg-ink/80 px-5 py-4 backdrop-blur-md sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <img src={AVATAR} alt="" className="h-[34px] w-[34px] rounded-[10px] border border-edge" />
          <span className="text-lg font-extrabold tracking-tight">Valdez</span>
        </div>
        <a
          href={INVITE_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-[10px] bg-accent px-4.5 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,77,61,0.35)] transition hover:bg-accent-soft"
        >
          Adicionar ao Discord
        </a>
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
            <code className="rounded-md border border-edge bg-panel px-2 py-0.5 font-mono text-[#e8eaf0]">
              /clip
            </code>{' '}
            e o áudio cai no canal. Um botão de replay da vida real.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Cta>Adicionar ao Discord</Cta>
            <a
              href="#planos"
              className="inline-block rounded-xl border border-edge bg-panel px-7 py-4 text-[17px] font-semibold transition hover:border-[#3a4256] hover:text-white"
            >
{TRIAL_DAYS} dias do {TRIAL_PLAN}, sem cartão
            </a>
          </div>
        </div>

        <WaveformDemo />
      </header>

      <section className="reveal mx-auto my-14 max-w-[900px] px-5 sm:px-10 lg:px-16">
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
                Depois disso o preço sobe e não volta. Sem countdown falso — quando as vagas
                acabarem, acabou.
              </p>
            </div>
            {slotsLeft !== null && (
              <div className="flex-none text-center">
                <div className="text-[clamp(48px,8vw,72px)] font-extrabold leading-none tracking-[-0.04em] text-accent [text-shadow:0_0_40px_rgba(255,77,61,0.4)]">
                  {slotsLeft}
                </div>
                <div className="mt-1.5 font-mono text-xs text-muted">
                  vagas restantes de {FOUNDER_SLOTS}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="reveal mx-auto my-20 max-w-[1100px] px-5 sm:px-10 lg:px-16">
        <h2 className="m-0 mb-9 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
          Três passos. Zero configuração.
        </h2>
        <div className="grid gap-4.5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-edge bg-panel p-6.5 transition hover:-translate-y-1 hover:border-accent hover:shadow-[0_12px_40px_rgba(255,77,61,0.12)]"
            >
              <div className="mb-3 font-mono text-[13px] text-accent">{s.n}</div>
              <div className="mb-2 text-lg font-bold">{s.t}</div>
              <div className="text-sm leading-relaxed text-muted">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="reveal mx-auto my-20 grid max-w-[1100px] gap-4.5 px-5 sm:px-10 md:grid-cols-3 lg:px-16">
        <div className="rounded-2xl border border-edge bg-panel p-7">
          <div className="mb-3 text-[26px]">🏆</div>
          <h3 className="m-0 mb-2 text-xl font-bold">Quem vive na call sobe de nível.</h3>
          <p className="m-0 text-sm leading-relaxed text-muted">
            Cada minuto em call vira XP. Vira nível. Vira posição no{' '}
            <code className="rounded-md border border-edge bg-ink px-2 py-0.5 font-mono text-[#e8eaf0]">
              /leaderboard
            </code>{' '}
            do servidor. Aquele amigo que passa a madrugada online finalmente tem onde provar isso.
          </p>
        </div>
        <div className="rounded-2xl border border-edge bg-panel p-7">
          <div className="mb-3 text-[26px]">⏱️</div>
          <h3 className="m-0 mb-2 text-xl font-bold">O contador de horas fica na call.</h3>
          <p className="m-0 text-sm leading-relaxed text-muted">
            Quem quiser deixa o contador ligado e ele fica lá, ao vivo, somando o tempo de cada um na
            call. Quem não quiser desliga e usa{' '}
            <code className="rounded-md border border-edge bg-ink px-2 py-0.5 font-mono text-[#e8eaf0]">
              /horas
            </code>{' '}
            só quando pedir.
          </p>
        </div>
        <div className="rounded-2xl border border-edge bg-panel p-7">
          <div className="mb-3 text-[26px]">🎧</div>
          <h3 className="m-0 mb-2 text-xl font-bold">Sai MP3, não sai formato estranho.</h3>
          <p className="m-0 text-sm leading-relaxed text-muted">
            O clipe chega como MP3 no canal. Baixa e toca em qualquer celular, manda no zap, joga no
            vídeo. Nada de arquivo que só abre em programa de nerd.
          </p>
        </div>
        <div className="rounded-2xl border border-edge bg-panel p-7">
          <div className="mb-3 text-[26px]">🎵</div>
          <h3 className="m-0 mb-2 text-xl font-bold">Toca música também.</h3>
          <p className="m-0 text-sm leading-relaxed text-muted">
            <code className="rounded-md border border-edge bg-ink px-2 py-0.5 font-mono text-[#e8eaf0]">
              /play
            </code>{' '}
            com link do YouTube, do Spotify ou só o nome da faixa. É um bot a menos pra manter no
            servidor.
          </p>
        </div>
        <div className="rounded-2xl border border-edge bg-panel p-7">
          <div className="mb-3 text-[26px]">🛡️</div>
          <h3 className="m-0 mb-2 text-xl font-bold">O clipe é seu. O resto morre.</h3>
          <p className="m-0 text-sm leading-relaxed text-muted">
            O bot avisa <span className="font-bold text-accent">[REC]</span> no canal e qualquer
            membro pode dar opt-out. O áudio fica só no seu canal do Discord — o Valdez não guarda
            nada em lugar nenhum. Privacidade não é letra miúda aqui, é feature.
          </p>
        </div>
        <div className="rounded-2xl border border-edge bg-panel p-7">
          <div className="mb-3 text-[26px]">💬</div>
          <h3 className="m-0 mb-2 text-xl font-bold">Tem gente do outro lado.</h3>
          <p className="m-0 text-sm leading-relaxed text-muted">
            Bug ou dúvida: no Básico você abre um ticket aqui no site, no Pro fala comigo direto no
            Discord e no Máximo tem meu WhatsApp. Não existe robô de atendimento no meio.
          </p>
        </div>
      </section>

      <section
        id="planos"
        className="reveal mx-auto my-24 max-w-[1150px] px-5 sm:px-10 lg:px-16"
      >
        <h2 className="m-0 mb-2 text-center text-[clamp(26px,4vw,40px)] font-extrabold tracking-[-0.03em]">
          Planos
        </h2>
        <p className="mx-auto m-0 mb-10 max-w-[52ch] text-center text-[15px] text-muted">
          Todo servidor começa com <strong className="text-body">{TRIAL_DAYS} dias do {TRIAL_PLAN}</strong>, o plano
          do meio, liberado por inteiro e sem cartão. O teste vale uma vez por servidor e uma vez por
          dono — criar servidor novo não reseta.
        </p>
        <div className="grid items-stretch gap-4.5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[18px] border bg-panel px-6.5 py-7 transition hover:-translate-y-1.5 ${
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
                <span className="text-[40px] font-extrabold tracking-[-0.03em]">R$ {plan.price}</span>
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
          ))}
        </div>
      </section>

      <section className="reveal mx-auto my-24 max-w-[760px] px-5 text-center sm:px-10 lg:px-16">
        <div className="mb-4 font-mono text-xs tracking-[0.1em] text-accent">POR QUE EU FIZ ISSO</div>
        <blockquote className="m-0 text-[clamp(20px,3.4vw,30px)] font-semibold leading-snug tracking-[-0.02em]">
          "Eu jogava com meus amigos e as melhores frases morriam na call. Não existia bot barato que
          gravasse voz. Então eu fiz o meu."
        </blockquote>
        <div className="mt-4 text-sm text-muted">— Samuel Stefano, criador do Valdez</div>
      </section>

      <section className="reveal mx-auto mt-24 mb-20 max-w-[800px] px-5 text-center sm:px-10 lg:px-16">
        <h2 className="m-0 mb-3.5 text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.035em]">
          A próxima pérola vai rolar hoje à noite.
        </h2>
        <p className="m-0 mb-7 text-[17px] text-muted">
          Ou você salva, ou vira "tinha que estar lá".
        </p>
        <Cta big>Adicionar o Valdez ao Discord</Cta>
      </section>

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
