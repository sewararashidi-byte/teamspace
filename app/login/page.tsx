"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "../_components/auth-shell";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const router=useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const changeMode = (next: Mode) => { setMode(next);setError("");setNotice("");setPassword("");setShowPassword(false); };

  const title = mode === "login" ? "Welcome back." : mode === "signup" ? "Find your flow." : "Reset your password.";
  const description = mode === "login" ? "Sign in to pick up where you left off." : mode === "signup" ? "Start a workspace for your projects, ideas, and next steps." : "We'll send a password reset link to your email address.";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");setNotice("");setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === "forgot") {
        const { error: sendError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (sendError) throw sendError;
        setNotice("If an account exists for that email, a reset link has been requested. Check your inbox and spam folder.");
      } else if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: window.location.origin + "/" },
        });
        if (signupError) throw signupError;
        if (data.session) router.replace("/");
        else setNotice("Check your email for a confirmation link if your account requires verification. Once confirmed, return to Sign in.");
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email:normalizedEmail, password });
        if (loginError) throw loginError;
        router.replace("/");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  return <AuthShell eyebrow="YOUR PRIVATE SPACE" title={title} description={description}>
    {mode !== "forgot" ? <div className="ts-tabs" role="tablist" aria-label="Account action">
      <button type="button" role="tab" aria-selected={mode === "login"} className="ts-tab" onClick={()=>changeMode("login")}>Sign in</button>
      <button type="button" role="tab" aria-selected={mode === "signup"} className="ts-tab" onClick={()=>changeMode("signup")}>Create account</button>
    </div> : <div className="ts-back" style={{marginTop:25}}><button className="ts-inline" type="button" onClick={()=>changeMode("login")}>← Back to sign in</button></div>}
    <form className="ts-fields" onSubmit={submit}>
      <label className="ts-field">Email address
        <input className="ts-input" type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required value={email} onChange={e=>setEmail(e.target.value)}/>
      </label>
      {mode !== "forgot" && <label className="ts-field">Password
        <span className="ts-inputwrap"><input className="ts-input is-password" type={showPassword?"text":"password"} name="password" autoComplete={mode === "login"?"current-password":"new-password"} minLength={mode === "signup" ? 8 : 1} placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"} required value={password} onChange={e=>setPassword(e.target.value)}/><button className="ts-reveal" type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(x=>!x)}>{showPassword?"Hide":"Show"}</button></span>
      </label>}
      {mode === "login" && <div className="ts-row"><span className="ts-faint">A little progress, every day.</span><button type="button" className="ts-inline" onClick={()=>changeMode("forgot")}>Forgot password?</button></div>}
      {mode === "signup" && <span className="ts-faint">Use an email address you can access. You may need to confirm it before signing in.</span>}
      {error && <div className="ts-message error" role="alert">{error}</div>}
      {notice && <div className="ts-message success" role="status">{notice}</div>}
      <button className="ts-primary" type="submit" disabled={busy}>{busy?"Please wait…":mode === "login"?"Sign in to TeamSpace →":mode === "signup"?"Create my workspace →":"Send reset link →"}</button>
    </form>
    <div className="ts-bottom"><span>Private projects. Your own pace.</span><span>Powered by Supabase</span></div>
    <Link className="ts-backtop" href="/">← Return to TeamSpace</Link>
  </AuthShell>;
}
