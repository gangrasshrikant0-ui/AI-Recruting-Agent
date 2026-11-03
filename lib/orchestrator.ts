import { traces } from "./data";
export type AgentTrace = { agent: string; model: string; promptVersion: string; input: string; output: string; ts: string };
export const allTraces: AgentTrace[] = traces.map((trace) => ({ ...trace, promptVersion: "v1" }));
export function route(agent: string, input: string, output: string, promptVersion = "v1") {
  const trace = { agent, model: process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : "mock-gemini", promptVersion, input, output, ts: new Date().toISOString() };
  allTraces.unshift(trace);
  traces.unshift(trace);
  return { approved: true, traceId: crypto.randomUUID() };
}
