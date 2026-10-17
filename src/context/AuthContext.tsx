import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
type Ctx = { session: Session | null; isAdmin: boolean; loading: boolean }
const C = createContext<Ctx>({ session: null, isAdmin: false, loading: true })
export const useAuth = () => useContext(C)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setIsAdmin(false); setLoading(false) } })
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => { setIsAdmin(data?.role === 'admin'); setLoading(false) })
  }, [session])
  return <C.Provider value={{ session, isAdmin, loading }}>{children}</C.Provider>
}
