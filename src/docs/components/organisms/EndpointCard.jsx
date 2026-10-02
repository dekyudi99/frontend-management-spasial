import React from 'react'
import DocBadge from '../atoms/DocBadge'
import ParamTable from '../molecules/ParamTable'
import LanguageTabs from '../molecules/LanguageTabs'
import ResponseExample from '../molecules/ResponseExample'
import { useLanguage } from '../../../context/LanguageContext'

export default function EndpointCard({
  id = '',
  method = 'GET',
  path = '',
  title = '',
  description = '',
  authRequired = true,
  params = [],
  bodyParams = [],
  examples = {},
  response = null,
  swaggerUrl = ''
}) {
  const { t } = useLanguage()

  return (
    <div id={id} className="scroll-mt-24 mb-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
      {/* Title & Path */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 mb-3.5">
        <div className="flex items-center gap-2.5">
          <DocBadge variant={method}>{method}</DocBadge>
          <code className="text-xs sm:text-sm font-bold font-mono text-slate-900 break-all">{path}</code>
        </div>
        {swaggerUrl && (
          <a
            href={swaggerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-flex items-center gap-1 transition-colors"
          >
            <span>{t("testInSwagger", "Test in Swagger")}</span>
            <span>↗</span>
          </a>
        )}
      </div>

      <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">{description}</p>

      {/* Query/Path Params */}
      {params && params.length > 0 && (
        <div className="mb-4">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{t("queryParamsTitle", "Query & Path Parameters")}</h5>
          <ParamTable params={params} />
        </div>
      )}

      {/* Request Body Params */}
      {bodyParams && bodyParams.length > 0 && (
        <div className="mb-4">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{t("requestBodyTitle", "Request Body (JSON / Multipart)")}</h5>
          <ParamTable params={bodyParams} />
        </div>
      )}

      {/* Code Examples Tabs */}
      {examples && Object.keys(examples).length > 0 && (
        <div className="mb-4">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("codeRequestExamples", "Code Request Examples")}</h5>
          <LanguageTabs examples={examples} />
        </div>
      )}

      {/* Response Preview */}
      {response && (
        <div className="mt-3">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("responseStructureTitle", "Response Structure")}</h5>
          <ResponseExample
            statusCode={response.statusCode}
            description={response.description}
            jsonCode={response.jsonCode}
            fieldDescriptions={response.fieldDescriptions}
          />
        </div>
      )}
    </div>
  )
}

