import React from 'react'

export default function StepList({ steps = [] }) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="space-y-3.5 my-3">
      {steps.map((s, idx) => (
        <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0 shadow-xs">
            {s.step || idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 text-sm mb-1">{s.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-0">{s.desc}</p>
            {s.hint && (
              <div className="mt-2 text-[11px] font-mono bg-white px-2.5 py-1.5 rounded border border-slate-200 text-slate-500">
                {s.hint}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
