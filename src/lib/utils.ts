import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(ts: number) { return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
export function formatDateTime(ts: number) { return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
export function safeJSON(s: string | null | undefined, fallback: unknown = null) { if (!s) return fallback; try { return JSON.parse(s); } catch { return fallback; } }
export function generateMeetingLink(id: string) { return `https://meet.acme.demo/${id}`; }
export const PIPELINE_STAGES = ['Application received','Resume screening','Eligibility review','Interview invitation','Interview scheduled','First round completed','Evaluation pending','Shortlisted','Technical interview','Managerial interview','Final decision','Offer extended','Offer accepted','Offer declined','Hired','Rejected','Withdrawn'];

