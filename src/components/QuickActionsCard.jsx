import React from 'react'
import { Card, message } from 'antd'
import { Plus, UploadCloud, Globe, FileCode, ArrowUpRight, Sparkles, Lock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const QuickActionsCard = ({ 
  onOpenWorkspaceModal, 
  onOpenLayerModal, 
  navigate, 
  apiDocsUrl,
  isKeyDisabled = false
}) => {
  const { t } = useLanguage()

  const handleDisabledNotice = () => {
    message.warning(t('accessDeactivatedHeroDesc', "Akses GeoServer Microservice sedang dinonaktifkan oleh Administrator."))
  }

  const actions = [
    {
      title: t('quickCreateWorkspace', 'Create Workspace'),
      desc: isKeyDisabled ? t('workspaceCountDescLocked', 'Akses dinonaktifkan oleh Admin') : t('quickCreateWorkspaceDesc', 'Organisasi data & layer spasial Anda'),
      icon: isKeyDisabled ? <Lock className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4" />,
      color: isKeyDisabled ? 'slate' : 'blue',
      requiresActive: true,
      onClick: isKeyDisabled ? handleDisabledNotice : onOpenWorkspaceModal
    },
    {
      title: t('quickPublishLayer', 'Publish GeoTIFF Layer'),
      desc: isKeyDisabled ? t('workspaceCountDescLocked', 'Akses dinonaktifkan oleh Admin') : t('quickPublishLayerDesc', 'Upload 1-band raster directly'),
      icon: isKeyDisabled ? <Lock className="w-4 h-4 text-slate-400" /> : <UploadCloud className="w-4 h-4" />,
      color: isKeyDisabled ? 'slate' : 'emerald',
      requiresActive: true,
      onClick: isKeyDisabled ? handleDisabledNotice : onOpenLayerModal
    },
    {
      title: t('quickOpenMap', 'Open Map Visualization'),
      desc: isKeyDisabled ? t('workspaceCountDescLocked', 'Akses dinonaktifkan oleh Admin') : t('quickOpenMapDesc', 'Preview WMS & interactive map viewer'),
      icon: isKeyDisabled ? <Lock className="w-4 h-4 text-slate-400" /> : <Globe className="w-4 h-4" />,
      color: isKeyDisabled ? 'slate' : 'purple',
      requiresActive: true,
      onClick: isKeyDisabled ? handleDisabledNotice : () => navigate('/dashboard/layer')
    },
    {
      title: t('quickIntegrationGuide', 'S2S Integration Guide'),
      desc: t('quickIntegrationGuideDesc', 'API specs & code examples'),
      icon: <FileCode className="w-4 h-4" />,
      color: 'amber',
      requiresActive: false,
      onClick: () => {
        if (apiDocsUrl) {
          window.open(apiDocsUrl, '_blank')
        } else {
          navigate('/documentation')
        }
      }
    }
  ]

  const colorStyles = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hoverBorder: 'hover:border-blue-400', hoverBg: 'hover:bg-blue-50/50', hoverText: 'group-hover:text-blue-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-400', hoverBg: 'hover:bg-emerald-50/50', hoverText: 'group-hover:text-emerald-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', hoverBorder: 'hover:border-purple-400', hoverBg: 'hover:bg-purple-50/50', hoverText: 'group-hover:text-purple-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', hoverBorder: 'hover:border-amber-400', hoverBg: 'hover:bg-amber-50/50', hoverText: 'group-hover:text-amber-600' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-400', hoverBorder: 'hover:border-slate-300', hoverBg: 'hover:bg-slate-50', hoverText: 'group-hover:text-slate-600' }
  }

  return (
    <Card
      title={
        <span className="font-bold text-slate-800 text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          {t('quickActionsTitle', 'Quick Actions')}
        </span>
      }
      className="!rounded-2xl !border-slate-200/80 !shadow-xs"
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div className="grid grid-cols-1 gap-2.5">
        {actions.map((act, idx) => {
          const c = colorStyles[act.color] || colorStyles.blue
          return (
            <button
              key={idx}
              onClick={act.onClick}
              className={`w-full text-left p-3 rounded-xl border border-slate-200 ${c.hoverBorder} ${c.hoverBg} transition-all flex items-center justify-between group cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                  {act.icon}
                </div>
                <div>
                  <div className={`text-sm font-semibold text-slate-800 ${c.hoverText} transition-colors`}>
                    {act.title}
                  </div>
                  <div className="text-xs text-slate-400">{act.desc}</div>
                </div>
              </div>
              <ArrowUpRight className={`w-4 h-4 text-slate-400 ${c.hoverText} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default QuickActionsCard
