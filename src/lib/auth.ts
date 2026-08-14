import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, ready }
}

// valdez.is_admin() em vez de ler valdez.admins: a policy da tabela já limita a
// linha do próprio usuário, então uma leitura vazia seria ambígua entre "não é
// admin" e "não deu pra ler".
export function useIsAdmin(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!supabase || !session) {
      setIsAdmin(false)
      return
    }
    let alive = true
    void supabase.rpc('is_admin').then(({ data, error }) => {
      if (alive) setIsAdmin(!error && data === true)
    })
    return () => {
      alive = false
    }
  }, [session])

  return isAdmin
}

export function signOut() {
  return supabase?.auth.signOut()
}

// O redirect volta pra rota atual porque o mesmo botão aparece na landing e no
// painel — mandar sempre pra raiz jogaria o admin pra fora do painel no login.
export function signInWithDiscord(redirectPath = window.location.pathname) {
  return supabase?.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: `${window.location.origin}${redirectPath}` },
  })
}
