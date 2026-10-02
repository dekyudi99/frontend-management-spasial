import React from 'react'
import CodeBlock from '../atoms/CodeBlock'
import { useLanguage } from '../../../context/LanguageContext'

export default function ResponseExample({
  statusCode = 200,
  description = 'Respons Berhasil',
  jsonCode = '',
  fieldDescriptions = []
}) {
  const { t } = useLanguage()

  return (
    <div className="my-3 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
            statusCode >= 200 && statusCode < 300
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : statusCode >= 400
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}
        >
          {statusCode}
        </span>
        <span className="text-xs font-medium text-slate-700">{description}</span>
      </div>

      {jsonCode && <CodeBlock code={jsonCode} language="json" title={`JSON Response (${statusCode})`} />}

      {fieldDescriptions && fieldDescriptions.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg bg-white">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2 px-3">{t("thResponseField", "Response Field")}</th>
                <th className="py-2 px-3">{t("thMeaningUsage", "Meaning & Usage")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fieldDescriptions.map((fd, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-1.5 px-3 font-mono font-semibold text-slate-800">{fd.field}</td>
                  <td className="py-1.5 px-3 text-slate-600">{fd.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

