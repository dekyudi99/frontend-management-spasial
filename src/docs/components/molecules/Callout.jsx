import React from 'react'

const CALLOUT_STYLES = {
  info: {
    container: 'bg-blue-50/70 border-blue-200 text-blue-900',
    title: 'text-blue-900',
    iconColor: 'text-blue-600',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    )
  },
  tip: {
    container: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
    title: 'text-emerald-900',
    iconColor: 'text-emerald-600',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    )
  },
  warning: {
    container: 'bg-amber-50/80 border-amber-300 text-amber-950',
    title: 'text-amber-950',
    iconColor: 'text-amber-600',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  },
  danger: {
    container: 'bg-rose-50/80 border-rose-300 text-rose-950',
    title: 'text-rose-950',
    iconColor: 'text-rose-600',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  }
}

export default function Callout({ type = 'info', title = '', children, className = '' }) {
  const cfg = CALLOUT_STYLES[type.toLowerCase()] || CALLOUT_STYLES.info

  return (
    <div className={`flex items-start gap-3 p-3.5 my-3 rounded-xl border text-xs sm:text-sm leading-relaxed ${cfg.container} ${className}`}>
      <div className={`mt-0.5 shrink-0 ${cfg.iconColor}`}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h5 className={`font-semibold mb-1 text-xs uppercase tracking-wider ${cfg.title}`}>{title}</h5>}
        <div className="text-slate-700 space-y-1">{children}</div>
      </div>
    </div>
  )
}
