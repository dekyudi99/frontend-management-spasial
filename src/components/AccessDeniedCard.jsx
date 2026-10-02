import React from 'react';
import { LockOutlined, ReloadOutlined, KeyOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AccessDeniedCard = ({
  featureName = 'Workspace',
  description = null,
  keyData = null,
  onRefresh = null,
  isRefreshing = false,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const title = t('accessDeniedTitle', { feature: featureName });

  const defaultDesc = t(
    'accessDeniedDesc',
    'API Key Anda saat ini sedang dinonaktifkan oleh Administrator. Seluruh akses ke ruang kerja spasial, layer raster, dan visualisasi peta ditangguhkan sementara.'
  );

  return (
    <div className="p-4 sm:p-8 md:p-12 max-w-4xl mx-auto space-y-6 mt-6">
      <div className="bg-white border-2 border-rose-200/80 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-sm transition-all hover:shadow-md">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
          <LockOutlined className="text-3xl" />
        </div>

        <div className="space-y-2.5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {t('yourApiKey', 'API Key Anda')} (
            <code className="text-rose-700 font-mono font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
              {keyData?.masked_key || t('standardKey', 'Standard Key')}
            </code>
            ) {t('currentlyDeactivatedNotice', 'saat ini sedang')} <b>{t('suspendedByAdmin', 'dinonaktifkan oleh Administrator')}</b>.
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {description || defaultDesc}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
          <Tag color="red" className="px-3.5 py-1 text-xs font-bold rounded-full border-rose-200">
            {t('keyStatus', 'STATUS KUNCI')}: {t('keyInactive', 'NONAKTIF')}
          </Tag>
        </div>

        <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
          <Button
            type="primary"
            danger
            icon={<KeyOutlined />}
            onClick={() => navigate('/dashboard/api-key')}
            className="!font-medium !shadow-sm !h-10 !px-5 rounded-xl"
          >
            {t('checkApiKey', 'Periksa Status API Key')}
          </Button>

          {onRefresh && (
            <Button
              icon={<ReloadOutlined className={isRefreshing ? 'animate-spin' : ''} />}
              onClick={onRefresh}
              loading={isRefreshing}
              className="!h-10 !px-4 rounded-xl !text-slate-600"
            >
              {t('retry', 'Coba Lagi')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedCard;
