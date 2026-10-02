import React from 'react'
import ParamTable from '../molecules/ParamTable'
import StepList from '../molecules/StepList'
import ResponseExample from '../molecules/ResponseExample'
import Callout from '../molecules/Callout'
import { useLanguage } from '../../../context/LanguageContext'

export default function FeatureSection({
  id = '',
  title = '',
  subtitle = '',
  badge = '',
  whenToUse = '',
  inputs = [],
  steps = [],
  output = null,
  commonErrors = [],
  tips = [],
  children
}) {
  const { t } = useLanguage()

  return (
    <article id={id} className="scroll-mt-24 mb-12 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
            {badge && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* 1. Kapan Dipakai */}
      {whenToUse && (
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            {t("whenToUseTitle", "When to Use")}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
            {whenToUse}
          </p>
        </div>
      )}

      {/* 2. Input / Parameter */}
      {inputs && inputs.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            {t("inputsParamsTitle", "Inputs & Parameters")}
          </h4>
          <ParamTable params={inputs} />
        </div>
      )}

      {/* 3. Langkah / Cara Penggunaan */}
      {steps && steps.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            {t("stepsTitle", "Steps")}
          </h4>
          <StepList steps={steps} />
        </div>
      )}

      {/* Optional custom children between steps and output */}
      {children}

      {/* 4. Output / Hasil */}
      {output && (
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            {t("outputResultsTitle", "Output & Results")}
          </h4>
          {output.text && <p className="text-xs sm:text-sm text-slate-700 mb-2">{output.text}</p>}
          {output.response && (
            <ResponseExample
              statusCode={output.response.statusCode}
              description={output.response.description}
              jsonCode={output.response.jsonCode}
              fieldDescriptions={output.response.fieldDescriptions}
            />
          )}
        </div>
      )}

      {/* 5. Kesalahan Umum */}
      {commonErrors && commonErrors.length > 0 && (
        <div className="mb-5">
          <Callout type="warning" title={t("commonErrorsTitle", "Common Errors & Pitfalls")}>
            <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
              {commonErrors.map((err, idx) => (
                <li key={idx}>
                  <strong>{err.problem}:</strong> {err.solution}
                </li>
              ))}
            </ul>
          </Callout>
        </div>
      )}

      {/* 6. Tips */}
      {tips && tips.length > 0 && (
        <div>
          <Callout type="tip" title={t("tipsTitle", "Tips & Best Practices")}>
            <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
              {tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </Callout>
        </div>
      )}
    </article>
  )
}

