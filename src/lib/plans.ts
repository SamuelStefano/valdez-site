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
      'Música por link ou nome',
      'MP3 pronto pra baixar',
      'XP, níveis e ranking de call',
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
      'Playlist e álbum inteiros',
      'Contador de horas ao vivo na call',
      'Gravação contínua (/replay)',
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
      'Vídeo da sala: quem falou acende na hora',
      'Clip da voz de UMA pessoa só',
      'Retrospectiva semanal do servidor',
      'Clip dos últimos 30 minutos',
      'Prioridade em bug e pedido novo',
      'Tudo do Pro',
    ],
  },
]

// O gratuito não é plano que alguém assina: é o que o servidor tem quando não
// tem licença. 30s salva a risada e perde o que veio antes dela — a falta é o
// argumento de venda do Básico.
export const FREE = {
  label: 'Grátis',
  price: 0,
  tagline: 'Pra sempre, sem cartão. O bot fica na call.',
  support: 'Ticket pelo site',
  features: [
    'Clip dos últimos 30 segundos',
    'MP3 pronto pra baixar',
    'XP, níveis e ranking de call',
    'Sem limite de tempo, sem cartão',
  ],
}

export const LIFETIME = {
  label: 'Vitalício',
  price: 150,
  // Entrega o Pro, não o Máximo: R$ 150 já são cinco meses de Pro adiantados, e
  // deixar o topo fora do vitalício é o que impede o Máximo mensal de morrer.
  equivalentTo: 'Pro',
  monthsToBreakEven: 5,
  slots: 50,
  tagline: 'Paga uma vez. Nunca mais vê cobrança.',
  support: 'Suporte direto no Discord',
  features: [
    'Tudo do Pro, pra sempre',
    'Sem mensalidade, sem renovação',
    'Preço travado mesmo se tudo subir',
    'Vale enquanto o Valdez existir',
  ],
}

export const TRIAL_DAYS = 3
export const TRIAL_PLAN = 'Pro'
export const FOUNDER_PRICE = 10
export const FOUNDER_SLOTS = 100
