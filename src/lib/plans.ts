export interface Plan {
  id: 'basic' | 'pro' | 'max'
  label: string
  price: number
  tagline: string
  features: string[]
  highlight?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'basic',
    label: 'Básico',
    price: 10,
    tagline: 'Pra quem só quer salvar a zoeira.',
    features: [
      'Buffer dos últimos 5 minutos',
      'Clip de até 2 minutos',
      'Música por link ou busca',
      'Opt-out por membro',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 30,
    tagline: 'O plano que a maioria dos servidores usa.',
    highlight: true,
    features: [
      'Buffer dos últimos 15 minutos',
      'Clip de até 15 minutos',
      'Gravação contínua (/replay)',
      'Canal dedicado de clipes',
      'Contador de horas ao vivo na call',
      'Ranking de horas em call',
    ],
  },
  {
    id: 'max',
    label: 'Máximo',
    price: 50,
    tagline: 'Call longa, raid, campeonato, podcast.',
    features: [
      'Buffer dos últimos 30 minutos',
      'Clip de até 30 minutos',
      'Tudo do Pro',
      'Suporte direto comigo',
    ],
  },
]

export const TRIAL_DAYS = 3
export const FOUNDER_PRICE = 10
export const FOUNDER_SLOTS = 100
