"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SharedProject = { id: string; name: string; description: string; category: string };
type Task = { id: string; project_id: string; title: string; description: string; status: string; priority: string; due_date: string | null; labels: string[] | null; assigned_to: string | null };
type Milestone = { id: string; project_id: string; title: string; status: string; target_date: string; details: string };

const css = String.raw`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.sp{font:15px 'DM Sans',sans-serif;color:#20342b;background:#f6f5ee;min-height:100vh}.sp *{box-sizing:border-box}.sp h1,.sp h2,.sp h3,.sp p{margin:0}.sp :is(a,button,select):focus-visible{outline:3px solid #526be0;outline-offset:3px}.sp a{color:inherit;text-decoration:none}.sp-top{background:#182b23;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px max(24px,calc((100vw - 1200px)/2))}.sp-brand{font:700 23px 'Space Grotesk',sans-serif;letter-spacing:-.06em;display:flex;align-items:center;gap:9px}.sp-mark{display:grid;place-items:center;width:35px;height:35px;background:#e4f29f;border-radius:50%;color:#192b21}.sp-nav{display:flex;gap:8px;flex-wrap:wrap}.sp-nav a{padding:9px 14px;border:1px solid #50675a;border-radius:999px;font-size:12px;font-weight:800}.sp-nav a:hover,.sp-nav a[aria-current]{background:#e4f29f;color:#1b2f24;border-color:#e4f29f}
.sp-inner{max-width:1200px;margin:auto;padding:54px 24px 100px}.sp-kicker{font-size:11px;color:#69836a;letter-spacing:.17em;font-weight:800;text-transform:uppercase}.sp-title{font:700 clamp(44px,7vw,83px)/1 'Space Grotesk',sans-serif;letter-spacing:-.06em;margin:15px 0 18px}.sp-title em{font-style:normal;color:#759d7f}.sp-lead{max-width:670px;color:#627466;line-height:1.7}.sp-notice{background:#e9f0df;border:1px solid #ccdcbf;padding:14px 17px;margin:24px 0;border-radius:13px;line-height:1.6;font-size:13px}.sp-error{border-color:#e5b6ae;background:#fff1ed;color:#833c30}.sp-layout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:22px;margin-top:34px;align-items:start}.sp-sidebar{border:1px solid #d9dfd2;background:#fff;border-radius:20px;padding:21px}.sp-side-head{font:700 18px 'Space Grotesk',sans-serif;margin-bottom:17px}.sp-project{display:block;text-align:left;width:100%;background:#f7f8f3;border:1px solid #e1e7db;border-radius:12px;padding:16px;margin-bottom:10px;color:#263e30;cursor:pointer}.sp-project strong{display:block;font-size:14px;line-height:1.35}.sp-project small{display:block;color:#6d7c6c;margin-top:6px}.sp-project[aria-pressed='true']{border:2px solid #296244;background:#eaf2e5;padding:15px}.sp-project:hover{border-color:#52946c}.sp-main{min-width:0}.sp-head{border-radius:20px;background:#203a2d;color:#f6f7ed;padding:29px 32px;position:relative;overflow:hidden}.sp-head:after{content:'';position:absolute;right:-45px;top:-135px;width:320px;height:320px;border:1px solid #729076;border-radius:50%;box-shadow:0 0 0 50px #34533e5e,0 0 0 110px #597b5040;pointer-events:none}.sp-head h2{font:700 clamp(25px,4vw,39px)/1.08 'Space Grotesk',sans-serif;letter-spacing:-.045em;margin:9px 0}.sp-head p{color:#cbdacb;line-height:1.6;font-size:13px;max-width:480px}.sp-readonly{margin-top:20px;display:inline-flex;font-size:11px;font-weight:800;letter-spacing:.06em;padding:7px 11px;background:#e2f19d;color:#28402d;border-radius:99px}.sp-heading{font:700 23px 'Space Grotesk',sans-serif;margin:31px 0 13px}.sp-count{font-size:12px;color:#78907a;margin-left:10px}.sp-work{display:grid;gap:9px}.sp-task{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;border-radius:14px;background:#fff;border:1px solid #d9dfd1;padding:18px}.sp-task h3{font-size:15px;line-height:1.5}.sp-task p{color:#6c7b6e;font-size:12px;margin-top:5px;line-height:1.55}.sp-tags{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}.sp-tag{font-size:10px;background:#edf0e8;color:#4b6351;border-radius:999px;padding:4px 9px;font-weight:800}.sp-side{display:flex;flex-direction:column;gap:8px;align-items:end;font-size:11px;color:#637967;white-space:nowrap}.sp-status{font-size:10px;font-weight:800;padding:6px 9px;background:#e7f1e3;border-radius:30px;color:#326447}.sp-status.done{background:#dbeae0}.sp-status.progress{background:#e4ebfc;color:#3c60b6}.sp-milestones{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:11px}.sp-milestone{border:1px solid #d9dfd1;background:#fff;border-radius:15px;padding:20px}.sp-milestone h3{font-size:15px;margin:10px 0}.sp-milestone small{color:#62756a;line-height:1.5}.sp-empty{border:1px dashed #cbd7c9;padding:32px;background:#fff;border-radius:14px;color:#738372;text-align:center;font-size:13px}.sp-foot{font-size:12px;color:#79907f;border-top:1px solid #dae2d7;margin-top:40px;padding-top:22px}
@media(max-width:850px){.sp-layout{grid-template-columns:1fr}.sp-sidebar{display:flex;flex-wrap:wrap;gap:8px}.sp-side-head{width:100%;margin-bottom:5px}.sp-project{flex:1;min-width:170px;margin:0}}
@media(max-width:530px){.sp-top{padding:13px 16px;flex-wrap:wrap}.sp-nav{width:100%}.sp-inner{padding:38px 16px 60px}.sp-head{padding:25px 22px}.sp-task{grid-template-columns:1fr}.sp-side{align-items:start;flex-direction:row;justify-content:space-between;white-space:normal}}
`;

export default function SharedPage() {
  const [loading,setLoading] = useState(true);
  const [signedIn,setSignedIn] = useState(false);
  const [error,setError] = useState("");
  const [projects,setProjects] = useState<SharedProject[]>([]);
  const [tasks,setTasks] = useState<Task[]>([]);
  const [milestones,setMilestones] = useState<Milestone[]>([]);
  const [chosen,setChosen] = useState("");

  useEffect(()=>{
    let alive = true;
    async function load(){
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(!alive)return;
      if(authError||!user){setSignedIn(false);setLoading(false);return;}
      setSignedIn(true);
      const j=await supabase.rpc("team_my_joined_projects");
      if(!alive)return;
      if(j.error){setError(j.error.message);setLoading(false);return;}
      const ids=[...new Set((j.data||[]).map((r:{project_id:string})=>r.project_id))];
      if(!ids.length){setLoading(false);return;}
      const [p,t,m]=await Promise.all([
        supabase.from("projects").select("id,name,description,category").in("id",ids),
        supabase.from("tasks").select("id,project_id,title,description,status,priority,due_date,labels,assigned_to").in("project_id",ids).order("created_at",{ascending:false}),
        supabase.from("milestones").select("id,project_id,title,status,target_date,details").in("project_id",ids).order("target_date",{ascending:true})
      ]);
      if(!alive)return;
      if(p.error||t.error||m.error){setError(p.error?.message||t.error?.message||m.error?.message||"Unable to load shared project.");}
      else{
        const visible=(p.data||[]) as SharedProject[];
        setProjects(visible);setTasks((t.data||[]) as Task[]);setMilestones((m.data||[]) as Milestone[]);
        const preferred=new URLSearchParams(window.location.search).get("project");
        setChosen(visible.some(p=>p.id===preferred)?preferred!:visible[0]?.id||"");
      }
      setLoading(false);
    }
    void load();return()=>{alive=false;};
  },[]);
  const active=useMemo(()=>projects.find(p=>p.id===chosen),[projects,chosen]);
  const visibleTasks=useMemo(()=>tasks.filter(t=>t.project_id===chosen),[tasks,chosen]);
  const visibleMilestones=useMemo(()=>milestones.filter(m=>m.project_id===chosen),[milestones,chosen]);
  const completed=visibleTasks.filter(t=>t.status==="Done").length;

  return <div className="sp"><style>{css}</style>
    <header className="sp-top"><Link href="/" className="sp-brand"><span className="sp-mark">t✳</span> teamspace.</Link><nav className="sp-nav" aria-label="TeamSpace pages"><Link href="/">Workspace</Link><Link href="/plan">Plan</Link><Link href="/team">Team</Link><Link href="/shared" aria-current="page">Shared with me</Link><Link href="/collaborate">Collaborate</Link></nav></header>
    <main className="sp-inner">
      <p className="sp-kicker">TeamSpace / Shared with me</p><h1 className="sp-title">Inside the <em>work.</em></h1>
      <p className="sp-lead">Explore projects shared with you. Viewers can discuss tasks; editors can also update task status and descriptions in the collaboration room.</p>
      <div className="sp-notice"><strong>Role-based access.</strong> Viewers may read and comment. Editors may also update tasks. Project owners control invitations, assignments, and member roles.</div>
      {error&&<div role="alert" className="sp-notice sp-error">{error}</div>}
      {loading&&<div role="status" className="sp-empty">Loading your shared projects…</div>}
      {!loading&&!signedIn&&<div className="sp-empty">Sign in to view invited projects. <Link href="/login" style={{textDecoration:"underline"}}>Open sign in</Link></div>}
      {!loading&&signedIn&&projects.length===0&&<div className="sp-empty">No shared projects yet. Accept an invitation through <Link href="/team" style={{textDecoration:"underline"}}>Team</Link>, then return here.</div>}
      {!loading&&signedIn&&active&&<div className="sp-layout">
        <aside className="sp-sidebar"><h2 className="sp-side-head">Your shared projects</h2>{projects.map(p=><button type="button" className="sp-project" key={p.id} aria-pressed={chosen===p.id} onClick={()=>setChosen(p.id)}><strong>{p.name}</strong><small>{p.category}</small></button>)}</aside>
        <div className="sp-main">
          <section className="sp-head"><div className="sp-kicker" style={{color:"#c2ecae"}}>Invited workspace</div><h2>{active.name}</h2><p>{active.description||"A project shared with you."}</p><div className="sp-readonly"><Link href={`/collaborate?project=${encodeURIComponent(active.id)}`}>OPEN COLLABORATION ROOM ↗</Link></div></section>
          <h2 className="sp-heading">Work in motion <span className="sp-count">{completed}/{visibleTasks.length} tasks complete</span></h2>
          <div className="sp-work">{visibleTasks.length===0&&<div className="sp-empty">No tasks in this project yet.</div>}{visibleTasks.map(t=><article className="sp-task" key={t.id}>
            <div><h3>{t.title}</h3>{t.description&&<p>{t.description}</p>}<div className="sp-tags"><span className="sp-tag">{t.priority} priority</span>{(t.labels||[]).map(tag=><span key={tag} className="sp-tag">{tag}</span>)}</div></div>
            <div className="sp-side"><span className={`sp-status ${t.status==="Done"?"done":t.status==="In progress"?"progress":""}`}>{t.status}</span>{t.due_date&&<span>Due {t.due_date}</span>}{t.assigned_to&&<span>Assigned to a member</span>}</div>
          </article>)}</div>
          <h2 className="sp-heading">Milestones <span className="sp-count">{visibleMilestones.length}</span></h2>
          <div className="sp-milestones">{visibleMilestones.length===0&&<div className="sp-empty">No milestones in this project yet.</div>}{visibleMilestones.map(m=><article className="sp-milestone" key={m.id}><div className="sp-kicker">{m.status}</div><h3>{m.title}</h3><small>Target {m.target_date}</small>{m.details&&<p style={{color:"#5f7364",fontSize:12,marginTop:10,lineHeight:1.6}}>{m.details}</p>}</article>)}</div>
        </div>
      </div>}
      <footer className="sp-foot">TeamSpace · Project access is enforced by Supabase Row Level Security. <Link href="/team" style={{textDecoration:"underline"}}>Manage membership</Link></footer>
    </main>
  </div>;
}
