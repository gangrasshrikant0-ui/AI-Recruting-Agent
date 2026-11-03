import { users, stages } from "./data";
import { auditTrail } from "./recruiting";
import { jobs } from "./queue";
export const org = { id: "org_acme_demo", name: "Acme Labs", retentionDays: 180 };
export const adapters = [
  { id: "email", name: "Email", enabled: true, health: "healthy" }, { id: "sms", name: "SMS", enabled: true, health: "healthy" }, { id: "calendar", name: "Calendar", enabled: true, health: "healthy" }, { id: "ats", name: "ATS", enabled: false, health: "mock" }, { id: "hrms", name: "HRMS", enabled: false, health: "mock" }, { id: "telephony", name: "Telephony", enabled: false, health: "mock" }, { id: "job-portals", name: "Job portals", enabled: false, health: "mock" },
];
export const agentConfig = { model: process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : "mock-gemini", promptVersion: "v1", maxRetries: 2, humanApprovalRequired: ["shortlist", "reject", "offer", "stage move"] };
export const apiHealth = [{ endpoint: "/api/interview", status: 200, latencyMs: 84, ts: new Date().toISOString() }, { endpoint: "/api/recruiting", status: 200, latencyMs: 31, ts: new Date().toISOString() }, { endpoint: "/api/evaluation", status: 200, latencyMs: 52, ts: new Date().toISOString() }];
export const adminState = () => ({ org, users, roles: ["admin", "recruiter", "interviewer", "candidate"], stages, adapters, agentConfig, audit: auditTrail, health: apiHealth, queue: jobs });
