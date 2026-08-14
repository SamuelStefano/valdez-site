export interface Plan {
  id: 'basic' | 'pro' | 'max'
  label: string
  price: number
  tagline: string
  support: string
  features: string[]
  highlight?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'basic',
    label: 'Básico',
    price: 10,
    tagline: 'Pra quem só quer salvar a zoeira.',
    support: 'Ticket pelo site',
    features: [
      'Clip dos últimos 1min30',
      'MP3 pronto pra baixar',
      'XP, níveis e ranking de call',
      'Música por link ou busca',
      'Opt-out por membro',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 30,
    tagline: 'O plano que a maioria dos servidores usa.',
    support: 'Suporte direto no Discord',
    highlight: true,
    features: [
      'Clip dos últimos 15 minutos',
      'Gravação contínua (/replay)',
      'Contador de horas ao vivo na call',
      'Canal dedicado de clipes',
      'Tudo do Básico',
    ],
  },
  {
    id: 'max',
    label: 'Máximo',
    price: 50,
    tagline: 'Call longa, raid, campeonato, podcast.',
    support: 'Suporte no WhatsApp',
    features: [
      'Clip dos últimos 30 minutos',
      'Prioridade em bug e pedido novo',
      'Tudo do Pro',
    ],
  },
]

export const TRIAL_DAYS = 3
export const TRIAL_PLAN = 'Pro'
export const FOUNDER_PRICE = 10
export const FOUNDER_SLOTS = 100
