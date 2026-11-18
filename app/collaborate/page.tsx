"use client";

import Link from "next/link";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Project = { id:string; name:string; description:string; user_id:string };
type Task = { id:string; project_id:string; title:string; description:string; status:string; priority:string; due_date:string|null; assigned_to:string|null; labels:string[]|null };
type Membership = { project_id:string; role:string };
type Comment = { id:string; task_id:string; project_id:string; author_id:string; body:string; created_at:string; updated_at:string };
type Activity = { id:string; actor_id:string|null; task_id:string|null; action:string; summary:string; created_at:string };
type Notification = { id:string; project_id:string|null; task_id:string|null; kind:string; message:string; read_at:string|null; created_at:string };
type User = { id:string; email:string };
const statuses = ["To do","In progress","Done"];
const shortDate = (value:string|null|undefined) => value ? value.slice(0,10) : "";
const shortId=(id:string)=>id.slice(0,7);

const css=String.raw`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.cr{--ink:#20352b;--forest:#193a2b;--muted:#65756a;--line:#dce4d8;--paper:#f7f7f0;--accent:#d8f09c;min-height:100vh;background:var(--paper);color:var(--ink);font:14px 'DM Sans',sans-serif}
.cr *{box-sizing:border-box}.cr :where(h1,h2,h3,p){margin:0}.cr button,.cr select,.cr input,.cr textarea{font:inherit}.cr button{cursor:pointer}.cr :is(button,a,input,select,textarea):focus-visible{outline:3px solid #5d72dc;outline-offset:3px}.cr a{text-decoration:none;color:inherit}.cr-head{background:#193528;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:16px max(24px,calc((100vw - 1300px)/2));flex-wrap:wrap}
.cr-brand{font:700 24px 'Space Grotesk',sans-serif;letter-spacing:-1.5px;display:flex;align-items:center;gap:10px}.cr-logo{background:#e0f39e;color:#1a3b2a;border-radius:12px;width:35px;height:35px;display:grid;place-items:center;font-size:22px}.cr-nav{display:flex;flex-wrap:wrap;gap:5px}.cr-nav a{padding:9px 12px;color:#d3e6d4;font-size:12px;font-weight:700;border-radius:99px}.cr-nav a:hover,.cr-nav a[aria-current]{color:#1b3527;background:#e0f39e}
.cr-container{max-width:1300px;margin:auto;padding:42px 24px 95px}.cr-overline{font-size:11px;font-weight:800;letter-spacing:.19em;text-transform:uppercase;color:#63866f}.cr-title{font:700 clamp(38px,5vw,66px)/1.02 'Space Grotesk',sans-serif;letter-spacing:-.055em;margin:12px 0}.cr-title em{font-style:normal;color:#789880}.cr-intro{max-width:750px;color:#66776c;line-height:1.65}.cr-hint{margin-top:20px;background:#eaf1de;border:1px solid #d2dfc7;padding:13px 17px;border-radius:12px;font-size:12px;line-height:1.6}.cr-grid{margin-top:30px;display:grid;grid-template-columns:minmax(200px,260px) minmax(350px,1.3fr) minmax(280px,360px);gap:18px;align-items:start}.cr-panel{border:1px solid var(--line);background:white;border-radius:22px;overflow:hidden;box-shadow:0 8px 32px #1733260b}.cr-pad{padding:22px}.cr-section{font:700 20px 'Space Grotesk',sans-serif;letter-spacing:-.6px;margin-bottom:11px}.cr-small{font-size:12px;color:var(--muted);line-height:1.6}.cr-side{position:sticky;top:15px}.cr-project{display:block;width:100%;text-align:left;margin-top:8px;border:1px solid #e1e7dc;border-radius:13px;background:#f8faf5;padding:15px;color:var(--ink)}.cr-project[aria-pressed='true']{background:#e9f2de;border-color:#659b6a}.cr-project strong{display:block;font-size:13px}.cr-project small{font-size:11px;color:#687e6c;display:block;margin-top:5px}.cr-badge{display:inline-block;padding:5px 10px;border-radius:99px;background:#e3edda;color:#36533b;font-weight:800;font-size:10px;letter-spacing:.05em;text-transform:uppercase}.cr-badge.owner{background:#d7eafc;color:#30527d}.cr-badge.editor{background:#f9e7b8;color:#765b20}.cr-badge.member{background:#ecede9;color:#576356}
.cr-project-hero{background:#1d3a2b;color:white;padding:25px;position:relative;overflow:hidden}.cr-project-hero:after{content:'';position:absolute;width:210px;height:210px;border:1px solid #68896a;border-radius:50%;right:-75px;top:-90px;box-shadow:0 0 0 35px #63876c33,0 0 0 80px #63876c18;pointer-events:none}.cr-project-hero h2{font:700 30px 'Space Grotesk',sans-serif;letter-spacing:-1.4px;max-width:400px;margin:10px 0}.cr-project-hero p{color:#ccddcf;max-width:450px;font-size:12px;line-height:1.6}.cr-stats{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:17px}.cr-stats span{background:#f2f6e9;border-radius:99px;padding:7px 11px;font-size:11px;font-weight:700}.cr-tasklist{display:grid;gap:8px;margin-top:15px}.cr-task{width:100%;border:1px solid #e1e8dc;background:#fff;border-radius:13px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;text-align:left;gap:8px;padding:15px}.cr-task[aria-pressed='true']{border:2px solid #557a4e;padding:14px;background:#f8fbf4}.cr-task strong{display:block;font-size:13px;line-height:1.35}.cr-task small{display:block;font-size:11px;color:var(--muted);margin-top:5px}.cr-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#e8bc6f;margin-right:6px}.cr-dot[data-state='Done']{background:#519b7b}.cr-dot[data-state='In progress']{background:#738ed2}.cr-due{font-size:10px;color:#597166;white-space:nowrap}.cr-taskdone{text-decoration:line-through;color:#819088}
.cr-detail{border-top:1px solid var(--line);margin-top:23px;padding-top:20px}.cr-detail h3{font:700 19px 'Space Grotesk',sans-serif;margin-bottom:12px}.cr-field{display:grid;gap:7px;margin-top:14px}.cr-field label{font-size:11px;text-transform:uppercase;letter-spacing:.09em;font-weight:800;color:#627a66}.cr-field textarea,.cr-field select,.cr-field input{width:100%;border:1px solid #cbd9ca;border-radius:11px;padding:11px 12px;color:#263c2f;background:#fff;min-height:42px}.cr-field textarea{min-height:95px;resize:vertical}.cr-primary{border:0;border-radius:11px;padding:12px 16px;background:#26543b;color:#fff;font-weight:800}.cr-primary:hover{background:#396d4e}.cr-primary:disabled{opacity:.5;cursor:wait}.cr-outline{border:1px solid #d2dfce;border-radius:10px;padding:9px 13px;background:#f2f6ec;color:#345440;font-size:12px;font-weight:800}.cr-outline:hover{background:#e4eee0}.cr-alert{background:#e6f5df;color:#246136;border:1px solid #b9dbae;padding:13px 16px;border-radius:12px;margin-top:18px}.cr-alert.error{background:#fff1eb;color:#8e4031;border-color:#ecc9bb}.cr-empty{padding:19px;background:#f9faf6;border:1px dashed #cfdbcd;border-radius:12px;color:#6d7c70;font-size:12px;line-height:1.6}.cr-message{border-top:1px solid #e5eae2;padding:13px 0}.cr-message:first-child{border-top:0}.cr-author{font-weight:800;font-size:11px;color:#31533d}.cr-date{font-size:10px;color:#839084}.cr-message p{font-size:12px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:8px}.cr-comment-tools{display:flex;gap:7px;margin-top:8px}.cr-thread{max-height:380px;overflow:auto;padding-right:4px}.cr-activity{display:grid;gap:13px;margin-top:15px}.cr-activity-item{border-left:2px solid #bdd2b4;padding-left:12px}.cr-activity-item strong{font-size:11px}.cr-activity-item small{display:block;color:#77877c;font-size:10px;margin-top:4px}.cr-aside-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.cr-count{border-radius:50px;padding:5px 9px;background:#f6e6ab;font-weight:800;font-size:11px}.cr-note{padding:12px;border:1px solid #e1e6da;border-radius:12px;margin-top:9px}.cr-note.unread{background:#fffbea;border-color:#e9dba7}.cr-note p{font-size:11px;line-height:1.5;margin:6px 0}.cr-note small{color:#7d897a;font-size:10px}.cr-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:13px}.cr-toolbar a{font-weight:800;font-size:12px;text-decoration:underline;text-underline-offset:3px}.cr-rightstack{display:grid;gap:18px}.cr-footer{border-top:1px solid #dae4d5;margin-top:35px;padding-top:20px;color:#788778;font-size:11px}
@media(max-width:1080px){.cr-grid{grid-template-columns:240px minmax(0,1fr)}.cr-rightstack{grid-column:1/-1;grid-template-columns:1fr 1fr}.cr-side{position:static}}
@media(max-width:710px){.cr-grid{grid-template-columns:1fr}.cr-rightstack{grid-template-columns:1fr}.cr-container{padding:30px 16px 70px}.cr-head{padding:14px 16px}.cr-title{font-size:41px}.cr-project-hero{padding:21px}.cr-project-hero h2{font-size:25px}}
@media(prefers-reduced-motion:reduce){.cr *{animation:none!important;transition:none!important}}
`;

export default function CollaboratePage(){
 const [user,setUser]=useState<User|null>(null);
 const [loading,setLoading]=useState(true);
 const [projects,setProjects]=useState<Project[]>([]);
 const [roles,setRoles]=useState<Membership[]>([]);
 const [projectId,setProjectId]=useState("");
 const [tasks,setTasks]=useState<Task[]>([]);
 const [taskId,setTaskId]=useState("");
 const [comments,setComments]=useState<Comment[]>([]);
 const [activity,setActivity]=useState<Activity[]>([]);
 const [notifications,setNotifications]=useState<Notification[]>([]);
 const [draftComment,setDraftComment]=useState("");
 const [editComment,setEditComment]=useState<string|null>(null);
 const [editText,setEditText]=useState("");
 const [descriptionDraft,setDescriptionDraft]=useState<{taskId:string;value:string}|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");

 const loadNotifications=useCallback(async(id:string)=>{
   const {data,error:e}=await supabase.from("team_notifications").select("id,project_id,task_id,kind,message,read_at,created_at").eq("recipient_id",id).order("created_at",{ascending:false}).limit(40);
   if(!e)setNotifications((data||[]) as Notification[]); else setError(e.message);
 },[]);
 // Authentication and database data are external sources. Update React state
 // from the completed async response, not synchronously from an effect.
 useEffect(()=>{
   let mounted=true;
   void supabase.auth.getUser().then(async ({data:{user:current},error:authError})=>{
     if(!mounted)return;
     if(authError || !current){setUser(null);setLoading(false);return;}
     setUser({id:current.id,email:current.email||""});
     const [p,m]=await Promise.all([
       supabase.from("projects").select("id,name,description,user_id").order("created_at",{ascending:false}).limit(100),
       supabase.from("team_memberships").select("project_id,role").eq("member_id",current.id)
     ]);
     if(!mounted)return;
     if(p.error||m.error)setError(p.error?.message||m.error?.message||"Unable to load projects.");
     else{
       const items=(p.data||[]) as Project[];
       setProjects(items);setRoles((m.data||[]) as Membership[]);
       setProjectId(previous=>{
         const desired=new URLSearchParams(window.location.search).get("project");
         return items.some(x=>x.id===previous)?previous:(items.some(x=>x.id===desired)?desired!:items[0]?.id||"");
       });
     }
     await loadNotifications(current.id);
     if(mounted)setLoading(false);
   }).catch(e=>{if(mounted){setError(e instanceof Error?e.message:"Could not load projects.");setLoading(false);}});
   return ()=>{mounted=false;};
 },[loadNotifications]);

 const activeProject=useMemo(()=>projects.find(p=>p.id===projectId),[projects,projectId]);
 const role=activeProject?.user_id===user?.id?"owner":roles.find(m=>m.project_id===projectId)?.role||"member";
 const editable=role==="owner"||role==="editor";
 const task=useMemo(()=>tasks.find(t=>t.id===taskId),[tasks,taskId]);
 const description = descriptionDraft !== null && task !== undefined && descriptionDraft.taskId === task.id
  ? descriptionDraft.value
  : (task?.description ?? "");
 const unread=notifications.filter(n=>!n.read_at).length;
 const complete=tasks.filter(t=>t.status==="Done").length;

 const loadWork=useCallback(async(id:string)=>{
   const [t,a]=await Promise.all([
     supabase.from("tasks").select("id,project_id,title,description,status,priority,due_date,assigned_to,labels").eq("project_id",id).order("created_at",{ascending:false}).limit(200),
     supabase.from("team_activity").select("id,actor_id,task_id,action,summary,created_at").eq("project_id",id).order("created_at",{ascending:false}).limit(30)
   ]);
   if(t.error||a.error){setError(t.error?.message||a.error?.message||"Could not load project work.");return;}
   const list=(t.data||[]) as Task[];setTasks(list);setActivity((a.data||[]) as Activity[]);
   setTaskId(prev=>list.some(item=>item.id===prev)?prev:(list[0]?.id||""));
 },[]);
 // Fetching inside Effects is appropriate for synchronizing remote data.
 // The active flag prevents an old project's response from replacing a new one.
 useEffect(()=>{
   if(!projectId)return;
   let active=true;
   const work=Promise.all([
     supabase.from("tasks").select("id,project_id,title,description,status,priority,due_date,assigned_to,labels").eq("project_id",projectId).order("created_at",{ascending:false}).limit(200),
     supabase.from("team_activity").select("id,actor_id,task_id,action,summary,created_at").eq("project_id",projectId).order("created_at",{ascending:false}).limit(30)
   ]);
   void work.then(([t,a])=>{
     if(!active)return;
     if(t.error||a.error){setError(t.error?.message||a.error?.message||"Could not load project work.");return;}
     const list=(t.data||[]) as Task[];
     setTasks(list);setActivity((a.data||[]) as Activity[]);
     setTaskId(prev=>list.some(item=>item.id===prev)?prev:(list[0]?.id||""));
   });
   return ()=>{active=false;};
 },[projectId]);
 const loadComments=useCallback(async(id:string)=>{
   const {data,error:e}=await supabase.from("task_comments").select("id,task_id,project_id,author_id,body,created_at,updated_at").eq("task_id",id).order("created_at",{ascending:true}).limit(150);
   if(e)setError(e.message);else setComments((data||[]) as Comment[]);
 },[]);
 useEffect(()=>{
   if(!taskId)return;
   let active=true;
   void supabase.from("task_comments")
     .select("id,task_id,project_id,author_id,body,created_at,updated_at")
     .eq("task_id",taskId).order("created_at",{ascending:true}).limit(150)
     .then(({data,error:e})=>{
       if(!active)return;
       if(e)setError(e.message);else setComments((data||[]) as Comment[]);
     });
   return ()=>{active=false;};
 },[taskId]);

 async function changeStatus(value:string){
   if(!task||!editable||!statuses.includes(value))return;
   setBusy(true);setError("");setNotice("");
   const {data,error:e}=await supabase.from("tasks").update({status:value}).eq("id",task.id).select("id").single();
   if(e||!data)setError(e?.message||"No task was updated. Check your project role.");
   else{setNotice("Task status saved.");await loadWork(task.project_id);if(user)await loadNotifications(user.id);}
   setBusy(false);
 }
 async function saveDescription(){
   if(!task||!editable||description.length>400)return;
   setBusy(true);setError("");setNotice("");
   const {data,error:e}=await supabase.from("tasks").update({description}).eq("id",task.id).select("id").single();
   if(e||!data)setError(e?.message||"Edit was not saved. Check your project role.");
   else{setDescriptionDraft(null);setNotice("Task description saved.");await loadWork(task.project_id);}
   setBusy(false);
 }
 async function submitComment(e:FormEvent){
   e.preventDefault();if(!task||!user||!draftComment.trim()||busy)return;
   setBusy(true);setError("");setNotice("");
   const result=await supabase.from("task_comments").insert({task_id:task.id,project_id:task.project_id,author_id:user.id,body:draftComment.trim()}).select("id").single();
   if(result.error)setError(result.error.message);
   else{setDraftComment("");setNotice("Comment posted.");await Promise.all([loadComments(task.id),loadWork(task.project_id),loadNotifications(user.id)]);}
   setBusy(false);
 }
 async function saveComment(id:string){
   if(!editText.trim()||editText.length>1200)return;
   setBusy(true);setError("");
   const {data,error:e}=await supabase.from("task_comments").update({body:editText.trim()}).eq("id",id).select("id").single();
   if(e||!data)setError(e?.message||"Unable to edit comment.");else{setEditComment(null);if(task)await loadComments(task.id);}
   setBusy(false);
 }
 async function deleteComment(id:string){
   if(!window.confirm("Delete your comment?"))return;
   setBusy(true);setError("");
   const {error:e}=await supabase.from("task_comments").delete().eq("id",id);
   if(e)setError(e.message);else if(task)await loadComments(task.id);
   setBusy(false);
 }
 async function markRead(id?:string){
   if(!user)return;
   setBusy(true);setError("");
   let q=supabase.from("team_notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",user.id).is("read_at",null);
   if(id)q=q.eq("id",id);
   const {error:e}=await q;
   if(e)setError(e.message);else await loadNotifications(user.id);
   setBusy(false);
 }
 async function refresh(){
   setError("");setNotice("");
   if(projectId)await loadWork(projectId);
   if(taskId)await loadComments(taskId);
   if(user)await loadNotifications(user.id);
 }

 return <main className="cr"><style>{css}</style>
  <header className="cr-head"><Link className="cr-brand" href="/"><span className="cr-logo">t✳</span>teamspace.</Link><nav className="cr-nav" aria-label="Site navigation"><Link href="/">Focus / Map / Flow</Link><Link href="/plan">Plan</Link><Link href="/team">Team</Link><Link href="/shared">Shared</Link><Link href="/collaborate" aria-current="page">Collaborate {unread?`(${unread})`:""}</Link></nav></header>
  <div className="cr-container">
   <p className="cr-overline">The collaboration room / TeamSpace</p><h1 className="cr-title">Make progress <em>together.</em></h1>
   <p className="cr-intro">One place to review shared work, discuss tasks, follow project activity, and catch up on notifications. The owner controls assignments and access. Editors can update task content and status.</p>
   <div className="cr-hint"><strong>Permission guide:</strong> Owners manage projects, members, and assignments. Editors can update task status and descriptions. Viewers can read and comment. All permissions are also enforced in PostgreSQL.</div>
   {error&&<div className="cr-alert error" role="alert">{error}</div>}{notice&&<div className="cr-alert" role="status">{notice}</div>}
   {loading&&<div className="cr-empty" style={{marginTop:22}}>Checking your account…</div>}
   {!loading&&!user&&<div className="cr-empty" style={{marginTop:22}}>Please <Link href="/login" style={{textDecoration:"underline"}}>sign in</Link> to collaborate.</div>}
   {!loading&&user&&projects.length===0&&<div className="cr-empty" style={{marginTop:22}}>No projects available. Create one in <Link href="/" style={{textDecoration:"underline"}}>Focus</Link>, or accept an invitation in <Link href="/team" style={{textDecoration:"underline"}}>Team</Link>.</div>}
   {!loading&&user&&projects.length>0&&<div className="cr-grid">
    <aside className="cr-panel cr-side"><div className="cr-pad"><div className="cr-section">Projects</div><p className="cr-small">Owned and shared with you.</p>
      {projects.map(p=><button type="button" key={p.id} className="cr-project" aria-pressed={p.id===projectId} onClick={()=>{setProjectId(p.id);setTasks([]);setActivity([]);setTaskId("");setComments([]);setEditComment(null);setEditText("");setDescriptionDraft(null);setNotice("");setError("");}}><strong>{p.name}</strong><small>{p.user_id===user.id?"Your project":(roles.find(r=>r.project_id===p.id)?.role==="editor"?"Editor access":"Viewer access")}</small></button>)}
      <div className="cr-toolbar"><Link href="/team">Manage members</Link><Link href="/plan">Milestone plan</Link></div></div></aside>
    <section className="cr-panel">
      {activeProject&&<><div className="cr-project-hero"><span className="cr-badge" style={{background:"#e6f2a1",color:"#23402d"}}>{role} access</span><h2>{activeProject.name}</h2><p>{activeProject.description||"Your project workroom."}</p></div>
      <div className="cr-pad"><div className="cr-section">Tasks in motion</div><p className="cr-small">{complete} of {tasks.length} complete · Select any task to open its discussion.</p>
      <div className="cr-tasklist">{!tasks.length&&<div className="cr-empty">No tasks yet. The owner can add tasks in Focus / Map / Flow.</div>}
      {tasks.map(t=><button type="button" className="cr-task" key={t.id} aria-pressed={taskId===t.id} onClick={()=>{setTaskId(t.id);setComments([]);setEditComment(null);setEditText("");setDescriptionDraft(null);}}><span><strong className={t.status==="Done"?"cr-taskdone":""}><span className="cr-dot" data-state={t.status}/>{t.title}</strong><small>{t.priority} priority · {t.status}</small></span>{t.due_date&&<span className="cr-due">Due {shortDate(t.due_date)}</span>}</button>)}</div>
      {task&&<div className="cr-detail"><span className="cr-overline">Selected task · {shortId(task.id)}</span><h3 style={{marginTop:8}}>{task.title}</h3><p className="cr-small">{task.assigned_to?`Assigned to account ${shortId(task.assigned_to)}`:"Unassigned"}{task.labels?.length?` · ${task.labels.join(", ")}`:""}</p>
        <div className="cr-field"><label htmlFor="cr-status">Status</label><select id="cr-status" disabled={!editable||busy} value={task.status} onChange={e=>void changeStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        <div className="cr-field"><label htmlFor="cr-description">Description</label><textarea id="cr-description" value={description} maxLength={400} readOnly={!editable} onChange={e=>{if(task)setDescriptionDraft({taskId:task.id,value:e.target.value});}}/></div>
        {editable&&<div className="cr-toolbar"><button className="cr-primary" disabled={busy||description===(task.description||"")} onClick={()=>void saveDescription()}>Save task changes</button></div>}
        {!editable&&<p className="cr-small" style={{marginTop:12}}>Viewer access: you can read tasks and join the discussion, but only editors or owners may update tasks.</p>}
        <div className="cr-detail"><div className="cr-section">Discussion <span className="cr-badge">{comments.length}</span></div>
          <div className="cr-thread" aria-live="polite">{comments.length===0&&<div className="cr-empty">Start the discussion about this task.</div>}
          {comments.map(c=><article key={c.id} className="cr-message"><div className="cr-author">{c.author_id===user.id?"You":c.author_id===activeProject.user_id?"Project owner":"Teammate"} <span className="cr-date">· {shortDate(c.created_at)}</span></div>
            {editComment===c.id?<div className="cr-field"><textarea aria-label="Edit comment" maxLength={1200} value={editText} onChange={e=>setEditText(e.target.value)}/><div className="cr-toolbar"><button className="cr-outline" disabled={busy||!editText.trim()} onClick={()=>void saveComment(c.id)}>Save</button><button className="cr-outline" onClick={()=>setEditComment(null)}>Cancel</button></div></div>:<p>{c.body}</p>}
            {c.author_id===user.id&&editComment!==c.id&&<div className="cr-comment-tools"><button type="button" className="cr-outline" onClick={()=>{setEditComment(c.id);setEditText(c.body);}}>Edit</button><button type="button" className="cr-outline" onClick={()=>void deleteComment(c.id)}>Delete</button></div>}
          </article>)}</div>
          <form onSubmit={e=>void submitComment(e)}><div className="cr-field"><label htmlFor="cr-write">Add a comment</label><textarea id="cr-write" maxLength={1200} placeholder="Ask a question, share progress, or leave a handoff note…" value={draftComment} onChange={e=>setDraftComment(e.target.value)}/></div><div className="cr-toolbar"><button type="submit" className="cr-primary" disabled={!draftComment.trim()||busy}>Post comment</button><span className="cr-small">{draftComment.length}/1200</span></div></form>
        </div>
      </div>}
      </div></>}
    </section>
    <div className="cr-rightstack"><section className="cr-panel cr-pad"><div className="cr-aside-head"><h2 className="cr-section" style={{margin:0}}>Inbox</h2><span className="cr-count">{unread} new</span></div><div className="cr-toolbar"><button type="button" className="cr-outline" disabled={!unread||busy} onClick={()=>void markRead()}>Mark all read</button><button type="button" className="cr-outline" onClick={()=>void refresh()}>Refresh</button></div>
      {notifications.length===0&&<p className="cr-small" style={{marginTop:14}}>No notifications yet. Assignments and comments will appear here.</p>}
      {notifications.map(n=><div className={`cr-note ${n.read_at?"":"unread"}`} key={n.id}><span className="cr-badge">{n.kind}</span><p>{n.message}</p><small>{shortDate(n.created_at)}</small>{!n.read_at&&<button type="button" className="cr-outline" style={{marginLeft:7}} disabled={busy} onClick={()=>void markRead(n.id)}>Read</button>}{n.project_id&&<button type="button" className="cr-outline" style={{marginLeft:7}} onClick={()=>{setProjectId(n.project_id!);if(n.task_id)setTaskId(n.task_id);}}>Open</button>}</div>)}
    </section><section className="cr-panel cr-pad"><h2 className="cr-section">Activity</h2><p className="cr-small">Recent changes in this project, recorded in the database.</p><div className="cr-activity">{activity.length===0&&<p className="cr-small">New activity will appear as tasks change and people comment.</p>}{activity.map(a=><div key={a.id} className="cr-activity-item"><strong>{a.summary}</strong><small>{shortDate(a.created_at)} · {a.actor_id===user.id?"You":"Team"}</small></div>)}</div></section></div>
   </div>}
   <footer className="cr-footer">TeamSpace · Collaboration room · Supabase-enforced access · Notifications refresh on demand</footer>
  </div>
 </main>;
}
