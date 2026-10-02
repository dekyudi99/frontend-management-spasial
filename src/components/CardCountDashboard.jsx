import { Col, Spin } from 'antd'
import { ArrowUpRight, Lock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const CardCountDashboard = ({ 
  name, 
  icon, 
  count, 
  isStatus = false,
  statusValue = true,
  isLocked = false,
  isLoading = false, 
  navigate, 
  linkTo, 
  description, 
  color = 'indigo', 
  className = '',
  xs = 24,
  sm = 12,
  lg = 8
}) => {
  const { t } = useLanguage()

  return (
    <Col xs={xs} sm={sm} lg={lg} className={className}>
      <div
        onClick={() => navigate(linkTo)}
        className={`group bg-white rounded-xl p-5 border ${isLocked ? 'border-rose-200/80 bg-rose-50/20' : 'border-slate-200/80'} shadow-xs hover:shadow-md hover:border-${color}-300 transition-all duration-200 cursor-pointer h-full flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {name}
            </span>
            <div className={`w-10 h-10 rounded-xl ${isLocked ? 'bg-rose-50 text-rose-500' : `bg-${color}-50 text-${color}-600 group-hover:bg-${color}-600 group-hover:text-white`} flex items-center justify-center transition-colors`}>
              {isLocked ? <Lock className="w-5 h-5" /> : icon}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            {isLoading ? (
              <Spin size="small" />
            ) : isLocked ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-400">{t('accessLocked', 'Akses Terkunci')}</span>
                <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold border border-rose-200">
                  {t('statusInactive', 'Nonaktif')}
                </span>
              </div>
            ) : isStatus ? (
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold border transition-colors font-mono"
                style={{
                  backgroundColor: statusValue ? '#ecfdf5' : '#fef2f2',
                  color: statusValue ? '#059669' : '#e11d48',
                  borderColor: statusValue ? '#a7f3d0' : '#fecdd3'
                }}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${statusValue ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {statusValue ? t('statusActiveTrue', 'AKTIF (True)') : t('statusInactiveFalse', 'NONAKTIF (False)')}
              </div>
            ) : (
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {count}
              </div>
            )}
            <ArrowUpRight className={`w-4 h-4 text-slate-400 group-hover:text-${color}-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
          </div>
        </div>
        <p className={`text-xs ${isLocked ? 'text-rose-500 font-medium' : 'text-slate-500'} mt-3 pt-2 border-t border-slate-100/80`}>
          {description}
        </p>
      </div>
    </Col>
  )
}

export default CardCountDashboard