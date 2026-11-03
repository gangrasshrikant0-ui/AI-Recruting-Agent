import { NextResponse } from "next/server";
import { recruiterCandidates, approvals, recruitingOutbox, auditTrail } from "@/lib/recruiting";
export async function POST() {
  recruiterCandidates.forEach((candidate, index) => { candidate.stage = ["Application received","Resume screening","Eligibility review","Interview invitation","Interview scheduled","First round completed","Evaluation pending","Shortlisted","Technical interview","Managerial interview","Final decision","Offer extended","Offer accepted","Hired","Rejected","Withdrawn"][index % 16]; candidate.updatedAt = new Date(Date.now() - (index % 5 === 0 ? 11 : index) * 86400000).toISOString(); });
  approvals.splice(0, approvals.length, { id: "ap1", action: "shortlist", candidateId: "c1", candidateName: "Maya Iyer", status: "pending", reason: "Score 92%; grounded interview", createdAt: new Date().toISOString() }, { id: "ap2", action: "offer", candidateId: "c4", candidateName: "Jon Bell", status: "pending", reason: "Strong technical panel", createdAt: new Date().toISOString() });
  recruitingOutbox.splice(2); auditTrail.splice(0);
  return NextResponse.json({ reset: true });
}
