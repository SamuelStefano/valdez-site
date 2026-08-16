import { useEffect, useRef, useState } from 'react'

interface Command {
  cmd: string
  args?: string
  title: string
  desc: string
  who: string
  tier: 'Grátis' | 'Pro'
}

// A fonte é o bot: cada entrada existe em src/commands/ e o tier é o gate real
// (upsell() no comando ou limits().replay/.stats). Prometer aqui um comando que
// não existe lá é o jeito mais barato de perder o cliente no primeiro minuto.
const COMMANDS: Command[] = [
  {
    cmd: '/clip',
    args: '[duração]',
    title: 'Salva o que acabou de acontecer',
    desc: 'Pega os últimos minutos da call e joga no canal de texto em MP3. Sem duração, volta 2 minutos. O teto é o do seu plano.',
    who: 'Qualquer um na call',
    tier: 'Grátis',
  },
  {
    cmd: '/replay',
    title: 'Grava a call inteira, do início ao fim',
    desc: 'Liga a gravação contínua em vez de depender da janela do buffer. Pra quando você já sabe que a call vai render.',
    who: 'Qualquer um na call',
    tier: 'Pro',
  },
  {
    cmd: '/play',
    args: '<link ou nome>',
    title: 'Toca música na call',
    desc: 'Link do YouTube, do Spotify ou só o nome da faixa. Um bot a menos pra convidar no servidor.',
    who: 'Qualquer um na call',
    tier: 'Grátis',
  },
  {
    cmd: '/music',
    args: 'skip · pause · stop',
    title: 'Controla o que está tocando',
    desc: 'Pula, pausa, volta pra anterior ou para tudo e limpa a fila.',
    who: 'Qualquer um na call',
    tier: 'Grátis',
  },
  {
    cmd: '/horas',
    args: '[usuário]',
    title: 'Quanto tempo você viveu ali',
    desc: 'Suas horas em call, seu nível e quanto falta pro próximo. Dá pra consultar as de outra pessoa também.',
    who: 'Qualquer um',
    tier: 'Grátis',
  },
  {
    cmd: '/leaderboard',
    args: 'semana · mês · total',
    title: 'O ranking do servidor',
    desc: 'Quem mais ficou em call. O da semana zera toda segunda — é o que cria a disputa que não deixa o servidor esfriar.',
    who: 'Qualquer um',
    tier: 'Grátis',
  },
  {
    cmd: '/call',
    args: 'entrar · sair · status',
    title: 'Liga e desliga a presença automática',
    desc: 'Por padrão o Valdez entra sozinho quando aparece gente na call. Aqui você desliga isso quando quiser silêncio.',
    who: 'Qualquer um',
    tier: 'Grátis',
  },
  {
    cmd: '/config',
    args: 'canal · clips · contador · cargos',
    title: 'A configuração do servidor',
    desc: 'Define o canal de voz que ele acompanha, onde os clips caem, o contador ao vivo na call e os cargos entregues por nível.',
    who: 'Só admin',
    tier: 'Pro',
  },
  {
    cmd: '/privacidade',
    args: 'optout · optin',
    title: 'Sua voz fora do buffer',
    desc: 'Um comando e a sua voz nunca mais entra na gravação — e o que já estava guardado de você é descartado na hora. Sem pedir pra ninguém.',
    who: 'Qualquer um',
    tier: 'Grátis',
  },
  {
    cmd: '/assinatura',
    title: 'O plano deste servidor',
    desc: 'Mostra o que está ativo, quanto tempo falta e o que cada plano libera.',
    who: 'Qualquer um',
    tier: 'Grátis',
  },
  {
    cmd: '/feedback',
    args: '<mensagem> [nota]',
    title: 'Fala direto comigo',
    desc: 'O que faltou, o que quebrou, o que você queria que tivesse. Cai direto no meu painel — eu leio tudo.',
    who: 'Qualquer um',
    tier: 'Grátis',
  },
]

const RADIUS = 188
const AUTOPLAY_MS = 4000

export function CommandWheel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const t = setInterval(() => setActive((i) => (i + 1) % COMMANDS.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused])

  const move = (delta: number) =>
    setActive((i) => (i + delta + COMMANDS.length) % COMMANDS.length)

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    }
  }

  const current = COMMANDS[active]

  return (
    <div
      className="flex flex-col items-center gap-10 lg:flex-row lg:justify-center lg:gap-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* A roda só existe onde cabe: abaixo de lg vira lista, porque círculo de
          420px em tela de celular empilha os rótulos uns sobre os outros. */}
      <div
        ref={wheelRef}
        role="tablist"
        aria-label="Comandos do Valdez"
        aria-orientation="horizontal"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative hidden h-[420px] w-[420px] flex-none rounded-full outline-none lg:block"
      >
        <div className="pointer-events-none absolute inset-0 rounded-full border border-edge" />
        <div className="pointer-events-none absolute inset-12 rounded-full border border-edge/50" />

        {/* O ponteiro gira até o comando ativo e é o que amarra a borda ao centro. */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-px w-[188px] origin-left bg-[linear-gradient(90deg,transparent,var(--color-accent))] transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${(active / COMMANDS.length) * 360 - 90}deg)` }}
        />

        {COMMANDS.map((c, i) => {
          const angle = ((i / COMMANDS.length) * 360 - 90) * (Math.PI / 180)
          const x = Math.cos(angle) * RADIUS
          const y = Math.sin(angle) * RADIUS
          const on = i === active
          return (
            <button
              key={c.cmd}
              role="tab"
              aria-selected={on}
              tabIndex={-1}
              onClick={() => setActive(i)}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              className={`absolute top-1/2 left-1/2 rounded-full border px-3 py-1.5 font-mono text-[13px] whitespace-nowrap transition ${
                on
                  ? 'z-10 border-accent bg-accent text-white shadow-[0_0_24px_rgba(255,77,61,0.45)]'
                  : 'border-edge bg-panel text-muted hover:border-[#3a4256] hover:text-body'
              }`}
            >
              {c.cmd}
            </button>
          )
        })}

        {/* O miolo é âncora visual, não conteúdo: a explicação inteira já está no
            painel ao lado, e repetir os dois textos lado a lado só polui. */}
        <div className="absolute inset-24 flex flex-col items-center justify-center rounded-full border border-edge bg-panel/70 text-center backdrop-blur-sm">
          <div className="font-mono text-[26px] font-bold tracking-tight text-accent">
            {current.cmd}
          </div>
        </div>
      </div>

      <div className="w-full max-w-[440px]">
        {/* No celular a roda não aparece, então os comandos viram chips clicáveis
            e o painel abaixo continua sendo o mesmo. */}
        <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
          {COMMANDS.map((c, i) => (
            <button
              key={c.cmd}
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`rounded-full border px-3 py-1.5 font-mono text-[13px] transition ${
                i === active
                  ? 'border-accent bg-accent text-white'
                  : 'border-edge bg-panel text-muted'
              }`}
            >
              {c.cmd}
            </button>
          ))}
        </div>

        <div className="rounded-[18px] border border-edge bg-panel p-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <code className="rounded-md border border-edge bg-ink px-2.5 py-1 font-mono text-[15px] font-bold text-[#e8eaf0]">
              {current.cmd}
            </code>
            {current.args && (
              <span className="font-mono text-[13px] text-muted">{current.args}</span>
            )}
            <span
              className={`ml-auto rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                current.tier === 'Grátis'
                  ? 'border-edge text-muted'
                  : 'border-accent/50 text-accent'
              }`}
            >
              {current.tier === 'Grátis' ? 'NO GRÁTIS' : 'PRO PRA CIMA'}
            </span>
          </div>

          <h3 className="mt-4.5 mb-2 text-[19px] leading-tight font-bold tracking-[-0.02em]">
            {current.title}
          </h3>
          <p className="m-0 text-[14.5px] leading-relaxed text-muted">{current.desc}</p>

          <div className="mt-5 flex items-center justify-between border-t border-edge pt-4">
            <span className="text-[13px] text-muted">Quem usa: {current.who}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => move(-1)}
                aria-label="Comando anterior"
                className="rounded-lg border border-edge px-2.5 py-1 text-muted transition hover:border-[#3a4256] hover:text-body"
              >
                ←
              </button>
              <span className="font-mono text-[12px] text-muted">
                {active + 1}/{COMMANDS.length}
              </span>
              <button
                onClick={() => move(1)}
                aria-label="Próximo comando"
                className="rounded-lg border border-edge px-2.5 py-1 text-muted transition hover:border-[#3a4256] hover:text-body"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
