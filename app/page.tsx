"use client";

import { FormEvent, useState } from "react";
import Sidebar from "@/components/Sidebar";
import InterviewRoom from "@/components/InterviewRoom";
import EvaluationWorkspace from "@/components/EvaluationWorkspace";
import RecruiterWorkflow from "@/components/RecruiterWorkflow";
import CandidatePortal from "@/components/CandidatePortal";
import AnalyticsWorkspace from "@/components/AnalyticsWorkspace";
import AdminWorkspace from "@/components/AdminWorkspace";
import GuidedDemo from "@/components/GuidedDemo";
import CandidatePool from "@/components/CandidatePool";
import { blueprint, candidates, criteria, jobs, users } from "@/lib/data";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, Clock3, Eye, EyeOff, Search, Sparkles, Users, Video } from "lucide-react";

type Role = "admin" | "recruiter" | "interviewer" | "candidate";
const roleDetails: Record<Role, { title: string; description: string; icon: typeof Users }> = {
  admin: { title: "Admin", description: "Manage users, permissions, configurations and system settings.", icon: BriefcaseBusiness },
  recruiter: { title: "Recruiter", description: "Create jobs, analyse candidates and manage hiring workflows.", icon: Users },
  interviewer: { title: "Interviewer", description: "View assigned interviews and submit structured feedback.", icon: Video },
  candidate: { title: "Candidate", description: "Explore opportunities and track your application journey.", icon: CheckCircle2 },
};

function Logo() { return <div className="login-brand"><span className="brand-mark">T</span><strong>TalentOS</strong></div>; }

function Welcome({ onStart }: { onStart: () => void }) {
  return <main className="auth-page"><div className="auth-decoration decoration-one" /><div className="auth-decoration decoration-two" />
    <Logo /><section className="welcome-card"><div className="eyebrow">AI recruitment workspace</div><h1>Welcome to TalentOS</h1><p>Your intelligent AI-powered recruitment workspace for moving great people forward.</p><button className="primary-button wide" onClick={onStart}>Get started <ArrowRight size={17} /></button><div className="trust-row"><CheckCircle2 size={16} /> Secure, role-based demo experience</div></section>
  </main>;
}

function RoleSelection({ onSelect, onBack }: { onSelect: (role: Role) => void; onBack: () => void }) {
  return <main className="auth-page"><Logo /><section className="role-page"><button className="back-link" onClick={onBack}>← Back</button><div className="eyebrow">Sign in to your workspace</div><h1>How will you use TalentOS?</h1><p className="auth-subtitle">Select your role to continue to the right workspace.</p><div className="role-grid">{(Object.keys(roleDetails) as Role[]).map((role) => { const item = roleDetails[role]; const Icon = item.icon; return <button className="role-card" key={role} onClick={() => onSelect(role)}><span className="role-icon"><Icon size={22} /></span><span className="role-card-copy"><strong>{item.title}</strong><span>{item.description}</span></span><ArrowRight size={18} /></button>; })}</div></section></main>;
}

function RoleLogin({ role, onLogin, onBack }: { role: Role; onLogin: () => void; onBack: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(users.find((user) => user.role === role)?.email ?? "");
  const Icon = roleDetails[role].icon;
  const submit = (event: FormEvent) => { event.preventDefault(); onLogin(); };
  return <main className="auth-page"><Logo /><section className="login-card"><button className="back-link" onClick={onBack}>← Back to role selection</button><div className="role-login-icon"><Icon size={22} /></div><div className="eyebrow">Demo sign in</div><h1>{roleDetails[role].title} login</h1><p className="auth-subtitle">{roleDetails[role].description}</p><form onSubmit={submit}><label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label><label>Password<div className="password-field"><input required type={showPassword ? "text" : "password"} defaultValue="demo-password" /><button type="button" aria-label="Show password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><div className="form-row"><label className="checkbox-label"><input type="checkbox" defaultChecked /> Remember me</label><button type="button" className="text-button">Forgot password?</button></div><button className="primary-button wide" type="submit">Continue to TalentOS <ArrowRight size={17} /></button></form><p className="demo-hint">Demo account pre-filled. Any password is accepted in this local demo.</p></section></main>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={`dashboard-card ${className}`}>{children}</div>; }

function DashboardHome({ role, onNavigate }: { role: Role; onNavigate: (view: string) => void }) {
  const metrics = [["Active jobs", "12", "+3 this month"], ["Total candidates", "248", "+18%"], ["Shortlisted", "14", "+4%"], ["Upcoming interviews", "38", "Next: 10:30 AM"]];
  return <div className="space-y-5"><div className="welcome-header"><div><div className="eyebrow">Tuesday, November 3, 2026</div><h1>Good morning, Priya</h1><p>Here is what is happening across your recruitment workspace.</p></div><button className="primary-button" onClick={() => onNavigate("jobs")}><Sparkles size={16} /> Create a job</button></div><div className="metric-grid">{metrics.map(([label, value, note]) => <Card key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></Card>)}</div><div className="content-grid"><Card className="activity-card"><div className="card-heading"><div><h2>Recent activity</h2><p>Latest updates from your hiring team</p></div><button className="text-button" onClick={() => onNavigate("audit")}>View all</button></div>{[["Maya Iyer moved to shortlist", "Senior Full-Stack Engineer", "12 min ago"], ["Interview feedback submitted", "ML Platform Engineer", "38 min ago"], ["New candidate application", "Product Designer", "1 hr ago"]].map(([title, detail, time]) => <div className="activity-row" key={title}><span className="activity-icon"><CheckCircle2 size={16} /></span><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>)}</Card><Card><div className="card-heading"><div><h2>Upcoming interviews</h2><p>Your schedule for today</p></div><button className="text-button" onClick={() => onNavigate("schedule")}>Calendar</button></div>{[["10:30", "Maya Iyer", "Technical screen"], ["14:00", "Jon Bell", "Behavioral interview"], ["16:30", "Sara Khan", "Manager round"]].map(([time, name, type]) => <div className="interview-row" key={name}><span className="time">{time}</span><div><strong>{name}</strong><span>{type}</span></div><Clock3 size={16} /></div>)}</Card></div><Card><div className="card-heading"><div><h2>Candidate pipeline</h2><p>Progress across your active jobs</p></div><button className="text-button" onClick={() => onNavigate("kanban")}>Open pipeline</button></div><div className="pipeline-row">{["Applied", "Screening", "Interview", "Shortlisted", "Offer"].map((stage, index) => <div key={stage}><div className="pipeline-top"><span>{stage}</span><strong>{[94, 62, 38, 14, 4][index]}</strong></div><div className="pipeline-track"><span style={{ width: `${[100, 66, 40, 18, 7][index]}%` }} /></div></div>)}</div></Card></div>;
}

export default function Home() {
  const [authStep, setAuthStep] = useState<"welcome" | "roles" | "login" | "app">("welcome");
  const [role, setRole] = useState<Role>("recruiter");
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState("");
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const reset = async () => { await fetch("/api/reset", { method: "POST" }); notify("Demo data reset."); };
  if (authStep === "welcome") return <Welcome onStart={() => setAuthStep("roles")} />;
  if (authStep === "roles") return <RoleSelection onBack={() => setAuthStep("welcome")} onSelect={(nextRole) => { setRole(nextRole); setAuthStep("login"); }} />;
  if (authStep === "login") return <RoleLogin role={role} onBack={() => setAuthStep("roles")} onLogin={() => setAuthStep("app")} />;
  const content = view === "dashboard" ? <><GuidedDemo onNavigate={setView} onReset={reset} /><DashboardHome role={role} onNavigate={setView} /></> :
    view === "interviews" ? <InterviewRoom /> : view === "reports" ? <EvaluationWorkspace /> : view === "compare" ? <EvaluationWorkspace mode="compare" /> :
    view === "analytics" ? <AnalyticsWorkspace /> : view === "portal" ? <CandidatePortal /> : view === "admin" ? <AdminWorkspace /> :
    view === "candidates" ? <CandidatePool onNotify={notify} /> : ["kanban", "approvals", "schedule", "outbox", "audit", "assistant"].includes(view) ? <RecruiterWorkflow view={view as "kanban" | "approvals" | "schedule" | "outbox" | "audit" | "assistant"} /> : <JobsView onNotify={notify} />;
  return <div className="app-shell"><Sidebar role={role} setRole={(nextRole) => setRole(nextRole as Role)} view={view} setView={setView} onLogout={() => setAuthStep("welcome")} /><main className="app-main"><header className="topbar"><div className="breadcrumb"><span>Acme Labs</span><b>/</b><strong>{view === "dashboard" ? "Overview" : view}</strong></div><div className="topbar-actions"><div className="global-search"><Search size={16} /><input placeholder="Search candidates, jobs..." aria-label="Search candidates and jobs" /></div><button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">PS</div></div></header><div className="page-content">{content}</div></main>{toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}</div>;
}

function JobsView({ onNotify }: { onNotify: (message: string) => void }) {
  const [analyzed, setAnalyzed] = useState(false);
  const [jobDescription, setJobDescription] = useState("We are looking for a Senior Full-Stack Engineer with 5+ years building reliable TypeScript and React products.");
  const analyze = async () => {
    const response = await fetch("/api/agent", { method: "POST", body: JSON.stringify({ action: "analyze", input: jobDescription }) });
    if (response.ok) {
      setAnalyzed(true);
      onNotify("Job analysis completed.");
      return;
    }
    onNotify("Job analysis failed.");
  };
  return <div className="jobs-layout"><div className="page-heading"><div><div className="eyebrow">Recruitment management</div><h1>Jobs</h1><p>Create openings and use AI to build consistent interview plans.</p></div><button className="primary-button" onClick={() => onNotify("New job draft created.")}>+ New job</button></div><div className="job-list">{jobs.map((job) => <Card key={job.id}><div className="job-card-top"><span className="job-icon"><BriefcaseBusiness size={19} /></span><span className="status-badge">{job.stage}</span></div><h2>{job.title}</h2><p>{job.department}</p><div className="job-card-footer"><span><Users size={15} /> {job.candidates} candidates</span><span>{job.match}% avg. match</span></div></Card>)}</div><Card className="analysis-panel"><div className="card-heading"><div><h2>AI job analysis</h2><p>Paste a job description to generate criteria and a structured interview blueprint.</p></div><Sparkles className="accent-icon" size={20} /></div><textarea className="job-textarea" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} /><button className="primary-button" onClick={analyze}>{analyzed ? "Analysis complete" : "Analyze with AI"}</button>{analyzed && <div className="analysis-result"><div><strong>Mandatory skills</strong><span>{criteria.mandatory.join(" · ")}</span></div><div><strong>Interview blueprint</strong><span>{blueprint.length} recommended stages</span></div></div>}</Card></div>;
}
