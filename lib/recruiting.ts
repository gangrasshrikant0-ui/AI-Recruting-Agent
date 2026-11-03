import { candidates as seededCandidates, stages } from "./data";
import { allTraces, route } from "./orchestrator";

export type Candidate = typeof seededCandidates[number] & { updatedAt: string; stuck: boolean; flags: string[] };
export type Approval = { id: string; action: "shortlist" | "reject" | "offer" | "stage move"; candidateId: string; candidateName: string; status: "pending" | "approved" | "rejected"; reason: string; createdAt: string };
export type Audit = { id: string; actor: string; type: "human" | "ai"; action: string; target: string; reason: string; ts: string };
export type OutboxMessage = { id: string; channel: "Email" | "SMS"; recipient: string; subject: string; body: string; status: "Queued" | "Delivered" | "Failed"; candidateId: string; createdAt: string; attempts: number };

const now = () => new Date().toISOString();
export const recruiterCandidates: Candidate[] = seededCandidates.map((candidate, index) => ({ ...candidate, updatedAt: new Date(Date.now() - (index % 5 === 0 ? 11 : index) * 86400000).toISOString(), stuck: index % 5 === 0, flags: index === 1 ? ["Possible duplicate email"] : index === 7 ? ["Conflicting application stage"] : [] }));
export const approvals: Approval[] = [
  { id: "ap1", action: "shortlist", candidateId: "c1", candidateName: "Maya Iyer", status: "pending", reason: "Score 92%; grounded interview", createdAt: now() },
  { id: "ap2", action: "offer", candidateId: "c4", candidateName: "Jon Bell", status: "pending", reason: "Strong technical panel", createdAt: now() },
];
export const auditTrail: Audit[] = [];
export const recruitingOutbox: OutboxMessage[] = [
  { id: "m1", channel: "Email", recipient: "candidate1@demo.ai", subject: "Your interview invitation", body: "Hi Maya, we would love to meet you.", status: "Delivered", candidateId: "c1", createdAt: now(), attempts: 1 },
  { id: "m2", channel: "SMS", recipient: "candidate4@demo.ai", subject: "Interview reminder", body: "Reminder: your interview is tomorrow.", status: "Queued", candidateId: "c4", createdAt: now(), attempts: 0 },
];
export const appointments = [
  { id: "s1", candidateId: "c1", candidate: "Maya Iyer", interviewer: "Daniel Chen", start: "2026-11-05T10:00:00+05:30", end: "2026-11-05T10:45:00+05:30", timezone: "Asia/Kolkata", status: "confirmed", meetingLink: "https://meet.demo.ai/s1" },
  { id: "s2", candidateId: "c4", candidate: "Jon Bell", interviewer: "Daniel Chen", start: "2026-11-06T15:00:00+05:30", end: "2026-11-06T15:45:00+05:30", timezone: "Asia/Kolkata", status: "late", meetingLink: "https://meet.demo.ai/s2" },
];
export const availability = { candidate: ["2026-11-05T10:00:00+05:30", "2026-11-05T14:00:00+05:30", "2026-11-06T15:00:00+05:30"], interviewer: ["2026-11-05T10:00:00+05:30", "2026-11-05T11:00:00+05:30", "2026-11-06T15:00:00+05:30"] };
const duplicate = (candidateId: string) => recruiterCandidates.filter((candidate) => candidate.email === recruiterCandidates.find((item) => item.id === candidateId)?.email).length > 1;
const addAudit = (actor: string, type: Audit["type"], action: string, target: string, reason = "") => { auditTrail.unshift({ id: crypto.randomUUID(), actor, type, action, target, reason, ts: now() }); };
export function moveCandidate(candidateId: string, stage: string, reason: string, actor = "Priya Shah") {
  const candidate = recruiterCandidates.find((item) => item.id === candidateId);
  if (!candidate || !stages.includes(stage)) throw new Error("Candidate or stage not found");
  if ((stage === "Rejected" || stage === "Withdrawn") && !reason.trim()) throw new Error("A reason is required for rejection or withdrawal");
  const highImpact = ["Rejected", "Withdrawn", "Offer extended", "Hired"].includes(stage);
  if (highImpact) return requestApproval("stage move", candidate, reason, actor);
  candidate.stage = stage; candidate.updatedAt = now(); addAudit(actor, "human", `Moved candidate to ${stage}`, candidate.name, reason);
  route("workflow", `Move ${candidate.name} to ${stage}`, JSON.stringify({ candidateId, stage }), "workflow-v1");
  return candidate;
}
export function requestApproval(action: Approval["action"], candidate: Candidate, reason: string, actor = "Priya Shah") {
  const approval = { id: crypto.randomUUID(), action, candidateId: candidate.id, candidateName: candidate.name, status: "pending" as const, reason, createdAt: now() };
  approvals.unshift(approval); addAudit(actor, "human", `Requested approval: ${action}`, candidate.name, reason); return approval;
}
export function resolveApproval(id: string, approved: boolean, actor = "Priya Shah") {
  const approval = approvals.find((item) => item.id === id); if (!approval) throw new Error("Approval not found");
  approval.status = approved ? "approved" : "rejected"; const candidate = recruiterCandidates.find((item) => item.id === approval.candidateId);
  if (approved && candidate) { candidate.stage = approval.action === "offer" ? "Offer extended" : approval.action === "reject" ? "Rejected" : "Shortlisted"; candidate.updatedAt = now(); enqueueMessage(candidate.id, "Email", approved ? "Your application update" : "Application update", `Hi ${candidate.name}, your recruitment status has changed.`); }
  addAudit(actor, "human", `${approved ? "Approved" : "Rejected"} ${approval.action}`, approval.candidateName, approval.reason); return approval;
}
export function enqueueMessage(candidateId: string, channel: OutboxMessage["channel"], subject: string, body: string) {
  const candidate = recruiterCandidates.find((item) => item.id === candidateId); if (!candidate) throw new Error("Candidate not found");
  if (recruitingOutbox.some((message) => message.candidateId === candidateId && message.subject === subject && message.status !== "Failed")) return null;
  const message = { id: crypto.randomUUID(), channel, recipient: candidate.email, subject, body, status: "Queued" as const, candidateId, createdAt: now(), attempts: 0 };
  recruitingOutbox.unshift(message); addAudit("workflow", "ai", `Queued ${channel} message`, candidate.name, "Duplicate suppression and channel preference checks passed"); return message;
}
export function retryMessage(id: string) { const message = recruitingOutbox.find((item) => item.id === id); if (!message) throw new Error("Message not found"); message.attempts += 1; message.status = "Queued"; addAudit("Priya Shah", "human", "Retried failed message", message.recipient); return message; }
export function createIcs(appointmentId: string) {
  const item = appointments.find((appointment) => appointment.id === appointmentId); if (!item) throw new Error("Appointment not found");
  return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${item.id}@talentos.demo\nDTSTART:${item.start.replace(/[-:]/g, "").replace("+0530", "")}\nDTEND:${item.end.replace(/[-:]/g, "").replace("+0530", "")}\nSUMMARY:TalentOS interview with ${item.candidate}\nURL:${item.meetingLink}\nEND:VEVENT\nEND:VCALENDAR`;
}
export function updateAppointment(appointmentId: string, action: "reschedule" | "cancel" | "attendance", value?: string) {
  const appointment = appointments.find((item) => item.id === appointmentId); if (!appointment) throw new Error("Appointment not found");
  if (action === "reschedule") {
    if (!value || availability.candidate.indexOf(value) < 0 || availability.interviewer.indexOf(value) < 0) throw new Error("Selected time is not an interviewer/candidate overlap");
    appointment.start = value; appointment.end = new Date(new Date(value).getTime() + 45 * 60000).toISOString(); appointment.status = "confirmed";
  } else if (action === "cancel") appointment.status = "cancelled";
  else if (value && ["confirmed", "no-show", "late", "missed"].includes(value)) appointment.status = value;
  addAudit("Priya Shah", "human", `${action} appointment`, appointment.candidate, value || "");
  return appointment;
}
export function assistant(question: string) {
  const lower = question.toLowerCase(); const delayed = recruiterCandidates.filter((candidate) => candidate.stuck);
  const answer = lower.includes("delayed") ? `${delayed.length} candidates are delayed: ${delayed.map((candidate) => candidate.name).join(", ")}. Next action: review approvals and send reminders.` : lower.includes("shortlist") ? "Maya Iyer is ready for shortlist approval; the grounded score is 83 and the recommendation is Strong match." : "I can summarize candidates, identify delayed stages, inspect approvals, and suggest the next recruiter action.";
  route("recruiterAssistant", question, answer, "assistant-v1"); addAudit("recruiterAssistant", "ai", "Answered recruiter assistant", "Acme Labs"); return answer;
}
export function completeInterview(candidateId: string) { const candidate = recruiterCandidates.find((item) => item.id === candidateId); if (!candidate) throw new Error("Candidate not found"); candidate.stage = "Evaluation pending"; candidate.updatedAt = now(); enqueueMessage(candidateId, "Email", "Interview completed", "Your interview is complete. The recruiting team will review your evaluation."); addAudit("workflow", "ai", "Interview completed; moved to Evaluation pending", candidate.name); return candidate; }
export const getState = () => ({ candidates: recruiterCandidates, approvals, audit: auditTrail, outbox: recruitingOutbox, appointments, availability, traces: allTraces });
