"use client";

import { useState } from "react";
import {
  BarChart3, BriefcaseBusiness, CalendarDays, ChevronDown, FileText,
  GitCompare, LayoutDashboard, MessageCircle, Mic2, Send, Settings,
  Users, KanbanSquare
} from "lucide-react";

type Link = { label: string; id: string; icon: typeof LayoutDashboard };
const groups: { label: string; links: Link[] }[] = [
  { label: "Main navigation", links: [
    { label: "Dashboard", id: "dashboard", icon: LayoutDashboard },
    { label: "Jobs", id: "jobs", icon: BriefcaseBusiness },
    { label: "Candidates", id: "candidates", icon: Users },
    { label: "Interviews", id: "interviews", icon: Mic2 },
    { label: "Scheduling", id: "schedule", icon: CalendarDays },
    { label: "Analytics", id: "analytics", icon: BarChart3 },
  ] },
  { label: "Recruitment management", links: [
    { label: "ATS Pipeline", id: "kanban", icon: KanbanSquare },
    { label: "Evaluation & reports", id: "reports", icon: FileText },
    { label: "Candidate comparison", id: "compare", icon: GitCompare },
  ] },
  { label: "Communication", links: [
    { label: "Recruiter Assistant", id: "assistant", icon: MessageCircle },
    { label: "Notifications / Outbox", id: "outbox", icon: Send },
  ] },
];

export default function Sidebar({
  role, setRole, view, setView, onLogout, open, onClose
}: {
  role: string; setRole: (role: string) => void; view: string;
  setView: (view: string) => void; onLogout: () => void;
  open: boolean; onClose: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <aside className={`app-sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">T</div>
        <div><div className="brand-name">TalentOS</div><div className="brand-caption">AI recruitment workspace</div></div>
      </div>
      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.links.map(({ label, id, icon: Icon }) => (
              <button key={id} onClick={() => { setView(id); onClose(); }} className={`nav-item ${view === id ? "active" : ""}`}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              </button>
            ))}
          </div>
        ))}
        {role === "admin" && <div className="nav-group">
          <div className="nav-group-label">Administration</div>
          <button onClick={() => { setView("admin"); onClose(); }} className={`nav-item ${view === "admin" ? "active" : ""}`}>
            <Settings size={17} strokeWidth={1.8} /><span>Admin settings</span>
          </button>
        </div>}
      </nav>
      <div className="profile-wrap">
        <button onClick={() => setProfileOpen(!profileOpen)} className="profile-button">
          <div className="avatar">PS</div><div className="profile-copy"><strong>Priya Shah</strong><span>{role}</span></div><ChevronDown size={16} />
        </button>
        {profileOpen && <div className="profile-menu">
          {["admin", "recruiter", "interviewer", "candidate"].map((item) => (
            <button key={item} onClick={() => { setRole(item); setProfileOpen(false); onClose(); }} className="profile-option">{item}</button>
          ))}
          <button onClick={() => { onLogout(); onClose(); }} className="profile-option danger">Sign out</button>
        </div>}
      </div>
    </aside>
  );
}
