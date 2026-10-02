import React from 'react'
import DocBadge from '../atoms/DocBadge'
import { useLanguage } from '../../../context/LanguageContext'

export default function ParamTable({ params = [] }) {
  const { t } = useLanguage()
  if (!params || params.length === 0) return null

  return (
    <div className="overflow-x-auto my-3 border border-slate-200 rounded-xl bg-white shadow-xs">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <th className="py-2.5 px-3.5">{t("thParamField", "Parameter / Field")}</th>
            <th className="py-2.5 px-3.5">{t("thType", "Type")}</th>
            <th className="py-2.5 px-3.5">{t("thStatus", "Status")}</th>
            <th className="py-2.5 px-3.5">{t("thDescription", "Description")}</th>
            <th className="py-2.5 px-3.5">{t("thExample", "Example")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {params.map((p, idx) => (
            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-2.5 px-3.5 font-mono text-xs font-semibold text-blue-700">
                {p.name}
              </td>
              <td className="py-2.5 px-3.5">
                <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {p.type}
                </span>
              </td>
              <td className="py-2.5 px-3.5">
                <DocBadge variant={p.required ? 'required' : 'optional'}>
                  {p.required ? t("required", "Required") : t("optional", "Optional")}
                </DocBadge>
              </td>
              <td className="py-2.5 px-3.5 text-xs text-slate-700 leading-relaxed min-w-[200px]">
                {p.description}
              </td>
              <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600 max-w-[200px] truncate" title={p.example}>
                {p.example || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

