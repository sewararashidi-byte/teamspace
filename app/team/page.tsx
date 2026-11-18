"use client";

import Link from "next/link";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type OwnedProject = { id: string; name: string };
type Member = { project_id: string; member_id: string; member_email: string; role: string; joined_at: string };
type JoinedProject = { project_id: string; project_name: string; joined_at: string };
type AssignedTask = { id: string; project_id: string; title: string; assigned_to: string | null; status: string };

const styles = String.raw`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.team{--forest:#192e25;--paper:#f7f6ef;--ink:#23322a;--muted:#6c786f;--line:#d9dfd3;--lime:#e1fa9a; font:15px 'DM Sans',sans-serif;background:var(--paper);color:var(--ink);min-height:100vh}
.team *, .team *:before,.team *:after{box-sizing:border-box}.team h1,.team h2,.team h3,.team p{margin:0}.team button,.team input,.team select{font:inherit}.team button{cursor:pointer}.team :is(button,a,input,select):focus-visible{outline:3px solid #486be6;outline-offset:3px}
.team-top{height:82px;background:var(--forest);color:white;display:flex;align-items:center;justify-content:space-between;padding:0 max(30px,calc((100vw - 1220px)/2));gap:22px}.team-brand{font:700 22px 'Space Grotesk',sans-serif;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}.team-logo{width:38px;height:38px;border-radius:14px;background:var(--lime);color:#18362a;display:grid;place-items:center;font-size:22px}.team-topnav{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.team-topnav a{text-decoration:none;color:#dfebe0;border-radius:100px;padding:10px 16px;font-size:13px;font-weight:700}.team-topnav a[aria-current]{background:var(--lime);color:var(--forest)}.team-topnav a:hover{background:#365044;color:white}
.team-inner{width:min(1220px,calc(100% - 60px));margin:0 auto;padding:45px 0 90px}.team-eyebrow{font-size:11px;font-weight:800;letter-spacing:.19em;text-transform:uppercase;color:#528168}.team-title{font:700 clamp(42px,6.2vw,78px)/.99 'Space Grotesk',sans-serif;letter-spacing:-.055em;margin:15px 0 15px}.team-title em{font-style:normal;color:#4f7e64}.team-intro{max-width:700px;line-height:1.7;color:#5c6d63;font-size:16px}
.team-banner{margin:29px 0;background:#eaf0df;border:1px solid #d3dfcb;border-radius:16px;padding:15px 19px;font-size:13px;line-height:1.5;color:#375842}.team-banner strong{color:#203f2d}
.team-layout{display:grid;grid-template-columns:minmax(0,1.03fr) minmax(0,.97fr);gap:26px;margin-top:28px;align-items:start}.team-panel{background:#fff;border:1px solid var(--line);border-radius:24px;overflow:hidden;box-shadow:0 8px 32px #0b2b1510}.team-pad{padding:30px}.team-panel h2{font:700 25px 'Space Grotesk',sans-serif;letter-spacing:-.035em}.team-panel .sub{color:var(--muted);line-height:1.6;font-size:13px;margin-top:8px}.team-kicker{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.17em;color:#668875;margin-bottom:12px}
.team-invite-top{background:var(--forest);color:#f4f7eb;padding:33px 32px;position:relative;overflow:hidden}.team-invite-top::after{content:'';position:absolute;border:1px solid #65866d;border-radius:50%;width:260px;height:260px;right:-80px;bottom:-163px;box-shadow:0 0 0 40px #294b383d,0 0 0 85px #31543e39;pointer-events:none}.team-invite-top h2{font-size:34px;max-width:360px;line-height:1.12}.team-invite-top p{font-size:13px;color:#c6d3c6;margin-top:15px;line-height:1.6;max-width:340px}
.team label{font-size:12px;font-weight:800;display:block;margin-bottom:8px;color:#394d40}.team select,.team input{width:100%;padding:13px 14px;border:1px solid #cbd6c9;border-radius:11px;background:#fff;color:var(--ink);min-height:46px}.team .primary{background:#264a37;color:white;border:1px solid #264a37;border-radius:11px;padding:13px 18px;font-weight:800;margin-top:17px}.team .primary:hover{background:#365e46}.team .primary:disabled{opacity:.5;cursor:not-allowed}.team .secondary{background:#f0f4e9;color:#2f4b36;border:1px solid #ccd9c9;border-radius:10px;padding:9px 12px;font-weight:800;font-size:12px}.team .secondary:hover{background:#e3edd9}.team .danger{background:white;border:1px solid #e6b8b1;color:#9a3c2e;border-radius:9px;font-size:12px;padding:8px 11px;font-weight:800}.team .muted{color:#6c786f;font-size:12px;line-height:1.6}.team .divider{border-top:1px solid var(--line);margin:26px 0}.team .linkrow{margin-top:15px;display:flex;gap:9px;align-items:center}.team .linkrow input{font:12px ui-monospace,monospace;min-width:0}.team-note{padding:12px 15px;border-radius:12px;background:#f1f5ed;color:#465f4a;font-size:12px;line-height:1.6;margin-top:15px}
.team-list{margin-top:20px;display:grid;gap:10px}.team-member{display:flex;align-items:center;gap:12px;background:#f8f9f4;border:1px solid #e0e4db;border-radius:13px;padding:12px}.team-avatar{width:39px;height:39px;background:#dbe9d7;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:800;color:#325342;flex:none}.team-memberinfo{flex:1;min-width:0}.team-memberinfo strong{display:block;font-size:13px;overflow-wrap:anywhere}.team-memberinfo small{display:block;font-size:11px;color:#778278;margin-top:3px}.team-empty{border:1px dashed #cfd8cb;border-radius:13px;padding:23px;color:#6d7c70;font-size:13px;text-align:center;background:#fafbf7}
.team-joined{margin-top:26px;background:#fff;border:1px solid var(--line);padding:26px 30px;border-radius:22px}.team-joined h2{font:700 25px 'Space Grotesk',sans-serif}.team-joined-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:13px;margin-top:18px}.team-joined-item{padding:20px;border-radius:14px;background:#f6f8f2;border:1px solid #dce4d7}.team-joined-item strong{display:block}.team-joined-item p{font-size:12px;line-height:1.6;color:var(--muted);margin:8px 0 12px}
.team-alert{padding:12px 15px;border-radius:12px;margin-top:13px;font-size:13px;line-height:1.5}.team-alert.success{background:#e6f3dd;color:#275c36;border:1px solid #b7dcac}.team-alert.error{background:#fff0e9;color:#913f30;border:1px solid #f1c9ba}.team-join{padding:25px 29px;background:#fff;border:2px solid #a2c7a2;border-radius:21px;margin-top:26px}.team-join h2{font:700 23px 'Space Grotesk',sans-serif}.team-join p{font-size:13px;color:#5b6d5d;margin:10px 0}.team-join .primary{margin-top:7px}.team-foot{border-top:1px solid #d7dfd5;margin-top:35px;padding-top:22px;color:#708171;font-size:12px}
@media(max-width:900px){.team-layout{grid-template-columns:1fr}.team-top{padding:0 20px}.team-inner{width:min(650px,calc(100% - 32px))}}@media(max-width:520px){.team-top{height:auto;padding:14px 15px;flex-wrap:wrap}.team-topnav{gap:4px;width:100%;justify-content:space-between}.team-topnav a{padding:9px 11px;font-size:12px}.team-pad{padding:21px}.team-invite-top{padding:28px 21px}.team-invite-top h2{font-size:28px}.team-title{font-size:48px}.team-linkrow{flex-direction:column}.team-member{flex-wrap:wrap}.team-member .danger{margin-left:50px}.team-joined{padding:23px 18px}}
@media(prefers-reduced-motion:reduce){.team *{transition:none!important;animation:none!important}}
`;

// The URL is an external source: useSyncExternalStore reads it without a
// setState call inside a mount effect, and provides a stable SSR snapshot.
const subscribeToUrl = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};
const inviteCodeInUrl = () => new URLSearchParams(window.location.search).get("invite") || "";
const serverInviteCode = () => "";

type TeamSnapshot =
  | { signedIn: false }
  | { signedIn: true; ownerId:string; owned:OwnedProject[]; joined:JoinedProject[]; members:Member[]; tasks:AssignedTask[] };

async function fetchTeamSnapshot():Promise<TeamSnapshot>{
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return {signedIn:false};
  const [p,j]=await Promise.all([
    supabase.from("projects").select("id,name").eq("user_id",user.id).order("created_at",{ascending:true}),
    supabase.rpc("team_my_joined_projects")
  ]);
  if(p.error||j.error)throw new Error(p.error?.message||j.error?.message||"Could not load teams.");
  const owned=(p.data||[]) as OwnedProject[];
  const joined=(j.data||[]) as JoinedProject[];
  if(!owned.length)return {signedIn:true,ownerId:user.id,owned,joined,members:[],tasks:[]};
  const ids=owned.map(x=>x.id);
  const [m,t]=await Promise.all([
    supabase.from("team_memberships").select("project_id,member_id,member_email,role,joined_at").in("project_id",ids).order("joined_at",{ascending:true}),
    supabase.from("tasks").select("id,project_id,title,assigned_to,status").in("project_id",ids).order("created_at",{ascending:false})
  ]);
  if(m.error||t.error)throw new Error(m.error?.message||t.error?.message||"Could not load teams.");
  return {signedIn:true,ownerId:user.id,owned,joined,members:(m.data||[]) as Member[],tasks:(t.data||[]) as AssignedTask[]};
}

export default function TeamPage() {
  const [signedIn,setSignedIn] = useState<boolean | null>(null);
  const [own,setOwn] = useState<OwnedProject[]>([]);
  const [members,setMembers] = useState<Member[]>([]);
  const [joined,setJoined] = useState<JoinedProject[]>([]);
  const [projectId,setProjectId] = useState("");
  const inviteCode = useSyncExternalStore(subscribeToUrl, inviteCodeInUrl, serverInviteCode);
  const [inviteUrl,setInviteUrl] = useState("");
  const [ownerId,setOwnerId] = useState<string>("");
  const [assignedTasks,setAssignedTasks] = useState<AssignedTask[]>([]);
  const [assignmentBusy,setAssignmentBusy] = useState<string|null>(null);
  const [roleBusy,setRoleBusy] = useState<string|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const applySnapshot=useCallback((snapshot:TeamSnapshot)=>{
    if(!snapshot.signedIn){setSignedIn(false);return;}
    setSignedIn(true);
    setOwnerId(snapshot.ownerId);
    setOwn(snapshot.owned);
    setJoined(snapshot.joined);
    setMembers(snapshot.members);
    setAssignedTasks(snapshot.tasks);
    setProjectId(old=>snapshot.owned.some(x=>x.id===old)?old:(snapshot.owned[0]?.id||""));
  },[]);

  const refresh=useCallback(async()=>{
    try {applySnapshot(await fetchTeamSnapshot());}
    catch(e){setError(e instanceof Error?e.message:"Could not load teams.");}
  },[applySnapshot]);

  useEffect(()=>{
    let active=true;
    void fetchTeamSnapshot().then(snapshot=>{
      if(active)applySnapshot(snapshot);
    }).catch(e=>{
      if(active)setError(e instanceof Error?e.message:"Could not load teams.");
    });
    return ()=>{active=false;};
  },[applySnapshot]);

  const chosen = useMemo(()=>own.find(p=>p.id===projectId),[own,projectId]);
  const roster=useMemo(()=>members.filter(m=>m.project_id===projectId),[members,projectId]);
  const ownerTasks=useMemo(()=>assignedTasks.filter(t=>t.project_id===projectId),[assignedTasks,projectId]);

  async function setAssignee(task:AssignedTask, memberId:string){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return;
    setAssignmentBusy(task.id);setError("");setNotice("");
    const {data,error:dbError}=await supabase.from("tasks")
      .update({assigned_to:memberId||null}).eq("id",task.id).eq("user_id",user.id)
      .select("id,assigned_to").single();
    setAssignmentBusy(null);
    if(dbError||!data){setError(dbError?.message||"Could not save the assignment.");return;}
    setAssignedTasks(old=>old.map(t=>t.id===task.id?{...t,assigned_to:data.assigned_to}:t));
    setNotice("Assignment saved.");
  }
  async function createInvite(){
    if(!projectId)return;
    setBusy(true);setError("");setNotice("");setInviteUrl("");
    const r=await supabase.rpc("team_create_invite",{p_project_id:projectId});
    if(r.error)setError(r.error.message);
    else setInviteUrl(`${window.location.origin}/team?invite=${encodeURIComponent(String(r.data))}`);
    setBusy(false);
  }
  async function updateRole(member:Member, role:string){
    if(!["member","editor"].includes(role))return;
    setRoleBusy(member.member_id);setError("");setNotice("");
    const {data,error:dbError}=await supabase.rpc("team_set_member_role",{
      p_project_id:member.project_id,p_member_id:member.member_id,p_role:role
    });
    if(dbError || !data)setError(dbError?.message||"Role update was not applied.");
    else {setNotice("Member role updated.");await refresh();}
    setRoleBusy(null);
  }
  async function join(e:FormEvent){
    e.preventDefault(); if(!inviteCode)return;
    setBusy(true);setError("");setNotice("");
    const r=await supabase.rpc("team_accept_invite",{p_code:inviteCode});
    if(r.error)setError(r.error.message);
    else{
      setNotice("Invitation accepted! Open Shared projects to view its work.");
      window.history.replaceState({},"","/team");
      await refresh();
    }
    setBusy(false);
  }
  async function removeMember(member:Member){
    if(!window.confirm(`Remove ${member.member_email} from this project's membership?`))return;
    setBusy(true);setError("");setNotice("");
    const r=await supabase.rpc("team_remove_member",{p_project_id:member.project_id,p_member_id:member.member_id});
    if(r.error)setError(r.error.message);else{setNotice("Member removed.");await refresh();}
    setBusy(false);
  }
  async function leaveProject(project:JoinedProject){
    if(!window.confirm(`Leave ${project.project_name}?`))return;
    setBusy(true);setError("");setNotice("");
    const r=await supabase.rpc("team_leave_project",{p_project_id:project.project_id});
    if(r.error)setError(r.error.message);else{setNotice("You've left this project.");await refresh();}
    setBusy(false);
  }
  async function revokeLinks(){
    if(!projectId || !window.confirm("Revoke every unused invitation link for this project?"))return;
    setBusy(true);setError("");setNotice("");
    const r=await supabase.rpc("team_revoke_pending_invites",{p_project_id:projectId});
    if(r.error)setError(r.error.message);
    else{setInviteUrl("");setNotice(`${r.data??0} unused invitation link(s) revoked.`);}
    setBusy(false);
  }
  async function copyLink(){
    try{await navigator.clipboard.writeText(inviteUrl);setNotice("Invitation link copied.");}
    catch{setNotice("Select and copy the link manually from the field.");}
  }

  return <main className="team">
    <style>{styles}</style>
    <header className="team-top"><Link className="team-brand" href="/"><span className="team-logo">t✳</span>teamspace.</Link>
      <nav className="team-topnav" aria-label="Main navigation"><Link href="/">Workspace</Link><Link href="/plan">Plan</Link><Link href="/shared">Shared with me</Link><Link href="/collaborate">Collaborate</Link><Link href="/team" aria-current="page">Team</Link></nav>
    </header>
    <div className="team-inner">
      <div className="team-eyebrow">TeamSpace / The people behind the work</div>
      <h1 className="team-title">Build with <em>people.</em></h1>
      <p className="team-intro">Invite people into your projects, see who is involved, and assign them work—with clear ownership and access rules.</p>
      <div className="team-banner"><strong>Phase 5B: shared project visibility.</strong> Accepted viewers can read and comment; editors can update task details and status. Only the owner can manage memberships, assignments and deletion.</div>
      {error&&<div role="alert" className="team-alert error">{error}</div>}
      {notice&&<div role="status" className="team-alert success">{notice}</div>}
      {signedIn===null&&<p className="team-note">Checking your session…</p>}
      {signedIn===false&&<div className="team-join"><h2>Sign in to manage invitations</h2><p>Your membership details are only available to signed-in users.</p><Link className="secondary" href="/login">Open TeamSpace sign in</Link>{inviteCode&&<p>After signing in, return to your invitation link to accept it.</p>}</div>}
      {signedIn&&<>
        {inviteCode&&<form className="team-join" onSubmit={join}>
          <div className="team-kicker">You&apos;ve been invited</div><h2>Join a project</h2>
          <p>Accepting will show your account email to the project owner. This is a one-time invitation and expires after seven days.</p>
          <button type="submit" className="primary" disabled={busy}>{busy?"Joining…":"Accept invitation"}</button>
        </form>}
        <div className="team-layout">
          <section className="team-panel">
            <div className="team-invite-top"><div className="team-kicker" style={{color:"#c8eca1"}}>01 / Invitations</div><h2>Good work gets better together.</h2><p>Generate a one-time project invitation and share it personally with a teammate.</p></div>
            <div className="team-pad">
              <label htmlFor="team-project">Your project</label>
              <select id="team-project" value={projectId} disabled={!own.length} onChange={e=>{setProjectId(e.target.value);setInviteUrl("");}}>
                {!own.length&&<option value="">No projects yet</option>}
                {own.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {own.length===0?<div className="team-note">Create a project in your <Link href="/">workspace</Link> first.</div>:<>
                <button type="button" className="primary" onClick={()=>void createInvite()} disabled={busy}>{busy?"Preparing…":"Generate invitation link"}</button>
                {inviteUrl&&<div><div className="team-note"><strong>Ready to share:</strong> expires in 7 days or after one use.</div><div className="linkrow"><input aria-label="Invitation link" value={inviteUrl} readOnly onFocus={e=>e.currentTarget.select()}/><button type="button" className="secondary" onClick={()=>void copyLink()}>Copy link</button></div></div>}
                <div className="divider"/>
                <div className="team-kicker">Invitations are yours to control</div>
                <p className="muted">Share links only with someone you trust. A link currently starting with localhost only works on your computer until TeamSpace is publicly deployed.</p>
                <button type="button" className="secondary" style={{marginTop:15}} onClick={()=>void revokeLinks()} disabled={busy}>Revoke all unused links</button>
              </>}
            </div>
          </section>
          <section className="team-panel"><div className="team-pad">
            <div className="team-kicker">02 / Members</div>
            <h2>People on your project.</h2>
            <p className="sub">{chosen?`Viewing members of ${chosen.name}.`:'Choose a project you own to view its members.'}</p>
            <div className="team-list">
              {chosen&&<div className="team-member"><div className="team-avatar">★</div><div className="team-memberinfo"><strong>You</strong><small>Project owner · full control</small></div></div>}
              {roster.map(m=><div className="team-member" key={`${m.project_id}-${m.member_id}`}><div className="team-avatar">{(m.member_email[0]||"M").toUpperCase()}</div><div className="team-memberinfo"><strong>{m.member_email}</strong><small>{m.role === "editor" ? "Editor" : "Viewer"} · joined {new Date(m.joined_at).toLocaleDateString()}</small></div><label style={{margin:0,minWidth:120}}><span className="muted">Access</span><select aria-label={`Role for ${m.member_email}`} value={m.role} disabled={roleBusy===m.member_id || busy} onChange={e=>void updateRole(m,e.target.value)}><option value="member">Viewer</option><option value="editor">Editor</option></select></label><button type="button" className="danger" disabled={busy} onClick={()=>void removeMember(m)}>Remove</button></div>)}
              {chosen&&roster.length===0&&<div className="team-empty">No one else has joined yet.<br/>Create an invitation to get started.</div>}
              {!chosen&&<div className="team-empty">Your projects will appear here after creation.</div>}
            </div>
            <div className="team-note">Only owners can invite, remove, assign tasks, and choose access levels. Viewers can read and comment; editors can also change task status and description in the collaboration room.</div>
          </div></section>
        </div>
        <section className="team-joined"><div className="team-kicker">03 / Shared with me</div><h2>Projects you&apos;ve joined</h2>
          <div className="team-joined-grid">
            {!joined.length&&<div className="team-empty">Nothing here yet. When you accept a teammate&apos;s invitation, their project will appear here.</div>}
            {joined.map(p=><div className="team-joined-item" key={p.project_id}><strong>{p.project_name}</strong><p>Joined {new Date(p.joined_at).toLocaleDateString()}. Open the collaboration room to discuss tasks and follow updates.</p><Link className="secondary" style={{display:"inline-block",marginRight:8,textDecoration:"none"}} href={`/shared?project=${encodeURIComponent(p.project_id)}`}>View project</Link><Link className="secondary" style={{display:"inline-block",marginRight:8,textDecoration:"none"}} href={`/collaborate?project=${encodeURIComponent(p.project_id)}`}>Collaborate</Link><button type="button" className="secondary" disabled={busy} onClick={()=>void leaveProject(p)}>Leave project</button></div>)}
          </div>
        </section>
        {own.length>0&&<section className="team-joined" aria-label="Task assignments">
          <div className="team-kicker">04 / Assignment desk</div><h2>Assign project work</h2>
          <p className="muted" style={{marginTop:8}}>Choose a project above. Assign its tasks to yourself or an accepted team member. Only you, the owner, can change assignments.</p>
          <div className="team-list">
            {ownerTasks.length===0&&<div className="team-empty">No tasks in the selected project. Create one from your workspace first.</div>}
            {ownerTasks.map(t=><div className="team-member" key={t.id} style={{flexWrap:"wrap"}}>
              <div className="team-memberinfo"><strong>{t.title}</strong><small>{t.status}</small></div>
              <label style={{margin:0,minWidth:190,fontSize:11}} htmlFor={`assign-${t.id}`}>Assigned to
                <select id={`assign-${t.id}`} aria-label={`Assign ${t.title}`} value={t.assigned_to||""}
                  disabled={assignmentBusy===t.id} onChange={e=>void setAssignee(t,e.target.value)} style={{marginTop:5}}>
                  <option value="">Unassigned</option>
                  {ownerId&&<option value={ownerId}>You · project owner</option>}
                  {members.filter(m=>m.project_id===t.project_id).map(m=><option key={m.member_id} value={m.member_id}>{m.member_email}</option>)}
                </select>
              </label>
            </div>)}
          </div>
          <p className="team-note">If a member leaves or is removed, their task assignments are cleared without deleting the tasks.</p>
        </section>}
      </>}
      <footer className="team-foot">TeamSpace · Collaboration · Owner-managed access · <Link href="/">Return to workspace</Link></footer>
    </div>
  </main>;
}
