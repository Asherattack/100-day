import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export type AuthSession = {
  user: { id: string; email?: string };
} | null;

export const useSupabaseSession = () => {
  const [session, setSession] = useState<AuthSession>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ? { user: { id: data.session.user.id, email: data.session.user.email ?? "" } } : null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ? { user: { id: nextSession.user.id, email: nextSession.user.email ?? "" } } : null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
};
