import React from 'react'
import SearchBar from '../molecules/SearchBar'
import { useLanguage } from '../../../context/LanguageContext'

export default function SidebarNav({
  items = [],
  activeId = '',
  onSelect,
  searchQuery = '',
  onSearchChange
}) {
  const { t } = useLanguage()

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 pb-10">
      <div className="mb-3 px-1">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
          {t("docNavigation", "Documentation Navigation")}
        </span>
        <SearchBar value={searchQuery} onChange={onSearchChange} placeholder={t("filterGuidePlaceholder", "Filter guide...")} />
      </div>

      <nav className="space-y-1">
        {items.map((sec) => {
          const isActive = activeId === sec.id
          return (
            <div key={sec.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => onSelect(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                {sec.badge && (
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                    {sec.badge}
                  </span>
                )}
              </button>

              {/* Sub items if present */}
              {sec.subItems && sec.subItems.length > 0 && (
                <div className="pl-3.5 space-y-0.5 border-l border-slate-200 ml-2.5 my-1">
                  {sec.subItems.map((sub) => {
                    const isSubActive = activeId === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onSelect(sub.id)}
                        className={`w-full text-left px-2.5 py-1 rounded text-[11px] transition-colors truncate block ${
                          isSubActive
                            ? 'text-blue-600 font-semibold bg-blue-50/50'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {sub.title}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
