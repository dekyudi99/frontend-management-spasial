import React from 'react'
import CopyButton from './CopyButton'

export default function CodeBlock({
  code = '',
  language = 'bash',
  title = '',
  maxHeight = '420px',
  className = '',
}) {
  return (
    <div className={`my-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md text-slate-100 ${className}`}>
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700/80 inline-block" />
          <span className="ml-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            {title || language}
          </span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre
        style={{ maxHeight }}
        className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-200 selection:bg-blue-600/40 selection:text-white"
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}
