import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseSession } from "../lib/useSupabaseSession";

export function AuthPanel() {
  const { session } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogle = async () => {
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setMessage(error.message);
    }
  };

  const handleSignIn = async () => {
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setMessage(error.message);
    }
  };

  const handleSignUp = async () => {
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your inbox to confirm your email.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="glass-panel flex flex-col gap-4 p-6">
      <div>
        <p className="badge">Login / Sign Up</p>
        <h3 className="mt-3 font-display text-xl">Secure your trading pass</h3>
        <p className="mt-2 text-sm text-emerald-200/70">
          Email + password or Google single sign-on. Email verification is enforced.
        </p>
      </div>
      <div className="grid gap-3">
        <label className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-emerald-400/20 bg-black/40 px-4 py-2 text-sm text-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@domain.com"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">
          Password
          <input
            className="mt-2 w-full rounded-xl border border-emerald-400/20 bg-black/40 px-4 py-2 text-sm text-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            type="password"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="neon-button" onClick={handleSignIn}>
          Sign in
        </button>
        <button className="ghost-button" onClick={handleSignUp}>
          Create account
        </button>
        <button className="ghost-button" onClick={handleGoogle}>
          Continue with Google
        </button>
      </div>
      {message && <p className="text-xs text-emerald-200/70">{message}</p>}
      {session && (
        <div className="flex items-center justify-between text-xs text-emerald-200/70">
          <span>Signed in as {session.user.email ?? "verified user"}</span>
          <button className="ghost-button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
