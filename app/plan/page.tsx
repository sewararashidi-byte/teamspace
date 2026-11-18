"use client";

import Link from "next/link";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type MilestoneStatus = "Planned" | "In progress" | "Done";
type Project = { id: string; name: string; description: string; accent: string };
type Milestone = {
  id: string; project_id: string; user_id: string; title: string;
  details: string; target_date: string; status: MilestoneStatus;
};
type Task = { id: string; title: string; status: string; project_id: string; milestone_id: string | null; due_date: string | null };
type Draft = { title: string; details: string; target_date: string; status: MilestoneStatus };
const statuses: MilestoneStatus[] = ["Planned", "In progress", "Done"];
const dateAsMs = (date: string) => new Date(`${date}T12:00:00`).getTime();
const dateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = () => dateInput(new Date());
const inDays = (days: number) => { const d = new Date(); d.setDate(d.getDate()+days); return dateInput(d); };
const prettyDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
const emptyDraft = (): Draft => ({ title:"", details:"", target_date:"", status:"Planned" });
const css = String.raw`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.pl{--paper:#f6f4ec;--ink:#202c26;--muted:#69776e;--border:#d9ded3;--green:#182922;--acid:#dafa81;--blue:#4466e2;background:var(--paper);min-height:100vh;color:var(--ink);font:14px 'DM Sans',sans-serif}
.pl *,.pl *:before,.pl *:after{box-sizing:border-box}.pl button,.pl select,.pl input,.pl textarea{font:inherit}.pl button{cursor:pointer}.pl :is(a,button,input,select,textarea):focus-visible{outline:3px solid #4d72ef;outline-offset:3px}.pl h1,.pl h2,.pl h3,.pl p{margin:0}.pl a{color:inherit;text-decoration:none}.pl button:disabled{opacity:.5;cursor:not-allowed}
.pl-top{background:var(--green);color:#fff;min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:14px clamp(22px,5vw,80px);position:sticky;top:0;z-index:10;border-bottom:1px solid #3c5744}.pl-brand{display:flex;align-items:center;gap:12px;font:700 21px 'Space Grotesk',sans-serif;letter-spacing:-1px}.pl-mark{width:42px;height:42px;background:var(--acid);border-radius:50%;color:#172720;display:grid;place-items:center;font:bold 25px 'Space Grotesk'}.pl-topnav{display:flex;align-items:center;gap:10px}.pl-link{padding:11px 16px;border-radius:100px;color:#dae2d7;font-weight:700}.pl-link:hover,.pl-link:focus-visible{background:#365043;color:white}.pl-link.active{background:#e3f4a9;color:#22342a}.pl-wrap{max-width:1400px;margin:auto;padding:35px clamp(22px,5vw,72px) 100px}.pl-topline{font-size:10px;letter-spacing:2.4px;font-weight:800;color:#738375;display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:30px;text-transform:uppercase}.pl-hero{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:30px}.pl-hero h1{font:700 clamp(38px,5.4vw,76px)/.99 'Space Grotesk',sans-serif;letter-spacing:-3.5px;margin:12px 0 15px}.pl-hero h1 em{font-style:normal;background:linear-gradient(transparent 61%,var(--acid) 61%)}.pl-hero p{max-width:560px;line-height:1.6;color:#64746a;font-size:15px}.pl-hero-side{display:flex;align-items:end;gap:8px;flex-wrap:wrap}.pl-button{border:1px solid #27382d;background:transparent;border-radius:999px;padding:12px 17px;font-weight:800;color:#213226;min-height:44px;display:inline-flex;gap:8px;align-items:center;justify-content:center}.pl-button:hover{background:#ebeee3}.pl-button.primary{background:var(--green);color:#fff}.pl-button.primary:hover{background:#355442}.pl-button.acid{background:var(--acid);border-color:var(--acid)}.pl-button.warn{border-color:#da998f;color:#a92d21}.pl-button:disabled{cursor:not-allowed;opacity:.5}
.pl-filters{display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:24px;padding:16px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}.pl-filters label{display:flex;align-items:center;gap:13px;font-size:12px;font-weight:800}.pl-select{height:46px;min-width:220px;max-width:100%;padding:0 13px;border-radius:12px;border:1px solid #cbd3c8;background:#fff;color:#203025}.pl-switch{display:flex;gap:4px;border:1px solid var(--border);padding:4px;border-radius:100px;background:white}.pl-switch button{border:0;background:transparent;color:#69756d;border-radius:100px;padding:9px 16px;font-weight:800}.pl-switch button[aria-pressed=true]{color:#fff;background:#25382e}
.pl-summary{display:grid;grid-template-columns:1.4fr 1fr;gap:18px;margin:28px 0 37px}.pl-feature{background:#1d3028;color:#f2f8e9;border-radius:24px;padding:26px 29px;position:relative;overflow:hidden;min-height:165px}.pl-feature:after{content:'';position:absolute;right:-75px;top:-105px;width:260px;height:260px;border:1px solid #76977970;border-radius:50%;box-shadow:0 0 0 45px #263f3050,0 0 0 92px #263f3030}.pl-feature small{font-size:10px;letter-spacing:2px;color:#cbe4b9;font-weight:800}.pl-feature h2{font:600 clamp(22px,2.7vw,36px) 'Space Grotesk',sans-serif;letter-spacing:-1px;margin:14px 0 10px;max-width:75%;position:relative;z-index:1}.pl-feature p{color:#c4d4c8;font-size:12px;position:relative;z-index:1}.pl-stats{background:#fff;border:1px solid var(--border);border-radius:24px;padding:24px;display:grid;align-content:center;gap:12px}.pl-stat-row{display:flex;justify-content:space-between;align-items:center;font-weight:700;gap:15px}.pl-stat-row span{color:var(--muted);font-size:12px}.pl-stat-row strong{font:700 23px 'Space Grotesk',sans-serif}.pl-meter{background:#e4e9df;height:7px;border-radius:20px;overflow:hidden}.pl-meter i{display:block;height:100%;background:#5e8b61;border-radius:20px;transition:width .2s}.pl-section-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:35px 0 18px}.pl-section-head h2{font:700 27px 'Space Grotesk',sans-serif;letter-spacing:-1px}.pl-section-head p{font-size:12px;color:var(--muted);margin-top:6px}.pl-tag{padding:6px 10px;border-radius:100px;background:#e9eee2;color:#405342;font-weight:800;font-size:10px;white-space:nowrap}.pl-tag[data-status='Done']{background:#dcf1de;color:#216233}.pl-tag[data-status='In progress']{background:#e0e7ff;color:#344eb0}
.pl-roadmap{background:#fff;border:1px solid var(--border);border-radius:24px;padding:21px 22px;overflow-x:auto}.pl-ruler{display:grid;grid-template-columns:minmax(170px,270px) minmax(370px,1fr);align-items:end;gap:18px;margin:0 0 12px}.pl-ruler-track{height:52px;position:relative;border-bottom:1px solid #cad3c7}.pl-ruler-label{font-size:10px;color:#738178;position:absolute;top:10px;white-space:nowrap;transform:translateX(-50%);font-weight:700}.pl-ruler-label.first{transform:none}.pl-ruler-label.last{transform:translateX(-100%)}.pl-ruler-track:after{content:'';position:absolute;bottom:-5px;left:0;right:0;border-bottom:1px dashed #cad3c7}.pl-ruler-side{font-weight:800;color:#7d8b7f;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:11px}.pl-row{display:grid;grid-template-columns:minmax(170px,270px) minmax(370px,1fr);gap:18px;align-items:center;border-bottom:1px solid #eef0eb;padding:18px 0;min-height:102px}.pl-row:last-child{border-bottom:0}.pl-row-info{display:grid;gap:8px}.pl-row-info button{font-weight:800;color:#1d3228;text-align:left;background:none;border:0;padding:0;line-height:1.4}.pl-row-info button:hover{text-decoration:underline}.pl-row-info small{font-size:11px;color:var(--muted)}.pl-rail{position:relative;height:62px;background:repeating-linear-gradient(to right,#eff2ec 0px,#eff2ec 1px,transparent 1px,transparent 25%);border-bottom:1px solid #dce3d8}.pl-rail-line{position:absolute;top:30px;left:0;right:0;border-top:2px dashed #e3e9e1}.pl-rail-now{position:absolute;top:0;bottom:0;border-left:2px solid #5476e3;z-index:2}.pl-rail-now span{position:absolute;top:-15px;left:5px;color:#4467d5;font-size:9px;font-weight:800;white-space:nowrap}.pl-pin{position:absolute;top:17px;transform:translateX(-50%);display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:#cee7bb;border:3px solid #fff;box-shadow:0 0 0 2px #6c936b;z-index:3;cursor:pointer}.pl-pin[data-status='Done']{background:#3d9465;box-shadow:0 0 0 2px #3d9465}.pl-pin[data-status='In progress']{background:#d4dcff;box-shadow:0 0 0 2px #5b73df}.pl-pin:focus-visible{outline:3px solid #203fe5}.pl-rail-date{position:absolute;top:49px;transform:translateX(-50%);white-space:nowrap;font-size:10px;color:#627268;font-weight:800}.pl-lists{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:18px}.pl-milestone-list{display:grid;gap:9px}.pl-milestone-card{background:#fff;border:1px solid var(--border);padding:17px;border-radius:15px;display:flex;justify-content:space-between;gap:14px;align-items:center}.pl-milestone-card strong{font-size:15px}.pl-milestone-card small{display:block;color:var(--muted);margin-top:7px;line-height:1.5}.pl-actions{display:flex;gap:5px;flex-wrap:wrap}.pl-mini{background:#eef2ea;color:#314438;padding:9px 11px;border:0;border-radius:100px;font-size:11px;font-weight:800;white-space:nowrap}.pl-mini:hover{background:#dce8d4}.pl-linked{background:#eaece4;border-radius:18px;padding:23px;align-self:start}.pl-linked h3{font:700 22px 'Space Grotesk',sans-serif;margin-bottom:8px}.pl-linked p{font-size:12px;line-height:1.6;color:var(--muted);margin-bottom:15px}.pl-linked-item{padding:11px 0;border-top:1px solid #d5dbd2;display:grid;gap:7px}.pl-linked-item strong{font-size:12px;line-height:1.5}.pl-linked-item select{width:100%;padding:10px;border:1px solid #c6cfbf;background:#fff;border-radius:9px;color:#1f3027}.pl-linked-item small{color:var(--muted)}.pl-empty{border:1px dashed #b9c6b5;border-radius:18px;padding:35px;color:#536557;line-height:1.7;text-align:center;background:#fff}.pl-message{padding:13px 17px;border-radius:12px;background:#e4f1db;color:#24613a;margin-bottom:18px;font-weight:700}.pl-error{padding:13px 17px;border-radius:12px;background:#ffebea;color:#9c3129;margin-bottom:18px;line-height:1.6}.pl-foot{margin-top:50px;border-top:1px solid var(--border);padding-top:18px;display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#7b877d}.pl-overlay{position:fixed;inset:0;background:#101d18ab;z-index:30;display:flex;align-items:center;justify-content:center;padding:20px}.pl-dialog{background:#fff;border-radius:25px;padding:29px;width:min(500px,100%);max-height:90vh;overflow:auto;box-shadow:0 20px 70px #0004}.pl-dialog-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:20px}.pl-dialog h2{font:700 30px 'Space Grotesk',sans-serif;letter-spacing:-1.5px}.pl-x{background:#f0f3ed;border:0;border-radius:50%;width:37px;height:37px;font-size:19px;cursor:pointer}.pl-form{display:grid;gap:17px}.pl-form label{display:grid;gap:7px;font-weight:800;font-size:12px}.pl-form input,.pl-form select,.pl-form textarea{border:1px solid #c4d1c3;border-radius:11px;padding:12px 13px;width:100%;background:#fff;color:#24352a;font-weight:500;min-height:44px}.pl-form textarea{resize:vertical;min-height:90px}.pl-form-bottom{display:flex;justify-content:flex-end;gap:9px;margin-top:7px}
@media(max-width:920px){.pl-summary,.pl-lists{grid-template-columns:1fr}.pl-hero{align-items:start;flex-direction:column}.pl-ruler,.pl-row{grid-template-columns:minmax(150px,210px) minmax(360px,1fr)}.pl-wrap{padding:24px 18px 60px}.pl-feature h2{max-width:100%}}
@media(max-width:620px){.pl-top{padding:12px 17px}.pl-brand{font-size:17px}.pl-mark{width:35px;height:35px}.pl-topnav{gap:3px}.pl-link{font-size:11px;padding:10px}.pl-hero h1{font-size:43px;letter-spacing:-2px}.pl-filters label{width:100%;justify-content:space-between}.pl-select{width:min(100%,270px)}.pl-summary{margin-top:16px}.pl-feature{min-height:145px}.pl-feature h2{font-size:28px}.pl-ruler,.pl-row{grid-template-columns:140px minmax(360px,1fr)}.pl-roadmap{padding:15px}.pl-ruler-side{font-size:9px}.pl-row-info button{font-size:12px}.pl-row-info small{font-size:10px}.pl-foot{flex-direction:column}.pl-section-head{align-items:start;flex-direction:column}.pl-hero-side{width:100%}}
@media(prefers-reduced-motion:reduce){.pl *{transition:none!important;animation:none!important}}
`;

export default function PlanPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState("");
  const [mode, setMode] = useState<"Timeline" | "List">("Timeline");
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [todayDate, setTodayDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !user) { setLoaded(true); return; }
      setTodayDate(today());
      setUserId(user.id); setEmail(user.email || "");
      const [pr, mr, tr] = await Promise.all([
        supabase.from("projects").select("id,name,description,accent").eq("user_id",user.id).order("created_at",{ascending:true}),
        supabase.from("milestones").select("id,user_id,project_id,title,details,target_date,status").eq("user_id",user.id).order("target_date",{ascending:true}),
        supabase.from("tasks").select("id,title,status,project_id,milestone_id,due_date").eq("user_id",user.id).order("created_at",{ascending:false}),
      ]);
      if (!active) return;
      if (pr.error || mr.error || tr.error) setError(pr.error?.message || mr.error?.message || tr.error?.message || "Could not load your timeline.");
      else {
        const nextProjects = (pr.data || []) as Project[];
        setProjects(nextProjects);
        setProjectId(nextProjects[0]?.id || "");
        setMilestones((mr.data || []) as Milestone[]);
        setTasks((tr.data || []) as Task[]);
      }
      setLoaded(true);
    }
    void load();
    return () => { active = false; };
  }, []);

  const project = projects.find(p => p.id === projectId);
  const visible = useMemo(() => milestones.filter(m => m.project_id === projectId).sort((a,b) => a.target_date.localeCompare(b.target_date)), [milestones,projectId]);
  const projectTasks = useMemo(() => tasks.filter(t => t.project_id === projectId), [tasks,projectId]);
  const completed = visible.filter(m => m.status === "Done").length;
  const progress = visible.length ? Math.round(completed / visible.length * 100) : 0;
  const next = visible.find(m => m.status !== "Done");
  const linkedFor = (milestoneId: string) => projectTasks.filter(t => t.milestone_id === milestoneId);
  const timeline = useMemo(() => {
    if (!todayDate) return { percent: (date: string) => Number.isNaN(dateAsMs(date)) ? 0 : 50, labels: ["", "", "", "", ""] };
    const now = dateAsMs(todayDate);
    const dates = visible.map(m => dateAsMs(m.target_date));
    const day = 86400000;
    const start = Math.min(now, ...dates) - 14 * day;
    const end = Math.max(now + 70 * day, ...dates) + 14 * day;
    const percent = (date: string) => Math.min(98,Math.max(2, ((dateAsMs(date)-start) / (end-start))*100));
    const labels = Array.from({length:5},(_,i) => new Date(start + (end-start)*(i/4)).toLocaleDateString(undefined,{month:"short",day:"numeric"}));
    return { percent, labels };
  }, [visible, todayDate]);

  function addMilestone(m?: Milestone) {
    setEditing(m || null);
    setDraft(m ? {title:m.title,details:m.details,target_date:m.target_date,status:m.status} : {...emptyDraft(), target_date:inDays(14)});
    setError(""); setShowForm(true);
  }
  async function saveMilestone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId || !projectId || !draft.title.trim() || !draft.target_date || busy) return;
    setBusy(true); setError("");
    const values = { title:draft.title.trim(), details:draft.details.trim(), target_date:draft.target_date, status:draft.status };
    const response = editing
      ? await supabase.from("milestones").update(values).eq("id",editing.id).eq("user_id",userId).select("id,user_id,project_id,title,details,target_date,status").single()
      : await supabase.from("milestones").insert({...values,user_id:userId,project_id:projectId}).select("id,user_id,project_id,title,details,target_date,status").single();
    setBusy(false);
    if (response.error || !response.data) { setError(response.error?.message || "Couldn't save the milestone."); return; }
    const stored = response.data as Milestone;
    setMilestones(old => editing ? old.map(m => m.id === stored.id ? stored : m) : [...old,stored]);
    setShowForm(false); setMessage(editing ? "Milestone updated." : "Milestone added to the timeline.");
  }
  async function removeMilestone(m: Milestone) {
    if (!userId || !window.confirm(`Delete milestone “${m.title}”? Linked tasks will stay in their project.`)) return;
    setError("");
    const {error:dbError} = await supabase.from("milestones").delete().eq("id",m.id).eq("user_id",userId);
    if (dbError) {setError(dbError.message);return;}
    setMilestones(old => old.filter(item => item.id !== m.id));
    setTasks(old => old.map(t => t.milestone_id === m.id ? {...t,milestone_id:null} : t));
    setMessage("Milestone removed. Its tasks were kept.");
  }
  async function assignTask(task: Task, milestoneId: string | null) {
    if (!userId || (milestoneId && !visible.some(m => m.id === milestoneId))) return;
    setError("");
    const {error:dbError} = await supabase.from("tasks").update({milestone_id:milestoneId})
      .eq("id",task.id).eq("user_id",userId).eq("project_id",projectId);
    if (dbError) {setError(dbError.message);return;}
    setTasks(old => old.map(t => t.id === task.id ? {...t,milestone_id:milestoneId} : t));
    setMessage(milestoneId ? "Task linked to milestone." : "Task unlinked from milestone.");
  }

  return <div className="pl"><style>{css}</style>
    <header className="pl-top"><Link className="pl-brand" href="/"><span className="pl-mark">t✳</span>teamspace.</Link>
      <nav className="pl-topnav" aria-label="Planning navigation"><Link className="pl-link" href="/">Workspace</Link><span className="pl-link active" aria-current="page">Plan</span><Link className="pl-link" href="/team">Team</Link></nav>
    </header>
    <main className="pl-wrap">
      <div className="pl-topline"><span>THE PLANNING ROOM / PHASE 04</span><span>{loaded ? (email ? `PRIVATE WORKSPACE · ${email}` : "SIGN IN REQUIRED") : "LOADING"}</span></div>
      {message && <div className="pl-message" role="status">{message} <button className="pl-mini" style={{float:"right"}} onClick={() => setMessage("")}>Dismiss</button></div>}
      {error && <div className="pl-error" role="alert">{error}</div>}
      {loaded && !userId && <div className="pl-empty">You&apos;re signed out. <Link href="/login" style={{textDecoration:"underline",fontWeight:800}}>Sign in to view your milestones.</Link></div>}
      <div className="pl-hero"><div><div className="pl-topline" style={{border:0,padding:0,margin:0}}>WORK WITH A DIRECTION</div><h1>Make a plan.<br/><em>Make it happen.</em></h1><p>Turn an ambitious project into meaningful checkpoints. Set target dates, connect tasks, and see what comes next.</p></div>
        <div className="pl-hero-side"><Link className="pl-button" href="/">← Back to workspace</Link><button className="pl-button primary" disabled={!projectId} onClick={() => addMilestone()}>＋ Add milestone</button></div>
      </div>
      <div className="pl-filters"><label>YOUR PROJECT <select className="pl-select" value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!projects.length}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <div className="pl-switch" aria-label="Timeline presentation"><button aria-pressed={mode === "Timeline"} onClick={() => setMode("Timeline")}>Timeline</button><button aria-pressed={mode === "List"} onClick={() => setMode("List")}>Checklist</button></div>
      </div>
      {loaded && userId && projects.length === 0 && <div className="pl-empty">Create a project in the workspace first. <Link href="/" style={{textDecoration:"underline"}}>Go to workspace</Link></div>}
      {project && <>
        <section className="pl-summary"><div className="pl-feature"><small>THE NEXT CHECKPOINT</small><h2>{next ? next.title : visible.length ? "Every milestone complete." : "Your roadmap starts here."}</h2><p>{next ? `Target date: ${prettyDate(next.target_date)}` : visible.length ? "You've finished every planned milestone." : "Add your first milestone to start planning."}</p></div>
          <div className="pl-stats"><div className="pl-stat-row"><span>Milestones completed</span><strong>{completed} / {visible.length}</strong></div><div className="pl-meter" aria-label={`${progress}% milestones complete`}><i style={{width:`${progress}%`}}/></div><div className="pl-stat-row"><span>Tasks in this project</span><strong>{projectTasks.length}</strong></div></div></section>
        <section aria-label="Project milestones">
          <div className="pl-section-head"><div><h2>{mode === "Timeline" ? "Your roadmap" : "Checkpoint list"}</h2><p>{project.name} · {visible.length} milestone{visible.length !== 1 ? "s" : ""} · dates and progress are saved to Supabase</p></div><span className="pl-tag">{progress}% COMPLETE</span></div>
          {!visible.length ? <div className="pl-empty"><strong>No milestones yet.</strong><p>Choose a meaningful goal, give it a target date, and build towards it.</p><button className="pl-button primary" style={{marginTop:15}} onClick={() => addMilestone()}>Create first milestone</button></div> : mode === "Timeline" ?
            <div className="pl-roadmap"><div className="pl-ruler"><div className="pl-ruler-side">CHECKPOINTS</div><div className="pl-ruler-track">{timeline.labels.map((label,i) => <span key={i} className={`pl-ruler-label ${i===0 ? "first" : i===4 ? "last" : ""}`} style={{left:`${i*25}%`}}>{label}</span>)}</div></div>
              {visible.map(m => { const linked=linkedFor(m.id); const done=linked.filter(t => t.status === "Done").length; return <div className="pl-row" key={m.id}><div className="pl-row-info"><button onClick={() => addMilestone(m)}>{m.title}</button><div><span className="pl-tag" data-status={m.status}>{m.status}</span></div><small>{prettyDate(m.target_date)} · {linked.length ? `${done}/${linked.length} linked tasks done` : "No tasks linked"}</small></div><div className="pl-rail"><div className="pl-rail-line"/><div className="pl-rail-now" style={{left:`${timeline.percent(todayDate)}%`}}><span>Today</span></div><button className="pl-pin" style={{left:`${timeline.percent(m.target_date)}%`}} data-status={m.status} aria-label={`Edit milestone ${m.title}`} onClick={() => addMilestone(m)}></button><span className="pl-rail-date" style={{left:`${timeline.percent(m.target_date)}%`}}>{prettyDate(m.target_date).replace(/, \d{4}$/,"")}</span></div></div>;})}
            </div>
          : <div className="pl-milestone-list">{visible.map(m => { const linked=linkedFor(m.id);return <div className="pl-milestone-card" key={m.id}><div><strong>{m.title}</strong><small>{prettyDate(m.target_date)} · {m.details || "No details added"}</small><small><span className="pl-tag" data-status={m.status}>{m.status}</span> · {linked.filter(t=>t.status === "Done").length} / {linked.length} linked tasks completed</small></div><div className="pl-actions"><button className="pl-mini" onClick={() => addMilestone(m)}>Edit</button><button className="pl-mini" onClick={() => void removeMilestone(m)}>Delete</button></div></div>;})}</div>}
        </section>
        <div className="pl-section-head"><div><h2>Connect the work</h2><p>Assign existing project tasks to their milestones. A task stays safe if its milestone is deleted.</p></div></div>
        <div className="pl-lists"><div className="pl-milestone-list">{visible.map(m => { const linked=linkedFor(m.id); const done=linked.filter(t=>t.status === "Done").length; return <div className="pl-milestone-card" key={m.id}><div><strong>{m.title}</strong><small>{prettyDate(m.target_date)} · {m.details || "Add details to this checkpoint."}</small><small>{linked.length ? `${done} of ${linked.length} connected tasks completed` : "No tasks attached yet"}</small></div><div className="pl-actions"><button className="pl-mini" onClick={() => addMilestone(m)}>Edit</button><button className="pl-mini" onClick={() => void removeMilestone(m)}>Delete</button></div></div>;})}{!visible.length && <div className="pl-empty">Create a milestone above to organize your tasks.</div>}</div>
          <aside className="pl-linked"><h3>Task connections</h3><p>Choose a checkpoint for each task. You can change this later without moving the task out of its project.</p>
            {projectTasks.length ? projectTasks.map(task => <div className="pl-linked-item" key={task.id}><strong>{task.title}</strong><small>{task.status}{task.due_date ? ` · Due ${prettyDate(task.due_date)}` : ""}</small><label htmlFor={`task-${task.id}`} style={{fontSize:11,fontWeight:800}}>Milestone</label><select id={`task-${task.id}`} value={task.milestone_id || ""} onChange={e => void assignTask(task,e.target.value || null)}><option value="">Not assigned</option>{visible.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>) : <div style={{fontSize:12,color:"#637264"}}>No tasks in this project yet. Add tasks from the workspace, then connect them here.</div>}
          </aside>
        </div>
      </>}
      <footer className="pl-foot"><span>TEAMSPACE / PLANNING WITH PURPOSE</span><span>Private project milestones · Supabase-backed · Team sharing not yet implemented</span></footer>
    </main>
    {showForm && <div className="pl-overlay" onMouseDown={e => {if (e.target === e.currentTarget && !busy) setShowForm(false);}}><section className="pl-dialog" role="dialog" aria-modal="true" aria-labelledby="milestone-title"><div className="pl-dialog-top"><h2 id="milestone-title">{editing ? "Edit milestone" : "New milestone"}</h2><button className="pl-x" type="button" aria-label="Close" disabled={busy} onClick={() => setShowForm(false)}>×</button></div>
      {error && <div className="pl-error" role="alert">{error}</div>}
      <form className="pl-form" onSubmit={e => void saveMilestone(e)}><label>Checkpoint title<input autoFocus required maxLength={120} value={draft.title} placeholder="e.g., Launch the first beta" onChange={e => setDraft(d => ({...d,title:e.target.value}))}/></label><label>Notes<textarea value={draft.details} maxLength={600} placeholder="What will be finished at this checkpoint?" onChange={e => setDraft(d => ({...d,details:e.target.value}))}/></label><label>Target date<input required type="date" value={draft.target_date} onChange={e => setDraft(d => ({...d,target_date:e.target.value}))}/></label><label>Status<select value={draft.status} onChange={e => setDraft(d => ({...d,status:e.target.value as MilestoneStatus}))}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label><div className="pl-form-bottom"><button type="button" className="pl-button" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button><button className="pl-button primary" disabled={busy || !draft.title.trim() || !draft.target_date}>{busy ? "Saving…" : editing ? "Save changes" : "Create milestone"}</button></div></form>
    </section></div>}
  </div>;
}
