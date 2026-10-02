import React from 'react'

const BADGE_VARIANTS = {
  get: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  post: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
  put: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
  patch: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold',
  delete: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  required: 'bg-rose-50 text-rose-600 border-rose-200',
  optional: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  format: 'bg-slate-100 text-slate-800 border-slate-300 font-mono text-[11px]',
}

export default function DocBadge({ variant = 'info', children, className = '' }) {
  const baseVariant = BADGE_VARIANTS[variant.toLowerCase()] || BADGE_VARIANTS.info

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border tracking-wide uppercase transition-colors ${baseVariant} ${className}`}
    >
      {children}
    </span>
  )
}
