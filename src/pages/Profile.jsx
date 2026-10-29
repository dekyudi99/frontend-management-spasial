import React, { useEffect } from 'react'
import { Button, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import authApi from '../api/AuthApi'
import { useLanguage } from '../context/LanguageContext'
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard'
import BackButton from '../components/BackButton'
import { UserCheck, AlertCircle, Key, ShieldCheck, ExternalLink, Globe } from 'lucide-react'
import { formatDate } from '../utils/formatters'
import { availableLanguages } from '../i18n/translations'

const appName = import.meta.env.VITE_APP_NAME || 'VoxaGIS'
const portalUrl = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5170'

const Profile = () => {
    const { language, setLanguage, t } = useLanguage()

    useEffect(() => {
        document.title = `${t('profileTitle', 'Profile & Settings')} | ${appName}`
    }, [language, t])

    // Query Mengambil Data Profil Pengguna dari SSO backend
    const {
        data: user,
        isLoading: isProfileLoading,
        isError: isProfileError,
        refetch: refetchProfile
    } = useQuery({
        queryKey: ['userProfile'],
        queryFn: authApi.getProfile,
        select: (res) => res.data?.data,
        staleTime: 0,
        refetchOnMount: 'always',
    })

    const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U'

    if (isProfileLoading) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500'>
                <Spin size="large" />
                <p className='text-sm'>{t('loadingProfile', 'Loading profile data...')}</p>
            </div>
        )
    }

    if (isProfileError) {
        return (
            <div className='max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center'>
                <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-3' />
                <h2 className='text-lg font-bold text-red-800 mb-1'>
                    {t('failedLoadProfile', 'Failed to Load Profile')}
                </h2>
                <p className='text-sm text-red-600 mb-4'>
                    {t('failedLoadProfileDesc', 'An error occurred while loading profile data. Your session might have expired.')}
                </p>
                <Button type="primary" onClick={() => refetchProfile()} className='bg-red-600 hover:bg-red-500'>
                    {t('retry', 'Retry')}
                </Button>
            </div>
        )
    }

    return (
        <div className='h-full overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8'>
            <div className='max-w-6xl mx-auto'>
                {/* Back Navigation */}
                <BackButton fallbackTo="/dashboard" />

                {/* Header Title Section */}
                <div className='mb-6 sm:mb-8'>
                    <div className='flex items-center gap-2 text-blue-600 text-xs sm:text-sm font-semibold mb-1'>
                        <UserCheck className='w-4 h-4' />
                        <span>{t('myAccount', 'My Account')}</span>
                    </div>
                    <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight'>
                        {t('profileTitle', 'Profile & Application Settings')}
                    </h1>
                    <p className='text-slate-500 text-xs sm:text-sm mt-1'>
                        {t('profileSubtitle', 'Identitas akun dikelola terpusat oleh Keycloak SSO. Pengaturan khusus aplikasi VoxaGIS tersedia di bawah.')}
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
                    
                    {/* Left Column: Read-Only Identity Card */}
                    <div className='lg:col-span-5 flex flex-col gap-6'>
                        <ProfileIdentityCard
                            user={user}
                            userInitial={userInitial}
                            formatDate={(val) => formatDate(val, language)}
                            t={t}
                        />

                        {/* Central SSO Account Management Card */}
                        <div className='bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs'>
                            <div className='flex items-center gap-3 mb-3'>
                                <div className='w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0'>
                                    <ShieldCheck className='w-5 h-5' />
                                </div>
                                <div>
                                    <h3 className='text-sm font-bold text-slate-900'>Keycloak SSO</h3>
                                    <p className='text-xs text-slate-500'>Manajemen Identitas Terpusat</p>
                                </div>
                            </div>
                            <p className='text-xs text-slate-600 leading-relaxed mb-4'>
                                Nama, email, kata sandi, dan role akun Anda dikelola secara terpusat oleh sistem Single Sign-On WEFGIS.
                            </p>
                            <a
                                href={`${portalUrl}/profile`}
                                className='w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition shadow-xs'
                            >
                                <span>{t('manageInSsoPortal', 'Kelola Akun di SSO Portal')}</span>
                                <ExternalLink className='w-3.5 h-3.5' />
                            </a>
                        </div>
                    </div>

                    {/* Right Column: App-Specific Settings */}
                    <div className='lg:col-span-7 flex flex-col gap-6'>
                        
                        {/* 1. GeoServer API Key Settings Card */}
                        <div className='bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs'>
                            <div className='flex items-start justify-between gap-4 mb-4'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0'>
                                        <Key className='w-5 h-5' />
                                    </div>
                                    <div>
                                        <h3 className='text-base font-bold text-slate-900'>GeoServer API Keys</h3>
                                        <p className='text-xs text-slate-500 mt-0.5'>Kunci autentikasi Service-to-Service untuk layer & workspace spasial</p>
                                    </div>
                                </div>
                            </div>
                            <p className='text-xs text-slate-600 leading-relaxed mb-5'>
                                API Key digunakan oleh aplikasi client dan pipeline otomatis untuk mengakses GeoServer Microservice dan mempublikasikan data spasial.
                            </p>
                            <Link
                                to="/dashboard/api-key"
                                className='inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs'
                            >
                                <Key className='w-3.5 h-3.5' />
                                <span>{t('manageApiKeys', 'Buka Manajemen API Key')}</span>
                            </Link>
                        </div>

                        {/* 2. Language Preference Card */}
                        <div className='bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs'>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0'>
                                    <Globe className='w-5 h-5' />
                                </div>
                                <div>
                                    <h3 className='text-base font-bold text-slate-900'>{t('changeLanguage', 'Language Preference')}</h3>
                                    <p className='text-xs text-slate-500 mt-0.5'>Pilih bahasa pengantar antarmuka VoxaGIS</p>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                                {availableLanguages.map((l) => (
                                    <button
                                        key={l.code}
                                        type='button'
                                        onClick={() => setLanguage(l.code)}
                                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                                            language === l.code
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <span className='text-xl leading-none'>{l.flag}</span>
                                        <div className='min-w-0'>
                                            <div className='text-xs truncate'>{l.nativeName}</div>
                                            <div className='text-[10px] text-slate-400 uppercase font-semibold'>{l.code}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile