import { describe, expect, it } from 'vitest'
import { computeMetrics, isLicenseActive, type Guild, type License, type Snapshot } from './metrics'

const NOW = Date.now()
const DAY_MS = 86_400_000

function guild(guild_id: string, over: Partial<Guild> = {}): Guild {
  return {
    guild_id,
    name: guild_id,
    member_count: 10,
    owner_id: 'owner-1',
    last_seen_at: new Date(NOW).toISOString(),
    joined_at: new Date(NOW - 90 * DAY_MS).toISOString(),
    left_at: null,
    ...over,
  }
}

function license(guild_id: string, over: Partial<License> = {}): License {
  return {
    guild_id,
    plan: 'basic',
    status: 'active',
    price_cents: 1000,
    founder: true,
    started_at: new Date(NOW - 60 * DAY_MS).toISOString(),
    expires_at: new Date(NOW + 10 * DAY_MS).toISOString(),
    ...over,
  }
}

function snapshot(over: Partial<Snapshot> = {}): Snapshot {
  return {
    guilds: [],
    licenses: [],
    events: [],
    feedback: [],
    heartbeats: [],
    payments: [],
    ...over,
  }
}

describe('isLicenseActive', () => {
  it('accepts an active license that has not expired', () => {
    expect(isLicenseActive(license('g1'), NOW)).toBe(true)
  })

  it('accepts an active license with no expiry (lifetime and owner)', () => {
    expect(isLicenseActive(license('g1', { expires_at: null }), NOW)).toBe(true)
  })

  it('rejects a license whose expiry already passed even if the column says active', () => {
    const stale = license('g1', { expires_at: new Date(NOW - DAY_MS).toISOString() })
    expect(isLicenseActive(stale, NOW)).toBe(false)
  })

  it('rejects a license the column already marked expired', () => {
    expect(isLicenseActive(license('g1', { status: 'expired' }), NOW)).toBe(false)
  })

  it('rejects a canceled license', () => {
    expect(isLicenseActive(license('g1', { status: 'canceled' }), NOW)).toBe(false)
  })
})

describe('computeMetrics revenue', () => {
  // O bug: o `status='expired'` do SQLite do bot nunca subia pro Supabase e não
  // havia job de expiração lá, então a linha ficava `active` com o vencimento no
  // passado e todo cliente que cancelou seguia somando MRR pra sempre.
  it('keeps a stale active row out of MRR when its expiry already passed', () => {
    const d = snapshot({
      guilds: [guild('g1'), guild('g2')],
      licenses: [
        license('g1'),
        license('g2', { expires_at: new Date(NOW - 5 * DAY_MS).toISOString() }),
      ],
    })
    const m = computeMetrics(d)
    expect(m.paying.map((l) => l.guild_id)).toEqual(['g1'])
    expect(m.mrr).toBe(1000)
    expect(m.arr).toBe(12_000)
  })

  it('surfaces the stale row as expired instead of leaving the list empty forever', () => {
    const d = snapshot({
      guilds: [guild('g1')],
      licenses: [license('g1', { expires_at: new Date(NOW - 5 * DAY_MS).toISOString() })],
    })
    const m = computeMetrics(d)
    expect(m.expired.map((l) => l.guild_id)).toEqual(['g1'])
  })

  it('counts a server whose license lapsed as free again', () => {
    const d = snapshot({
      guilds: [guild('g1')],
      licenses: [license('g1', { expires_at: new Date(NOW - DAY_MS).toISOString() })],
    })
    expect(computeMetrics(d).free.map((g) => g.guild_id)).toEqual(['g1'])
  })

  it('still counts a lifetime license, which never expires', () => {
    const d = snapshot({
      guilds: [guild('g1')],
      licenses: [license('g1', { plan: 'lifetime', price_cents: 9900, expires_at: null })],
    })
    const m = computeMetrics(d)
    expect(m.lifetime).toHaveLength(1)
    expect(m.mrr).toBe(0)
    expect(m.free).toHaveLength(0)
  })
})

describe('computeMetrics conversion', () => {
  // Com só o meu servidor instalado a conversão mostrava 100% e zero cliente.
  it('does not count my own owner-plan server as a customer', () => {
    const d = snapshot({
      guilds: [guild('mine')],
      licenses: [license('mine', { plan: 'owner', price_cents: 0, expires_at: null })],
    })
    expect(computeMetrics(d).conversion).toBeNull()
  })

  it('does not count my own server in the funnel denominator either', () => {
    const d = snapshot({
      guilds: [guild('mine'), guild('g1'), guild('g2')],
      licenses: [
        license('mine', { plan: 'owner', price_cents: 0, expires_at: null }),
        license('g1'),
      ],
    })
    expect(computeMetrics(d).conversion).toBe(0.5)
  })

  it('does not count a lapsed license as a converted customer', () => {
    const d = snapshot({
      guilds: [guild('g1'), guild('g2')],
      licenses: [
        license('g1'),
        license('g2', { expires_at: new Date(NOW - DAY_MS).toISOString() }),
      ],
    })
    expect(computeMetrics(d).conversion).toBe(0.5)
  })
})

describe('computeMetrics plan mix', () => {
  it('leaves a lapsed license out of the mix', () => {
    const d = snapshot({
      guilds: [guild('g1'), guild('g2')],
      licenses: [
        license('g1', { plan: 'pro', price_cents: 3000 }),
        license('g2', { plan: 'pro', price_cents: 3000, expires_at: new Date(NOW - DAY_MS).toISOString() }),
      ],
    })
    const pro = computeMetrics(d).planMix.find((p) => p.plan === 'pro')
    expect(pro).toEqual({ plan: 'pro', n: 1, mrr: 3000 })
  })
})
