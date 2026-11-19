"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

// Uses the EXISTING Supabase Phase 2 projects and tasks schema.
// Phase 3 adds due_date and labels columns via the included SQL migration.
type Status = "To do" | "In progress" | "Done";
type Priority = "High" | "Medium" | "Low";
type Accent = "violet" | "peach" | "mint";
type View = "Focus" | "Map" | "Flow";
type Project = { id: string; name: string; description: string; category: string; accent: Accent };
type Task = { id: string; title: string; description: string; status: Status; priority: Priority; projectId: string; dueDate: string; labels: string[] };
type TaskDraft = { title: string; description: string; status: Status; priority: Priority; projectId: string; dueDate: string; labels: string };
type ProjectDraft = { name: string; description: string; category: string; accent: Accent };
const statuses: Status[] = ["To do", "In progress", "Done"];
const priorities: Priority[] = ["High", "Medium", "Low"];
const accents: Accent[] = ["violet", "peach", "mint"];
const positions = [
  { x: 18, y: 54 }, { x: 43, y: 24 }, { x: 73, y: 47 },
  { x: 57, y: 78 }, { x: 28, y: 81 }, { x: 87, y: 78 },
];
function I({ name, size = 19 }: { name: string; size?: number }) {
  const shapes: Record<string, ReactNode> = {
    spark:<><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z"/></>,
    plus:<path d="M12 5v14M5 12h14"/>,
    arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
    check:<path d="m4 12 5 5L20 6"/>,
    close:<path d="M5 5 19 19M19 5 5 19"/>,
    search:<><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></>,
    edit:<><path d="M4 17v3h3L19 8l-3-3L4 17Z"/><path d="m14 7 3 3"/></>,
    trash:<><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6m4-6v6"/></>,
    logout:<><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
    back:<path d="m14 6-6 6 6 6"/>,
    cursor:<><path d="M5 3l14 9-7 1-3 7-4-17Z"/></>,
    list:<><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".8"/><circle cx="3.5" cy="12" r=".8"/><circle cx="3.5" cy="18" r=".8"/></>,
    map:<><circle cx="4" cy="16" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="20" cy="16" r="2"/><path d="M5 14 11 7m2 0 6 7M6 16h12"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name] || shapes.spark}</svg>;
}
const normalizeProject = (row: { id:string; name:string; description:string; category:string; accent:string }): Project => ({...row, accent:accents.includes(row.accent as Accent) ? row.accent as Accent : "violet"});
const progress = (projectId:string, all:Task[]) => {
  const own = all.filter(t => t.projectId === projectId);
  const done = own.filter(t => t.status === "Done").length;
  return { total:own.length, done, percent:own.length?Math.round(done/own.length*100):0 };
};
const projectMark = (accent:Accent)=>accent==="peach"?"#ffb18e":accent==="mint"?"#b5efc5":"#c4c5fa";
const baseTask: TaskDraft = { title:"",description:"",status:"To do",priority:"Medium",projectId:"",dueDate:"",labels:"" };
const localDate = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const parseLabels = (input:string) => [...new Set(input.split(",").map(x=>x.trim().slice(0,24)).filter(Boolean))].slice(0,5);
const labelForDate = (date:string) => {
  if(!date) return "";
  const delta = Math.round((new Date(`${date}T12:00:00`).getTime()-new Date(`${localDate()}T12:00:00`).getTime())/86400000);
  if(delta < 0) return `Overdue ${-delta}d`;
  if(delta === 0) return "Due today";
  if(delta === 1) return "Due tomorrow";
  return `Due ${new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"})}`;
};
const dueRank = (t:Task) => t.dueDate ? new Date(`${t.dueDate}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
const priorityRank = (p:Priority) => ({High:0,Medium:1,Low:2})[p];
const baseProject: ProjectDraft = { name:"",description:"",category:"Development",accent:"violet" };

const css = String.raw`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.fw{--paper:#f6f4ec;--ink:#1f2927;--muted:#64716e;--line:#dcded4;--chartreuse:#dafa81;--blue:#4868e8;--salmon:#ff9c7b;--mint:#b0efcf; font:14px 'DM Sans',sans-serif;color:var(--ink);background:var(--paper);min-height:100vh}
.fw *,.fw *:before,.fw *:after{box-sizing:border-box}.fw button,.fw input,.fw select,.fw textarea{font:inherit}.fw button{cursor:pointer}.fw button:disabled{opacity:.5;cursor:not-allowed}.fw :is(button,input,select,textarea,a):focus-visible{outline:3px solid #496cec;outline-offset:3px}.fw h1,.fw h2,.fw h3,.fw p{margin:0}.fw button{border:0}.fw .fw-header{height:79px;background:#192724;color:#f7f8ec;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 max(32px,calc((100vw - 1460px)/2));position:sticky;top:0;z-index:20;border-bottom:1px solid #34433b}
.fw-brand{display:flex;gap:12px;align-items:center;white-space:nowrap}.fw-brand-glyph{background:var(--chartreuse);color:#1d2c23;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font:bold 23px 'Space Grotesk',sans-serif}.fw-brand strong{font:700 20px 'Space Grotesk',sans-serif;letter-spacing:-1px}.fw-brand small{display:block;color:#a8bcad;font-size:9px;letter-spacing:2.4px;text-transform:uppercase;margin-top:2px}
.fw-tabs{display:flex;align-items:center;gap:6px}.fw-tab{display:flex;gap:8px;align-items:center;color:#bacac4;padding:11px 19px;border-radius:100px;background:transparent;font-weight:700}.fw-tab:hover{color:white;background:#35433e}.fw-tabs a.fw-tab{text-decoration:none}.fw-tab[aria-current='page']{background:#e4f5a5;color:#15261e}
.fw-head-actions{display:flex;align-items:center;gap:11px}.fw-top-icon{width:40px;height:40px;border:1px solid #506158;color:#dce6db;background:transparent;display:grid;place-items:center;border-radius:50%}.fw-top-icon:hover{background:#35483f}.fw-add{height:41px;padding:0 18px;border-radius:100px;background:#f5f1e8;color:#172820;display:inline-flex;align-items:center;gap:8px;font-weight:800}.fw-add:hover{background:#dafa81}.fw-main{max-width:1460px;margin:0 auto;padding:0 32px 85px}.fw-eyebrow{color:#7a8580;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:800}.fw-heading{font:700 clamp(41px,5vw,78px)/.99 'Space Grotesk',sans-serif;letter-spacing:-4px}.fw-muted{color:var(--muted);line-height:1.6}.fw-button{border:1px solid var(--ink);background:transparent;color:var(--ink);border-radius:100px;padding:11px 16px;display:inline-flex;align-items:center;gap:8px;font-weight:800;min-height:43px}.fw-button:hover{background:#e7ebdd}.fw-button.primary{background:#192724;color:#fff}.fw-button.primary:hover{background:#35493e}.fw-button.acid{background:var(--chartreuse);border-color:var(--chartreuse);color:#192724}.fw-button.danger{border-color:#e2aba2;color:#bb3524}.fw-pill{font-size:11px;font-weight:800;border:1px solid var(--line);border-radius:100px;padding:6px 11px;color:#43524d}
.fw-topline{display:flex;justify-content:space-between;gap:15px;align-items:center;margin:39px 0 32px;padding-bottom:17px;border-bottom:1px solid var(--line)}.fw-topline strong{font-weight:800;letter-spacing:.1px}.fw-topline span{color:var(--muted);font-size:12px}.fw-hero{display:grid;grid-template-columns: minmax(0,1fr) 245px;gap:35px;align-items:end;padding:6px 0 52px}.fw-hero h1{max-width:910px}.fw-squiggle{color:#4e65d9;display:inline-block;transform:rotate(-7deg)}.fw-hilight{background:linear-gradient(transparent 61%,#dafa81 61%);}.fw-hero-side{padding:0 0 4px 18px;border-left:2px solid #8a9893}.fw-hero-side p{font-size:15px;line-height:1.6;color:#4c5953}.fw-hero-side strong{display:block;font:700 38px 'Space Grotesk',sans-serif;margin-top:20px}
.fw-body-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(320px,.6fr);gap:19px;align-items:stretch}.fw-map-wrap{min-width:0}.fw-sectionlabel{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 12px}.fw-sectionlabel h2{font:700 21px 'Space Grotesk',sans-serif}.fw-link{color:var(--blue);font-weight:800;background:transparent;display:flex;gap:6px;align-items:center;padding:8px 0}.fw-link:hover{text-decoration:underline}
.fw-map{background:#182521;color:#f7f8f3;border-radius:24px;min-height:454px;overflow:hidden;position:relative;isolation:isolate}.fw-map:before{content:'';position:absolute;inset:0;background-image:radial-gradient(#697a70a3 1px,transparent 1px);background-size:25px 25px;mask-image:radial-gradient(ellipse at center,#000 5%,transparent 75%);opacity:.25}.fw-map-flag{position:absolute;top:27px;left:30px;color:#b1bfaf;font-size:10px;font-weight:800;letter-spacing:2.3px;z-index:2}.fw-map-label{position:absolute;bottom:25px;left:30px;right:30px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none}.fw-map-label b{font:700 28px 'Space Grotesk',sans-serif;letter-spacing:-1.5px}.fw-map-label span{font-size:11px;color:#a6bcb0;max-width:220px;text-align:right}.fw-map-lines{position:absolute;inset:0;width:100%;height:100%;z-index:1;opacity:.7}.fw-map-line{stroke:#5d806d;stroke-width:.3;stroke-dasharray:1 2;fill:none}.fw-orbit{position:absolute;transform:translate(-50%,-50%);z-index:3;border:1px solid #8f9f8d;background:#24342c;color:#f6f5ee;border-radius:100px;min-width:115px;max-width:145px;padding:13px 16px;box-shadow:0 5px 0 #101c16;font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:transform .15s,background .15s}.fw-orbit:before{content:'';height:8px;width:8px;display:inline-block;background:var(--mark);margin-right:8px;border-radius:50%}.fw-orbit:hover,.fw-orbit[aria-pressed='true']{background:#dafa81;color:#192724;border-color:#dafa81;transform:translate(-50%,-53%)}.fw-orbit:focus-visible{z-index:4}.fw-map-empty{position:absolute;top:46%;left:50%;transform:translate(-50%,-50%);text-align:center;display:grid;gap:15px;justify-items:center;z-index:3;min-width:240px}.fw-map-empty p{color:#c4d6c7;line-height:1.5}.fw-map-empty button{border:1px solid #a8bbaf;border-radius:100px;padding:11px 15px;background:#dafa81;color:#12251c;font-weight:800}
.fw-agenda{background:#e6ebe0;border:1px solid #d5dfd1;border-radius:24px;padding:25px;min-height:454px;display:flex;flex-direction:column}.fw-agenda h2{font:700 26px 'Space Grotesk',sans-serif;letter-spacing:-1px;margin:9px 0 5px}.fw-agenda .fw-intro{font-size:12px;color:#65746e;margin-bottom:23px}.fw-taskline{position:relative;border-top:1px solid #c5d0c5;padding:14px 0;display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:10px;align-items:start}.fw-taskline button.fw-check{width:20px;height:20px;border:1.7px solid #637b6d;border-radius:6px;background:transparent;display:grid;place-items:center;margin-top:2px}.fw-taskline button.fw-check:hover{background:#dafa81}.fw-taskline .fw-tasktitle{font-size:13px;font-weight:800;line-height:1.35;background:transparent;text-align:left;padding:0;color:inherit}.fw-taskline .fw-tasktitle:hover{text-decoration:underline}.fw-taskline small{display:block;margin-top:5px;color:#6f8074;font-size:10px}.fw-prio{font-size:9px;text-transform:uppercase;letter-spacing:.4px;font-weight:800;padding:5px 7px;border-radius:7px;background:#fff9}.fw-prio.High{background:#ffdad0;color:#a44432}.fw-prio.Medium{background:#fff4ce;color:#8c6a17}.fw-prio.Low{background:#d1e5f7;color:#2e648c}.fw-agenda-bottom{margin-top:auto;padding-top:15px}.fw-agenda-bottom button{width:100%;justify-content:space-between}.fw-agenda-empty{padding:34px 8px;color:#50635a;line-height:1.6}.fw-quickbar{margin-top:19px;display:flex;justify-content:space-between;gap:20px;padding:18px 24px;background:#fff;border:1px solid var(--line);border-radius:16px;align-items:center}.fw-quickbar strong{font-size:12px;display:block}.fw-quickbar small{color:var(--muted);font-size:11px;display:block;margin-top:4px}.fw-quickbar .fw-button{white-space:nowrap}
.fw-page-head{margin:57px 0 30px;display:flex;justify-content:space-between;align-items:end;gap:22px}.fw-page-head p{color:var(--muted);font-size:14px;line-height:1.7;margin-top:15px;max-width:640px}.fw-map-big .fw-map{min-height:530px}.fw-map-big .fw-orbit{min-width:130px;font-size:12px}.fw-map-big .fw-map-label b{font-size:36px}.fw-map-grid{display:grid;grid-template-columns:minmax(0,1.28fr) minmax(320px,.72fr);gap:18px;align-items:start}.fw-inspector{border:1px solid var(--line);background:#fff;border-radius:20px;padding:24px;min-height:530px;display:flex;flex-direction:column}.fw-inspector .fw-large-initial{height:65px;width:65px;background:var(--badge);border-radius:20px;display:grid;place-items:center;font:700 35px 'Space Grotesk',sans-serif;color:#25372b;margin:14px 0 26px}.fw-inspector h2{font:700 31px 'Space Grotesk',sans-serif;letter-spacing:-1.2px;line-height:1.1}.fw-inspector p{color:#64736c;font-size:13px;line-height:1.75;margin:14px 0 26px}.fw-inspector-progress{margin-top:auto;padding:18px 0;border-top:1px solid var(--line)}.fw-track{height:8px;border-radius:100px;background:#e6e8e1;overflow:hidden;margin-top:12px}.fw-track i{display:block;background:#4868e8;height:100%;border-radius:100px;transition:width .3s}.fw-inspector-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:18px}.fw-index{margin-top:36px;border-top:1px solid var(--line)}.fw-index-title{font:700 21px 'Space Grotesk',sans-serif;margin:23px 0 12px}.fw-project-row{padding:15px 4px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:38px minmax(0,1fr) 125px 100px 28px;gap:15px;align-items:center}.fw-project-row>span:first-child{width:33px;height:33px;border-radius:10px;display:grid;place-items:center;background:var(--badge);font-weight:800}.fw-project-row button.fw-name{background:transparent;text-align:left;font-weight:800;font-size:13px;color:var(--ink)}.fw-project-row button.fw-name:hover{text-decoration:underline}.fw-project-row small{display:block;color:var(--muted);margin-top:3px}.fw-project-row .fw-mini{color:var(--muted);font-size:12px}
.fw-flowbar{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin:23px 0}.fw-search{height:43px;border-radius:100px;padding:0 16px;border:1px solid #cdd3c9;display:flex;align-items:center;gap:10px;background:#fff;max-width:390px;width:100%}.fw-search input{border:none;outline:none;width:100%;min-width:0;background:transparent;color:#26342a}.fw-flowbar select{border-radius:100px;padding:10px 13px;border:1px solid #cdd3c9;background:#fff;color:#25342b;height:43px}.fw-flow-track{background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line);display:grid;grid-template-columns:175px minmax(0,1fr);min-height:173px}.fw-flow-track+.fw-flow-track{border-top:0}.fw-flow-label{border-right:1px solid var(--line);padding:22px}.fw-flow-label span{font:700 36px 'Space Grotesk',sans-serif;color:#9ba59b;display:block;margin-bottom:16px}.fw-flow-label strong{font-size:13px}.fw-flow-label small{display:block;color:var(--muted);margin-top:6px}.fw-flow-scroll{display:flex;gap:12px;padding:18px;align-items:stretch;overflow-x:auto}.fw-ticket{background:#f7f7f1;border:1px solid #e0e2d9;border-radius:11px;padding:14px 16px;min-width:218px;max-width:240px;display:flex;flex-direction:column;gap:10px;position:relative}.fw-ticket:before{content:'';height:5px;width:44px;background:var(--accent);border-radius:0 0 8px 8px;position:absolute;top:0;left:18px}.fw-ticket strong{font-size:13px;line-height:1.5}.fw-ticket small{font-size:10px;color:#728176}.fw-ticket select{margin-top:auto;background:white;border:1px solid #d3d9cb;border-radius:8px;padding:7px 8px;color:#25342a;min-height:33px;width:100%;font-size:11px}.fw-ticket-foot{display:flex;gap:4px;justify-content:flex-end}.fw-ticket-foot button{background:transparent;color:#6c7a70;border-radius:6px;padding:5px;display:grid;place-items:center}.fw-ticket-foot button:hover{background:#e7eadf}.fw-no-work{color:#7a867c;font-size:13px;padding:35px 12px;align-self:center}.fw-info{background:#e6ebe0;border-left:4px solid #81a378;padding:14px 18px;font-size:12px;color:#405448;line-height:1.6;margin-top:22px}.fw-feedback{padding:12px 15px;border:1px solid #a4c4a2;background:#e6f7dc;border-radius:11px;color:#2b6038;margin-bottom:16px;font-size:12px}.fw-error{padding:12px 15px;border:1px solid #e3a39e;background:#fff0ec;border-radius:11px;color:#9a352a;margin-bottom:16px;font-size:12px}
.fw-overlay{position:fixed;inset:0;background:#0e1714a1;backdrop-filter:blur(3px);z-index:40;display:flex;justify-content:flex-end}.fw-modal{background:#f8f7f1;width:min(100%,520px);height:100%;overflow:auto;padding:35px;display:flex;flex-direction:column}.fw-modal-head{display:flex;justify-content:space-between;align-items:start;gap:20px;margin-bottom:30px}.fw-modal h2{font:700 32px 'Space Grotesk',sans-serif;letter-spacing:-1px;line-height:1.05;margin-top:10px}.fw-icbtn{height:39px;width:39px;border:1px solid #c7cfc4;background:#fff;border-radius:50%;display:grid;place-items:center;color:#283a2f}.fw-form{display:flex;flex-direction:column;gap:18px;flex:1}.fw-form label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:800}.fw-form :is(input,select,textarea){width:100%;border:1px solid #cbd0c5;border-radius:10px;min-height:45px;padding:10px 12px;background:white;color:#21342a}.fw-form textarea{min-height:105px;resize:vertical}.fw-form-duo{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fw-swatches{display:flex;gap:9px}.fw-swatches button{height:37px;width:49px;border:3px solid #f8f7f1;border-radius:11px;box-shadow:0 0 0 1px #cbd0c5}.fw-swatches button[aria-pressed='true']{outline:2px solid #192724;outline-offset:2px}.fw-swatches .violet{background:#d6d7fa}.fw-swatches .peach{background:#ffcfb9}.fw-swatches .mint{background:#bfe9d1}.fw-form-bottom{margin-top:auto;border-top:1px solid var(--line);padding-top:23px;display:flex;justify-content:flex-end;gap:10px}.fw-bottom{border-top:1px solid var(--line);padding:30px 0 0;margin-top:50px;display:flex;justify-content:space-between;color:#708077;font-size:11px;gap:20px}
@media(max-width:1200px){.fw .fw-header{padding:0 25px}.fw-main{padding:0 25px 80px}.fw-body-grid,.fw-map-grid{grid-template-columns:1fr}.fw-agenda{min-height:auto}.fw-map{min-height:400px}.fw-inspector{min-height:auto}.fw-inspector-progress{margin-top:16px}.fw-hero{grid-template-columns:1fr 180px}.fw-heading{letter-spacing:-2.5px}}
@media(max-width:740px){.fw .fw-header{display:grid;grid-template-columns:1fr auto;grid-template-areas:"brand actions" "tabs tabs";height:auto;min-height:0;row-gap:10px;padding:12px 15px 11px}.fw-brand{grid-area:brand}.fw-head-actions{grid-area:actions}.fw-brand small{display:none}.fw-brand strong{font-size:17px}.fw-brand-glyph{width:36px;height:36px;font-size:18px}.fw-tabs{grid-area:tabs;justify-content:space-between;width:100%;padding:0;gap:7px}.fw-tab{flex:1;justify-content:center}.fw-tab{padding:10px 12px}.fw-add{height:37px;padding:0 12px}.fw-head-actions .fw-top-icon{display:none}.fw-main{padding:0 15px 80px}.fw-hero{grid-template-columns:1fr;padding:0 0 30px}.fw-hero-side{margin:5px 0 0;padding-left:13px}.fw-hero-side strong{font-size:30px;margin-top:8px}.fw-topline{margin:25px 0}.fw-heading{font-size:clamp(39px,9vw,65px)}.fw-map{min-height:375px}.fw-orbit{min-width:92px;max-width:112px;padding:9px;font-size:10px}.fw-map-label b{font-size:23px}.fw-map-label span{max-width:120px;font-size:9px}.fw-page-head{align-items:start;flex-direction:column;margin-top:35px}.fw-project-row{grid-template-columns:36px minmax(0,1fr) 65px 20px;gap:9px}.fw-project-row .fw-cat{display:none}.fw-flow-track{grid-template-columns:86px minmax(0,1fr)}.fw-flow-label{padding:14px 9px}.fw-flow-label span{font-size:25px}.fw-flow-label strong{font-size:11px}.fw-flow-label small{font-size:10px}.fw-flow-scroll{padding:12px;gap:9px}.fw-ticket{min-width:188px}.fw-modal{padding:23px}.fw-bottom{flex-direction:column}}
@media(max-width:410px){.fw-tab{font-size:12px;gap:5px;padding:9px}.fw-tab svg{width:15px}.fw-hero .fw-heading{letter-spacing:-2px}.fw-map{min-height:360px}.fw-orbit{min-width:79px;max-width:100px;font-size:9px}.fw-map-flag{left:17px}.fw-map-label{left:17px;right:17px}.fw-flowbar{align-items:stretch}.fw-flowbar>*{max-width:none;width:100%}.fw-form-duo{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.fw *{animation:none!important;transition:none!important}}

/* Phase 3 — due dates, labels, and task discovery */
.fw-due{display:inline-flex;align-items:center;width:max-content;gap:4px;border:1px solid #d5dfd0;background:#e9ede6;border-radius:999px;color:#365148;padding:5px 9px;font-size:10px;font-weight:800;white-space:nowrap}
.fw-due.overdue{color:#8c2f22;border-color:#edbaa8;background:#fff1eb}.fw-due.today{color:#79530e;border-color:#f1da9d;background:#fff6d9}
.fw-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.fw-tag{font-size:10px;background:#e9e4fb;color:#4c4178;border:1px solid #dcd4f4;border-radius:999px;padding:3px 8px;font-weight:700}
.fw-extra-filter{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.fw-extra-filter label{font-size:12px;font-weight:800;display:flex;gap:7px;align-items:center}.fw-extra-filter select{height:40px;border:1px solid #d4d9d1;border-radius:10px;background:white;color:#21382d;padding:0 12px}
.fw-form-note{font-size:11px;color:#69766b;line-height:1.5}.fw-alertstrip{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:#fff4e9;border:1px solid #f2d0a6;border-radius:16px;padding:13px 16px;margin:10px 0 18px;color:#714525;font-weight:700}
.fw-ticket .fw-due{margin-top:8px}.fw-ticket .fw-tags{margin-bottom:3px}.fw-taskline .fw-due{margin-top:5px}
@media(max-width:780px){.fw-extra-filter{width:100%}.fw-extra-filter label{flex:1}.fw-extra-filter select{width:100%;min-width:80px}}
`;

function MapCanvas({projects,selectedProjectId,onSelect,onNew}:{projects:Project[];selectedProjectId?:string|null;onSelect:(id:string)=>void;onNew:()=>void}) {
  const mapProjects = projects.slice(0,6);
  return <div className="fw-map" aria-label="Interactive project map">
    <div className="fw-map-flag">PROJECT FIELD / {projects.length} ACTIVE</div>
    <svg className="fw-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {mapProjects.map((p,i)=>{const pos=positions[i];return <line key={p.id} className="fw-map-line" x1="50" y1="52" x2={pos.x} y2={pos.y}/>;})}
      <circle cx="50" cy="52" r="6" stroke="#a9c69c" strokeDasharray="1 2" strokeWidth=".35" fill="none" opacity=".7"/>
      <circle cx="50" cy="52" r=".7" fill="#dafa81"/>
    </svg>
    {mapProjects.map((p,i)=><button key={p.id} type="button" className="fw-orbit" style={{left:`${positions[i].x}%`,top:`${positions[i].y}%`,"--mark":projectMark(p.accent)} as CSSProperties} onClick={()=>onSelect(p.id)} aria-pressed={selectedProjectId===p.id} title={`Open ${p.name}`}>{p.name}</button>)}
    {!projects.length&&<div className="fw-map-empty"><I name="map" size={33}/><p>Your project map begins with one idea.</p><button type="button" onClick={onNew}>Create your first project +</button></div>}
    <div className="fw-map-label"><b>Ideas in motion<span style={{color:"#dafa81"}}>.</span></b><span>Choose a project to see what&apos;s happening inside.</span></div>
  </div>;
}

export default function Page() {
  const router=useRouter();
  const [view, setView] = useState<View>("Focus");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [sortMode, setSortMode] = useState<"due" | "priority" | "recent">("due");
  const [drawer, setDrawer] = useState<"task" | "project" | null>(null);
  const [editTask, setEditTask] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(baseTask);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(baseProject);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!alive) return;
      if (authError || !user) { setLoaded(true); return; }
      setUserId(user.id); setUserEmail(user.email || "");
      const [pResult, tResult] = await Promise.all([
        supabase.from("projects").select("id,name,description,category,accent").eq("user_id",user.id).order("created_at",{ascending:true}),
        supabase.from("tasks").select("id,title,description,status,priority,project_id,due_date,labels").eq("user_id",user.id).order("created_at",{ascending:false}),
      ]);
      if (!alive) return;
      if (pResult.error || tResult.error) setError(pResult.error?.message || tResult.error?.message || "Unable to load your workspace.");
      else {
        setProjects((pResult.data || []).map(normalizeProject));
        setTasks((tResult.data || []).map(t => ({id:t.id,title:t.title,description:t.description||"",status:t.status as Status,priority:t.priority as Priority,projectId:t.project_id,dueDate:t.due_date||"",labels:Array.isArray(t.labels)?t.labels:[]})));
      }
      setLoaded(true);
    }
    void load();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const onKey = (e:KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k") { e.preventDefault(); setView("Flow");setTimeout(()=>searchRef.current?.focus(),0); }
      if (e.key==="Escape") setDrawer(null);
    };
    document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey);
  }, []);

  const projectLookup = useMemo(()=>new Map(projects.map(p=>[p.id,p])),[projects]);
  const filteredTasks = useMemo(()=>{
    const filtered=tasks.filter(t=>(projectFilter==="all" || t.projectId===projectFilter)
      && (priorityFilter==="all" || t.priority===priorityFilter)
      && (`${t.title} ${t.description} ${t.labels.join(" ")} ${projectLookup.get(t.projectId)?.name||""}`).toLowerCase().includes(search.toLowerCase()));
    if(sortMode==="recent") return filtered; // Preserves created_at descending order from Supabase
    return [...filtered].sort((a,b)=>sortMode==="due" ? dueRank(a)-dueRank(b) || priorityRank(a.priority)-priorityRank(b.priority) : priorityRank(a.priority)-priorityRank(b.priority) || dueRank(a)-dueRank(b));
  },[tasks,projectFilter,priorityFilter,search,projectLookup,sortMode]);
  const doneCount = tasks.filter(t=>t.status==="Done").length;
  const activeCount = tasks.filter(t=>t.status!=="Done").length;
  const overallPercent = tasks.length?Math.round(doneCount/tasks.length*100):0;
  const focusTasks = [...tasks].filter(t=>t.status!=="Done").sort((a,b)=>dueRank(a)-dueRank(b)||priorityRank(a.priority)-priorityRank(b.priority)).slice(0,4);
  const overdueCount = tasks.filter(t=>t.status!=="Done"&&!!t.dueDate&&t.dueDate<localDate()).length;
  const activeProject = projects.find(p=>p.id===selectedProject) || projects[0];
  const projectName = (id:string)=>projectLookup.get(id)?.name||"Project";
  function go(next:View) {setView(next);setSearch("");setError("");}
  function beginTask(task?:Task,projectId?:string) {
    if (!task&&!projects.length) {setView("Map");setError("Create your first project before adding a task.");return;}
    setEditTask(task?.id||null);
    setTaskDraft(task?{title:task.title,description:task.description,priority:task.priority,status:task.status,projectId:task.projectId,dueDate:task.dueDate,labels:task.labels.join(", ")}:{...baseTask,projectId:projectId||projects[0]?.id||""});
    setDrawer("task");setError("");
  }
  function beginProject(project?:Project) {setEditProject(project?.id||null);setProjectDraft(project?{name:project.name,description:project.description,category:project.category,accent:project.accent}:baseProject);setDrawer("project");setError("");}
  async function updateStatus(task:Task,status:Status) {
    if(!userId||task.status===status)return;
    const {error:dbError}=await supabase.from("tasks").update({status}).eq("id",task.id).eq("user_id",userId);
    if(dbError){setError(dbError.message);return;}
    setTasks(old=>old.map(t=>t.id===task.id?{...t,status}:t));setNotice("Task updated.");
  }
  async function saveTask(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!userId||busy||!taskDraft.title.trim()||!projectLookup.has(taskDraft.projectId))return;
    setBusy(true);setError("");
    const values={title:taskDraft.title.trim(),description:taskDraft.description.trim(),status:taskDraft.status,priority:taskDraft.priority,project_id:taskDraft.projectId,due_date:taskDraft.dueDate||null,labels:parseLabels(taskDraft.labels)};
    const id=editTask||crypto.randomUUID();
    const query=editTask?supabase.from("tasks").update(values).eq("id",id).eq("user_id",userId):supabase.from("tasks").insert({...values,id,user_id:userId});
    const {error:dbError}=await query;setBusy(false);
    if(dbError){setError(dbError.message);return;}
    const stored:Task={id,title:values.title,description:values.description,status:values.status,priority:values.priority,projectId:values.project_id,dueDate:values.due_date||"",labels:values.labels};
    setTasks(old=>editTask?old.map(t=>t.id===id?stored:t):[stored,...old]);setDrawer(null);setNotice(editTask?"Task changes saved.":"Task created.");
  }
  async function removeTask(task:Task) {
    if(!userId||!window.confirm(`Delete task "${task.title}"? This cannot be undone.`))return;
    const {error:dbError}=await supabase.from("tasks").delete().eq("id",task.id).eq("user_id",userId);
    if(dbError){setError(dbError.message);return;}setTasks(old=>old.filter(t=>t.id!==task.id));setNotice("Task deleted.");
  }
  async function saveProject(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!userId||busy||!projectDraft.name.trim())return;
    setBusy(true);setError("");
    const values={name:projectDraft.name.trim(),description:projectDraft.description.trim(),category:projectDraft.category.trim()||"Development",accent:projectDraft.accent};
    const id=editProject||crypto.randomUUID();
    const query=editProject?supabase.from("projects").update(values).eq("id",id).eq("user_id",userId):supabase.from("projects").insert({...values,id,user_id:userId});
    const {data,error:dbError}=await query.select("id,name,description,category,accent").single();setBusy(false);
    if(dbError||!data){setError(dbError?.message||"Could not save project.");return;}
    const stored=normalizeProject(data);
    setProjects(old=>editProject?old.map(p=>p.id===id?stored:p):[...old,stored]);setSelectedProject(id);setView("Map");setDrawer(null);setNotice(editProject?"Project updated.":"Project created.");
  }
  async function removeProject(project:Project) {
    if(!userId)return;
    const count=tasks.filter(t=>t.projectId===project.id).length;
    if(!window.confirm(`Delete "${project.name}" and its ${count} task(s)? This cannot be undone.`))return;
    const {error:dbError}=await supabase.from("projects").delete().eq("id",project.id).eq("user_id",userId);
    if(dbError){setError(dbError.message);return;}
    setProjects(old=>old.filter(p=>p.id!==project.id));setTasks(old=>old.filter(t=>t.projectId!==project.id));setSelectedProject(null);setNotice("Project deleted.");
  }
  async function signOut(){await supabase.auth.signOut();router.replace("/login");}


  return <div className="fw">
    <style>{css}</style>
    <header className="fw-header">
      <div className="fw-brand"><span className="fw-brand-glyph">t<span style={{fontSize:11,alignSelf:"center"}}>✳</span></span><span><strong>teamspace.</strong><small>Make work make sense</small></span></div>
      <nav className="fw-tabs" aria-label="Main navigation">{([['Focus','spark'],['Map','map'],['Flow','list']] as [View,string][]).map(([v,icon])=><button type="button" key={v} className="fw-tab" aria-current={view===v?'page':undefined} onClick={()=>go(v)}><I name={icon} size={17}/>{v}</button>)}<Link className="fw-tab" href="/plan"><I name="calendar" size={17}/>Plan</Link><Link className="fw-tab" href="/team"><I name="map" size={17}/>Team</Link></nav>
      <div className="fw-head-actions"><button className="fw-top-icon" aria-label="Sign out" title="Sign out" onClick={()=>void signOut()}><I name="logout" size={18}/></button><button className="fw-add" onClick={()=>beginTask()}><I name="plus" size={17}/>New task</button></div>
    </header>
    <main className="fw-main">
      <div className="fw-topline"><strong>YOUR OWN SPACE <span style={{color:"#6f8575",marginLeft:8}}>✳</span></strong><span>{loaded ? (userEmail?`Signed in as ${userEmail}`:"Please sign in to get started") : "Loading your workspace…"}</span></div>
      {notice&&<div role="status" className="fw-feedback">{notice} <button style={{background:"none",float:"right",color:"inherit",fontWeight:800}} aria-label="Dismiss notification" onClick={()=>setNotice("")}>×</button></div>}
      {error&&<div role="alert" className="fw-error">{error}</div>}
      {loaded&&!userId&&<div className="fw-error">You are signed out. <Link href="/login">Sign in to load your projects.</Link></div>}
      {view==="Focus"&&<>
        {overdueCount>0&&<div className="fw-alertstrip">{overdueCount} overdue task{overdueCount===1?"":"s"} need your attention. <button type="button" className="fw-link" onClick={()=>go("Flow")}>Review tasks <I name="arrow" size={16}/></button></div>}
        <section className="fw-hero"><h1 className="fw-heading">Less chaos.<br/><span className="fw-hilight">More momentum.</span><span className="fw-squiggle">↗</span></h1><div className="fw-hero-side"><p>A little clarity changes everything. Here&apos;s what needs your attention.</p><strong>{activeCount.toString().padStart(2,"0")} <span style={{fontSize:13,fontWeight:700}}>tasks in motion</span></strong></div></section>
        <section className="fw-body-grid">
          <div className="fw-map-wrap"><div className="fw-sectionlabel"><h2>Work, connected.</h2><button className="fw-link" onClick={()=>go("Map")}>Explore projects <I name="arrow" size={17}/></button></div><MapCanvas projects={projects} selectedProjectId={null} onSelect={id=>{setSelectedProject(id);setView("Map")}} onNew={()=>beginProject()}/></div>
          <aside><div className="fw-sectionlabel"><h2>What matters now</h2><span className="fw-pill">FOCUS QUEUE</span></div><div className="fw-agenda"><div className="fw-eyebrow">NEXT UP / PRIORITIZED</div><h2>Your next moves.</h2><p className="fw-intro">Finish one thing at a time. The rest can wait.</p>
          {focusTasks.length?focusTasks.map(t=><div className="fw-taskline" key={t.id}><button className="fw-check" aria-label={`Mark ${t.title} done`} title="Mark as done" onClick={()=>void updateStatus(t,"Done")}><I name="check" size={13}/></button><div><button className="fw-tasktitle" onClick={()=>beginTask(t)}>{t.title}</button><small>{projectName(t.projectId)} · {t.status}</small>{t.dueDate&&<span className={`fw-due ${t.dueDate<localDate()?"overdue":t.dueDate===localDate()?"today":""}`}>{labelForDate(t.dueDate)}</span>}{t.labels.length>0&&<div className="fw-tags">{t.labels.slice(0,2).map(l=><span key={l} className="fw-tag">{l}</span>)}</div>}</div><span className={`fw-prio ${t.priority}`}>{t.priority}</span></div>):<div className="fw-agenda-empty">You&apos;re all clear. Create a task to start moving things forward.</div>}
          <div className="fw-agenda-bottom"><button className="fw-button primary" onClick={()=>go("Flow")}>Open work flow <I name="arrow" size={16}/></button></div></div></aside>
        </section>
        <div className="fw-quickbar"><div><strong>{projects.length} project{projects.length!==1?'s':''} · {tasks.length} task{tasks.length!==1?'s':''} · {overallPercent}% complete</strong><small>Progress is based on your actual tasks, stored in Supabase.</small></div><button className="fw-button" onClick={()=>beginProject()}><I name="plus" size={16}/>Start a project</button></div>
      </>}
      {view==="Map"&&<>
        <header className="fw-page-head"><div><div className="fw-eyebrow">IDEAS / ALL PROJECTS</div><h1 className="fw-heading">Your project<br/><span className="fw-hilight">universe.</span></h1><p>Every project is its own world. Select a point to explore its work, or add a new one.</p></div><button className="fw-button primary" onClick={()=>beginProject()}><I name="plus" size={17}/>New project</button></header>
        <div className="fw-map-grid"><div className="fw-map-big"><MapCanvas projects={projects} selectedProjectId={activeProject?.id} onSelect={id=>setSelectedProject(id)} onNew={()=>beginProject()}/></div>
          <aside className="fw-inspector">
            {activeProject?<><div className="fw-eyebrow">SELECTED / {activeProject.category}</div><div className="fw-large-initial" style={{"--badge":projectMark(activeProject.accent)} as CSSProperties}>{activeProject.name.slice(0,1).toUpperCase()}</div><h2>{activeProject.name}</h2><p>{activeProject.description||"Add a short description to give this project context."}</p>
              <div className="fw-inspector-progress"><strong>{progress(activeProject.id,tasks).percent}% complete</strong><span style={{float:"right",fontSize:11,color:"#68776f"}}>{progress(activeProject.id,tasks).done}/{progress(activeProject.id,tasks).total} tasks done</span><div className="fw-track"><i style={{width:`${progress(activeProject.id,tasks).percent}%`}}/></div></div>
              <div className="fw-inspector-actions"><button className="fw-button primary" onClick={()=>beginTask(undefined,activeProject.id)}><I name="plus" size={15}/>Add task</button><button className="fw-button" onClick={()=>beginProject(activeProject)}><I name="edit" size={15}/>Edit</button><button className="fw-button danger" onClick={()=>void removeProject(activeProject)}><I name="trash" size={15}/>Delete</button></div>
            </>:<><div className="fw-eyebrow">NO PROJECT SELECTED</div><h2 style={{marginTop:35}}>Start with an idea.</h2><p>Create a project, then break it into manageable tasks.</p><button className="fw-button primary" onClick={()=>beginProject()}>New project <I name="plus" size={15}/></button></>}
          </aside>
        </div>
        <div className="fw-index"><h2 className="fw-index-title">Project index / {projects.length}</h2>{projects.map(p=><div className="fw-project-row" key={p.id} style={{"--badge":projectMark(p.accent)} as CSSProperties}><span>{p.name.slice(0,1).toUpperCase()}</span><div><button className="fw-name" onClick={()=>setSelectedProject(p.id)}>{p.name}</button><small>{p.description||"No description added yet"}</small></div><span className="fw-mini fw-cat">{p.category}</span><span className="fw-mini">{progress(p.id,tasks).percent}% done</span><button title={`Open ${p.name}`} aria-label={`Open ${p.name}`} onClick={()=>setSelectedProject(p.id)} style={{background:"transparent",color:"#4868e8"}}><I name="arrow" size={17}/></button></div>)}</div>
      </>}
      {view==="Flow"&&<>
        <header className="fw-page-head"><div><div className="fw-eyebrow">WORK / IN MOTION</div><h1 className="fw-heading">A clearer<br/><span className="fw-hilight">way forward.</span></h1><p>Three horizontal tracks, one continuous flow. Edit, move, and finish your tasks in one place.</p></div><button className="fw-button primary" onClick={()=>beginTask()}><I name="plus" size={17}/>New task</button></header>
        <div className="fw-flowbar"><label className="fw-search"><I name="search" size={16}/><input ref={searchRef} aria-label="Search tasks" placeholder="Find a task or project…" value={search} onChange={e=>setSearch(e.target.value)}/></label><label style={{display:"flex",gap:9,alignItems:"center",fontSize:12,fontWeight:700}}>Project <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}><option value="all">All projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="fw-extra-filter"><label>Priority <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value as "all"|Priority)}><option value="all">All</option>{priorities.map(p=><option key={p} value={p}>{p}</option>)}</select></label><label>Sort <select value={sortMode} onChange={e=>setSortMode(e.target.value as "due"|"priority"|"recent")}><option value="due">Due date</option><option value="priority">Priority</option><option value="recent">Newest</option></select></label></div><span className="fw-pill">{filteredTasks.length} TASKS</span></div>
        {statuses.map((status,index)=>{const own=filteredTasks.filter(t=>t.status===status);return <section className="fw-flow-track" key={status} aria-label={`${status} tasks`}><div className="fw-flow-label"><span>0{index+1}</span><strong>{status}</strong><small>{own.length} task{own.length!==1?"s":""}</small></div><div className="fw-flow-scroll">{own.length?own.map(t=><article className="fw-ticket" key={t.id} style={{"--accent":projectMark(projectLookup.get(t.projectId)?.accent||"mint")} as CSSProperties}><small>{projectName(t.projectId)}</small><strong>{t.title}</strong><span className={`fw-prio ${t.priority}`} style={{alignSelf:"start"}}>{t.priority} priority</span>{t.dueDate&&<span className={`fw-due ${t.status!=="Done"&&t.dueDate<localDate()?"overdue":t.dueDate===localDate()?"today":""}`}>{labelForDate(t.dueDate)}</span>}{t.labels.length>0&&<div className="fw-tags">{t.labels.map(l=><span key={l} className="fw-tag">{l}</span>)}</div>}<select aria-label={`Change status of ${t.title}`} value={t.status} onChange={e=>void updateStatus(t,e.target.value as Status)}>{statuses.map(s=><option key={s}>{s}</option>)}</select><div className="fw-ticket-foot"><button onClick={()=>beginTask(t)} title={`Edit ${t.title}`} aria-label={`Edit ${t.title}`}><I name="edit" size={16}/></button><button onClick={()=>void removeTask(t)} title={`Delete ${t.title}`} aria-label={`Delete ${t.title}`}><I name="trash" size={16}/></button></div></article>):<div className="fw-no-work">No tasks in this stage yet.</div>}</div></section>})}
        <div className="fw-info"><b>Tip:</b> Use <b>Ctrl + K</b> to jump to task search. Status changes are saved in PostgreSQL.</div>
      </>}
      <footer className="fw-bottom"><span>teamspace. / a more human way to work</span></footer>
    </main>
    {drawer&&<div className="fw-overlay" onMouseDown={e=>{if(e.currentTarget===e.target&&!busy)setDrawer(null)}}><aside className="fw-modal" role="dialog" aria-modal="true" aria-labelledby="fw-form-title"><div className="fw-modal-head"><div><div className="fw-eyebrow">{drawer==="project"?"IDEA / PROJECT":"WORK / TASK"}</div><h2 id="fw-form-title">{drawer==="project"?(editProject?"Edit your project":"Start a project"):(editTask?"Edit this task":"Add a new task")}</h2></div><button className="fw-icbtn" aria-label="Close dialog" onClick={()=>setDrawer(null)}><I name="close" size={17}/></button></div>
      {error&&<div className="fw-error" role="alert">{error}</div>}
      {drawer==="task"?<form className="fw-form" onSubmit={e=>void saveTask(e)}><label>Task title<input required maxLength={100} autoFocus value={taskDraft.title} placeholder="What needs to be done?" onChange={e=>setTaskDraft(d=>({...d,title:e.target.value}))}/></label><label>Notes<textarea maxLength={400} placeholder="Add context and expectations" value={taskDraft.description} onChange={e=>setTaskDraft(d=>({...d,description:e.target.value}))}/></label><label>Project<select value={taskDraft.projectId} required onChange={e=>setTaskDraft(d=>({...d,projectId:e.target.value}))}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="fw-form-duo"><label>Priority<select value={taskDraft.priority} onChange={e=>setTaskDraft(d=>({...d,priority:e.target.value as Priority}))}>{priorities.map(p=><option key={p}>{p}</option>)}</select></label><label>Status<select value={taskDraft.status} onChange={e=>setTaskDraft(d=>({...d,status:e.target.value as Status}))}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div><label>Due date <input type="date" value={taskDraft.dueDate} onChange={e=>setTaskDraft(d=>({...d,dueDate:e.target.value}))}/></label><label>Labels (optional)<input maxLength={180} placeholder="Design, Research, Client" value={taskDraft.labels} onChange={e=>setTaskDraft(d=>({...d,labels:e.target.value}))}/><span className="fw-form-note">Separate labels with commas. Up to 5 labels, 24 characters each.</span></label><div className="fw-form-bottom"><button type="button" className="fw-button" onClick={()=>setDrawer(null)}>Cancel</button><button className="fw-button primary" disabled={busy||!taskDraft.title.trim()}>{busy?"Saving…":editTask?"Save changes":"Create task"}<I name="arrow" size={16}/></button></div></form>
      :<form className="fw-form" onSubmit={e=>void saveProject(e)}><label>Project name<input required maxLength={80} autoFocus placeholder="What's your project called?" value={projectDraft.name} onChange={e=>setProjectDraft(d=>({...d,name:e.target.value}))}/></label><label>Description<textarea maxLength={400} placeholder="What is this project about?" value={projectDraft.description} onChange={e=>setProjectDraft(d=>({...d,description:e.target.value}))}/></label><label>Category<input maxLength={50} value={projectDraft.category} onChange={e=>setProjectDraft(d=>({...d,category:e.target.value}))}/></label><label>Color marker<span className="fw-swatches">{accents.map(a=><button type="button" key={a} className={a} aria-label={`Use ${a} color`} aria-pressed={projectDraft.accent===a} onClick={()=>setProjectDraft(d=>({...d,accent:a}))}/>)}</span></label><div className="fw-form-bottom"><button type="button" className="fw-button" onClick={()=>setDrawer(null)}>Cancel</button><button className="fw-button primary" disabled={busy||!projectDraft.name.trim()}>{busy?"Saving…":editProject?"Save project":"Create project"}<I name="arrow" size={16}/></button></div></form>}
    </aside></div>}
  </div>;
}
