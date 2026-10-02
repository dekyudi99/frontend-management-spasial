import React, { useState } from 'react'
import CodeBlock from '../atoms/CodeBlock'

const LANGUAGES = [
  { id: 'curl', label: 'cURL', syntax: 'bash' },
  { id: 'python', label: 'Python', syntax: 'python' },
  { id: 'javascript', label: 'JavaScript', syntax: 'javascript' },
  { id: 'php', label: 'PHP / Laravel', syntax: 'php' }
]

export default function LanguageTabs({ examples = {}, defaultLang = 'curl' }) {
  const [activeLang, setActiveLang] = useState(defaultLang)

  const availableLangs = LANGUAGES.filter(l => Boolean(examples[l.id]))

  if (availableLangs.length === 0) return null

  const currentTab = availableLangs.find(l => l.id === activeLang) || availableLangs[0]
  const currentCode = examples[currentTab.id] || ''

  return (
    <div className="my-4 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden shadow-md">
      <div className="flex items-center gap-1 px-3 pt-2.5 bg-slate-900 border-b border-slate-800 overflow-x-auto">
        {availableLangs.map((tab) => {
          const isActive = tab.id === currentTab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveLang(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-slate-950 text-blue-400 border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="p-0">
        <CodeBlock
          code={currentCode}
          language={currentTab.syntax}
          title={`${currentTab.label} Request Example`}
          className="border-none shadow-none my-0 rounded-none bg-transparent"
        />
      </div>
    </div>
  )
}
