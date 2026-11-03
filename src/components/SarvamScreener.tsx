'use client';
import { useState } from 'react';

export default function SarvamScreener() {
  const [streamlitUrl] = useState('http://localhost:8501');

  return (
    <div className="flex flex-col h-[calc(100vh-20px)] p-6 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>🎙️</span> Sarvam AI Voice Interview Screener
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Indian-language first-round screening (Hindi, Marathi, English) powered by Sarvam STT & 105B LLM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live at :8501
          </span>
          <a
            href="http://localhost:8501"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
          >
            Open in Full Tab ↗
          </a>
        </div>
      </div>

      <div className="flex-1 mt-4 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl relative">
        <iframe
          src={streamlitUrl}
          title="Sarvam AI Screener"
          className="w-full h-full border-0"
          allow="microphone; camera; display-capture"
        />
      </div>
    </div>
  );
}

