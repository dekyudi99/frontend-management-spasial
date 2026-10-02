import React from 'react'
import { Button, Empty, Spin, Tag } from 'antd'
import { Folder, Plus, ArrowRight, ExternalLink, Lock } from 'lucide-react'
import formatTanggal from '../utils/formatTanggal'
import { useLanguage } from '../context/LanguageContext'

const RecentWorkspaceList = ({ 
  workspaces = [], 
  isLoading = false, 
  isKeyDisabled = false,
  onOpenCreateModal, 
  navigate 
}) => {
  const { t } = useLanguage()

  if (isKeyDisabled) {
    return (
      <div className="py-8 text-center bg-red-50/50 rounded-xl border border-dashed border-red-200 p-4">
        <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-800">{t('accessGeoServerDeactivated', 'Akses Workspace Dinonaktifkan')}</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          {t('accessDeactivatedHeroDesc', 'API Key Anda sedang dinonaktifkan oleh Administrator. Hubungi admin untuk mengaktifkan kembali akses GeoServer.')}
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Spin tip={t('loading', 'Loading workspaces...')} />
      </div>
    )
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="py-10 text-center">
        <Empty description={t('noWorkspaceInGeoServer', 'Belum ada workspace di GeoServer')}>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenCreateModal}
            className="!bg-blue-600 mt-2"
          >
            {t('buildFirstWorkspace', 'Buat Workspace Pertama')}
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {workspaces.map((ws) => (
        <div
          key={ws.id || ws.name}
          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/75 rounded-lg px-2 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 mt-0.5">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-slate-900 text-sm m-0">
                  {ws.display_name || ws.name}
                </h4>
                <Tag color="blue" className="!text-xs !rounded-md font-mono">
                  GeoServer: {ws.ws_name || ws.name}
                </Tag>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t('workspaceCountDesc', 'Workspace aktif terisolasi di GeoServer Microservice')}
              </p>
            </div>
          </div>

          <Button
            type="primary"
            ghost
            size="small"
            onClick={() => navigate(`/dashboard/workspace?id=${ws.id || ws.name}`)}
            className="!text-xs !font-medium self-start sm:self-auto flex items-center gap-1 hover:!bg-blue-50"
          >
            {t('openWorkspace', 'Buka Workspace')} <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export default RecentWorkspaceList

