"use client";

import Link from "next/link";

import type { ReactNode } from "react";

const css = String.raw`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.ts-auth { --paper:#f7f5ee; --dark:#192823; --ink:#1f2b26; --sub:#657168; --lime:#dbfa85; --line:#d6d9cf; min-height:100dvh; display:grid; grid-template-columns:minmax(0,1.04fr) minmax(440px,.96fr); background:var(--paper);color:var(--ink);font:15px/1.5 'DM Sans',sans-serif; }
.ts-auth *,.ts-auth *::before,.ts-auth *::after { box-sizing:border-box; }
.ts-auth button,.ts-auth input { font:inherit; }
.ts-auth button { cursor:pointer; }
.ts-auth a { color:inherit; }
.ts-auth :is(button,input,a):focus-visible { outline:3px solid #406ee1;outline-offset:3px; }
.ts-auth h1,.ts-auth h2,.ts-auth h3,.ts-auth p { margin:0; }
.ts-auth .ts-visual { min-height:100dvh; color:#f8f8f1; background:#192823; position:relative; padding:clamp(26px,4.2vw,70px); display:flex;flex-direction:column; overflow:hidden;isolation:isolate; }
.ts-auth .ts-visual::after { content:'';position:absolute;z-index:-1;pointer-events:none;width:790px;height:790px;border:1px solid #385047;border-radius:50%;bottom:-450px;left:-295px;box-shadow:0 0 0 80px #ffffff04,0 0 0 170px #ffffff03; }
.ts-auth .ts-brand { display:flex;align-items:center;gap:11px;width:max-content;text-decoration:none; }
.ts-auth .ts-brand-icon { width:42px;height:42px;background:var(--lime);border-radius:50%;display:grid;place-items:center;color:#1c2b23;font:800 23px 'Space Grotesk',sans-serif;letter-spacing:-2px; }
.ts-auth .ts-brand-title { font:700 22px 'Space Grotesk',sans-serif;letter-spacing:-1.3px; }
.ts-auth .ts-brand-caption { display:block;color:#9bae9e;font-size:9px;font-weight:700;letter-spacing:2px;margin-top:1px; }
.ts-auth .ts-visual-main { margin:auto 0;padding:75px 0 30px;max-width:650px; }
.ts-auth .ts-kicker { display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:#bfd4c4; }
.ts-auth .ts-dot { width:8px;height:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 0 5px #dafa811b; }
.ts-auth .ts-display { font:700 clamp(48px,6.1vw,94px)/.99 'Space Grotesk',sans-serif;letter-spacing:-4.5px;margin:30px 0 21px; }
.ts-auth .ts-display em { font-style:normal;color:var(--lime); }
.ts-auth .ts-visual-desc { font-size:17px;line-height:1.65;color:#b8c8bc;max-width:440px; }
.ts-auth .ts-flow-art { margin:38px 0 0; width:min(100%,510px);height:205px;position:relative;overflow:hidden;border:1px solid #405349;border-radius:21px;background:radial-gradient(circle at 77% 25%,#365444 0,#213b2e 40%,#1a3026 75%); }
.ts-auth .ts-flow-art::before { content:'';inset:0;position:absolute;opacity:.45;background-image:radial-gradient(#91a494 1px,transparent 1px);background-size:19px 19px;mask-image:linear-gradient(110deg,#000,transparent); }
.ts-auth .ts-art-label { position:absolute;top:17px;left:21px;color:#bcd5bf;letter-spacing:2px;font-size:10px;font-weight:800; }
.ts-auth .ts-art-path { position:absolute;inset:25px 0 0;width:100%;height:170px; }
.ts-auth .ts-art-path path { stroke:#94b69b;stroke-width:1;stroke-dasharray:3 5;fill:none; }
.ts-auth .ts-point { display:flex;gap:7px;align-items:center;padding:9px 12px;border:1px solid #6d9076;position:absolute;background:#2d4636;border-radius:100px;color:#f8fff0;font-size:11px;font-weight:800;box-shadow:0 4px 12px #0f261a88;white-space:nowrap; }
.ts-auth .ts-point::before { content:'';width:8px;height:8px;border-radius:50%;background:var(--lime); }
.ts-auth .ts-point.first { top:65px;left:8%; }
.ts-auth .ts-point.second { top:118px;left:39%; }
.ts-auth .ts-point.third { top:63px;right:7%;background:var(--lime);color:#1d3023; }
.ts-auth .ts-point.third::before { background:#2d5634; }
.ts-auth .ts-visual-foot { padding-top:25px;display:flex;justify-content:space-between;gap:15px;font-size:11px;color:#9db2a3;letter-spacing:.2px; }
.ts-auth .ts-right { display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100dvh;padding:65px clamp(25px,6vw,100px); }
.ts-auth .ts-panel { width:100%;max-width:495px; }
.ts-auth .ts-brow { color:#67786a;font-size:11px;letter-spacing:2px;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:8px; }
.ts-auth .ts-brow::before { content:'';width:23px;height:2px;background:#5070df; }
.ts-auth .ts-title {font:700 clamp(35px,3vw,50px)/1.1 'Space Grotesk',sans-serif;letter-spacing:-1.8px;margin:17px 0 12px; }
.ts-auth .ts-subtitle { color:#66716a;line-height:1.7;max-width:420px; }
.ts-auth .ts-tabs { display:flex;background:#eceee5;border:1px solid #d9ddd1;padding:5px;border-radius:14px;margin:30px 0 27px; }
.ts-auth .ts-tab { flex:1;background:transparent;border:0;border-radius:10px;min-height:44px;color:#667168;font-weight:800; }
.ts-auth .ts-tab[aria-selected="true"] { color:#192823;background:#fff;box-shadow:0 2px 11px #1f2b2618; }
.ts-auth .ts-fields { display:grid;gap:16px; }
.ts-auth .ts-field { display:grid;gap:8px;color:#293a2c;font-size:13px;font-weight:800; }
.ts-auth .ts-inputwrap { position:relative; }
.ts-auth .ts-input { background:white;color:#1f2927;border:1px solid #cbd1c6;outline:none;border-radius:12px;padding:13px 15px;width:100%;min-height:51px;font-size:15px;box-shadow:0 1px 2px #1a22190b; }
.ts-auth .ts-input:focus { border-color:#4868e8;box-shadow:0 0 0 3px #4868e828; }
.ts-auth .ts-input::placeholder { color:#879289; }
.ts-auth .ts-input.is-password { padding-right:79px; }
.ts-auth .ts-reveal { position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;padding:9px 11px;background:#f0f2eb;color:#405447;border-radius:9px;font-size:12px;font-weight:800; }
.ts-auth .ts-reveal:hover { background:#e2e7db; }
.ts-auth .ts-row { display:flex;align-items:center;justify-content:space-between;gap:12px; }
.ts-auth .ts-inline { border:0;background:transparent;color:#3557c3;font-weight:800;padding:5px 0;font-size:13px; }
.ts-auth .ts-inline:hover { text-decoration:underline; }
.ts-auth .ts-faint { color:#7c857d;font-size:12px; }
.ts-auth .ts-primary { background:var(--dark);color:#f9f8ee;border:1px solid var(--dark);font-weight:800;min-height:51px;width:100%;border-radius:12px;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .15s,background .15s; }
.ts-auth .ts-primary:hover:enabled { background:#31473a;transform:translateY(-1px); }
.ts-auth .ts-primary:disabled { opacity:.55;cursor:not-allowed; }
.ts-auth .ts-message { padding:13px 15px;border-radius:11px;margin-bottom:18px;font-size:13px;line-height:1.6; }
.ts-auth .ts-message.error { background:#fff0ed;border:1px solid #df9c90;color:#922e22; }
.ts-auth .ts-message.success { background:#e8f5df;border:1px solid #accb9d;color:#2a633c; }
.ts-auth .ts-back { margin:0 0 20px; }
.ts-auth .ts-bottom {border-top:1px solid var(--line);margin-top:26px;padding-top:20px;color:#6f7c72;font-size:12px;display:flex;justify-content:space-between;gap:10px;align-items:center; }
.ts-auth .ts-backtop {margin-top:36px;color:#607067;font-size:12px;text-decoration:none;display:inline-block; }
.ts-auth .ts-backtop:hover { text-decoration:underline; }
@media(max-width:920px){ .ts-auth { grid-template-columns:1fr; }.ts-auth .ts-visual { min-height:250px;padding:25px; }.ts-auth .ts-visual-main{padding:40px 0 15px;margin:0;}.ts-auth .ts-display{font-size:clamp(36px,7vw,60px);letter-spacing:-2px;margin:12px 0 10px;}.ts-auth .ts-visual-desc{font-size:14px;}.ts-auth .ts-flow-art{display:none;}.ts-auth .ts-visual-foot{display:none;}.ts-auth .ts-right{min-height:unset;padding:42px 24px 70px;}.ts-auth .ts-panel{max-width:550px;}.ts-auth .ts-title{font-size:39px;} }
@media(max-width:520px){ .ts-auth .ts-visual{min-height:205px;padding:20px;}.ts-auth .ts-visual-main{padding:26px 0 9px;}.ts-auth .ts-display{font-size:37px;}.ts-auth .ts-visual-desc{font-size:12px;}.ts-auth .ts-right{padding:32px 19px 65px;}.ts-auth .ts-title{font-size:35px;}.ts-auth .ts-tabs{margin-top:24px;}.ts-auth .ts-bottom{flex-wrap:wrap;} }
@media(prefers-reduced-motion:reduce){.ts-auth *, .ts-auth *::before,.ts-auth *::after {transition:none!important;animation:none!important;} }
`;

export function AuthShell({ title, description, eyebrow, children }: { title: string; description: string; eyebrow: string; children: ReactNode }) {
  return <main className="ts-auth">
    <style>{css}</style>
    <section className="ts-visual" aria-label="About TeamSpace">
      <Link href="/" className="ts-brand" aria-label="TeamSpace home">
        <span className="ts-brand-icon">t✳</span><span><span className="ts-brand-title">teamspace.</span><small className="ts-brand-caption">MAKE WORK MAKE SENSE</small></span>
      </Link>
      <div className="ts-visual-main">
        <span className="ts-kicker"><span className="ts-dot"/> YOUR WORK, IN MOTION</span>
        <h2 className="ts-display">Less chaos.<br/><em>More momentum.</em></h2>
        <p className="ts-visual-desc">Connect your ideas, map your projects, and keep the next step clear. A thoughtful space for the things you&apos;re building.</p>
        <div className="ts-flow-art" aria-hidden="true">
          <div className="ts-art-label">YOUR WORKSPACE / LIVE MAP</div>
          <svg className="ts-art-path" viewBox="0 0 450 170" preserveAspectRatio="none"><path d="M89 85Q160 24 214 107T377 78"/></svg>
          <span className="ts-point first">Plan</span><span className="ts-point second">Build</span><span className="ts-point third">Launch ↗</span>
        </div>
      </div>
      <div className="ts-visual-foot"><span>Good work begins with clarity.</span><span>TEAMSPACE / FIELDNOTES</span></div>
    </section>
    <section className="ts-right" aria-label="Account access">
      <div className="ts-panel">
        <span className="ts-brow">{eyebrow}</span>
        <h1 className="ts-title">{title}</h1>
        <p className="ts-subtitle">{description}</p>
        {children}
      </div>
    </section>
  </main>;
}
