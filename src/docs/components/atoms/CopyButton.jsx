import React, { useState } from 'react'
import { useLanguage } from '../../../context/LanguageContext'

export default function CopyButton({ text, label }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayLabel = label || t("copy", "Copy")

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={t("copyToClipboard", "Copy to clipboard")}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 border ${
        copied
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
      }`}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{t("copied", "Copied!")}</span>
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{displayLabel}</span>
        </>
      )}
    </button>
  )
}

