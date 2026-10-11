import { supabase } from '../lib/supabase'

/** Ends the Supabase session; the auth listener then returns the app to the sign-in page. */
export function useLogout() {
  return () => {
    void supabase.auth.signOut()
  }
}
