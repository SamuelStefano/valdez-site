import { useEffect, useRef, useState } from 'react'

// Um observer só, criado depois que a árvore montou, pega inclusive os .reveal
// que aparecem em render posterior (as vagas de fundador, por exemplo).
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el))
    return () => io.disconnect()
  })
}

export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li'
}) {
  return (
    <Tag className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  )
}

export function Spotlight({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function move(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div ref={ref} onMouseMove={move} className={`spot ${className}`}>
      {children}
    </div>
  )
}

// Conta só quando entra na tela: um número que já subiu antes do usuário olhar
// é só um número. prefers-reduced-motion pula direto pro valor final.
export function CountUp({
  to,
  duration = 1100,
  format = (n: number) => n.toLocaleString('pt-BR'),
  className = '',
}: {
  to: number
  duration?: number
  format?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }

    let frame = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          setValue(Math.round(to * (1 - Math.pow(1 - t, 3))))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}

export function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-[20%] left-[10%] h-[520px] w-[520px] animate-[auroraDrift_22s_ease-in-out_infinite] rounded-full bg-accent/12 blur-[120px]" />
      <div className="absolute top-[35%] -right-[10%] h-[460px] w-[460px] animate-[auroraDrift_28s_ease-in-out_infinite_reverse] rounded-full bg-[#5865f2]/12 blur-[130px]" />
      <div className="absolute bottom-[5%] left-[25%] h-[400px] w-[400px] animate-[auroraDrift_34s_ease-in-out_infinite] rounded-full bg-accent/8 blur-[140px]" />
    </div>
  )
}
