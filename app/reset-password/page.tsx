"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "../_components/auth-shell";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(()=>{
    let active = true;
    const { data: subscription } = supabase.auth.onAuthStateChange((event,session)=>{
      if(!active) return;
      if(event === "PASSWORD_RECOVERY" && session) { setReady(true);setChecking(false); }
      if(event === "SIGNED_IN" && session) { setReady(true);setChecking(false); }
    });
    void supabase.auth.getSession().then(({data})=>{ if(active) { setReady(Boolean(data.session));setChecking(false); }});
    return ()=>{ active = false;subscription.subscription.unsubscribe();};
  },[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setError("");setNotice("");
    if (password.length < 8) {setError("Use at least 8 characters for your new password.");return;}
    if (password !== confirm) {setError("Your passwords do not match.");return;}
    setBusy(true);
    try {
      const {error:updateError}=await supabase.auth.updateUser({password});
      if(updateError) throw updateError;
      setNotice("Password updated successfully. You can now sign in with your new password.");
      await supabase.auth.signOut();
      setPassword("");setConfirm("");setReady(false);
    } catch(caught){setError(caught instanceof Error?caught.message:"Unable to update password. Request a new reset link.");}
    finally{setBusy(false);}
  }

  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="A fresh start." description="Create a new password to access your workspace securely.">
    <div style={{height:32}}/>
    {checking?<p className="ts-subtitle" role="status">Checking your reset link…</p>:ready?<form className="ts-fields" onSubmit={submit}>
      <label className="ts-field">New password <span className="ts-inputwrap"><input type={show?"text":"password"} className="ts-input is-password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" className="ts-reveal" onClick={()=>setShow(v=>!v)} aria-label={show?"Hide password":"Show password"}>{show?"Hide":"Show"}</button></span></label>
      <label className="ts-field">Confirm new password<input className="ts-input" type={show?"text":"password"} autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your new password"/></label>
      {error&&<div className="ts-message error" role="alert">{error}</div>}
      {notice&&<div className="ts-message success" role="status">{notice}</div>}
      <button className="ts-primary" type="submit" disabled={busy}>{busy?"Updating…":"Save new password →"}</button>
    </form>:<div className="ts-message success" role="status">{notice||"This reset link is unavailable or has expired. Request a new link from the sign-in page."}</div>}
    <div className="ts-bottom"><a className="ts-inline" href="/login">← Return to sign in</a><span>TeamSpace / Account security</span></div>
  </AuthShell>;
}
