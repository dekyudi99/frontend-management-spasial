import React, { useState, useMemo } from 'react'
import { Card, Modal, Input, Button } from 'antd'
import { Globe, Search, Check, ChevronRight, Languages } from 'lucide-react'
import { availableLanguages } from '../../i18n/translations'

const LanguageSelectCard = ({ language, setLanguage, t }) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Cari bahasa yang sedang aktif
    const currentLangObj = useMemo(() => {
        return (
            availableLanguages.find((l) => l.code === language) ||
            availableLanguages[0]
        )
    }, [language])

    // Filter daftar bahasa berdasarkan query pencarian (DRY & Scalable)
    const filteredLanguages = useMemo(() => {
        if (!searchQuery.trim()) return availableLanguages
        const q = searchQuery.toLowerCase().trim()
        return availableLanguages.filter(
            (l) =>
                l.label.toLowerCase().includes(q) ||
                l.nativeName.toLowerCase().includes(q) ||
                l.code.toLowerCase().includes(q) ||
                (l.region && l.region.toLowerCase().includes(q))
        )
    }, [searchQuery])

    const handleSelectLanguage = (code) => {
        setLanguage(code)
        setIsModalOpen(false)
        setSearchQuery('')
    }

    return (
        <>
            <Card
                className='shadow-sm border border-slate-200/80 rounded-2xl overflow-hidden'
                title={
                    <div className='flex items-center gap-2.5 py-1'>
                        <div className='w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold'>
                            <Globe className='w-4 h-4' />
                        </div>
                        <div>
                            <h3 className='text-sm sm:text-base font-bold text-slate-800'>
                                {t('languageSettingsTitle', 'Language Preferences')}
                            </h3>
                            <p className='text-[11px] sm:text-xs text-slate-400 font-normal'>
                                {t('languageSettingsDesc', 'Choose your preferred language for the interface')}
                            </p>
                        </div>
                    </div>
                }
            >
                <div className='flex flex-col gap-3'>
                    <div className='flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl'>
                        <div className='flex items-center gap-3'>
                            <span className='text-2xl leading-none'>{currentLangObj.flag}</span>
                            <div>
                                <p className='text-xs text-slate-500 font-medium'>
                                    {t('currentLanguage', 'Current Language')}
                                </p>
                                <p className='text-sm font-bold text-slate-800'>
                                    {currentLangObj.nativeName}{' '}
                                    <span className='text-xs font-normal text-slate-500'>
                                        ({currentLangObj.label})
                                    </span>
                                </p>
                            </div>
                        </div>

                        <span className='text-xs font-mono font-bold px-2 py-1 rounded bg-teal-100 text-teal-800 uppercase'>
                            {currentLangObj.code}
                        </span>
                    </div>

                    <Button
                        type="default"
                        size="large"
                        onClick={() => setIsModalOpen(true)}
                        icon={<Languages className='w-4 h-4 text-teal-600 mr-1' />}
                        className='w-full border-teal-600/30 text-teal-700 hover:text-teal-800 hover:border-teal-600 bg-white font-semibold h-10 rounded-xl flex items-center justify-center gap-1 cursor-pointer'
                    >
                        <span>{t('changeLanguage', 'Change Language')}</span>
                        <ChevronRight className='w-4 h-4' />
                    </Button>
                </div>
            </Card>

            {/* Modal Pop-up Pilihan Bahasa Lengkap dengan Menu Pencarian */}
            <Modal
                title={
                    <div className='flex items-center gap-2 text-teal-900 font-bold text-base sm:text-lg'>
                        <Globe className='w-5 h-5 text-teal-600' />
                        <span>{t('selectLanguageTitle', 'Select Application Language')}</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false)
                    setSearchQuery('')
                }}
                footer={null}
                centered
                destroyOnClose
                className='max-w-[92vw] sm:max-w-[460px]'
            >
                <div className='py-2'>
                    {/* Menu Pencarian Bahasa */}
                    <Input
                        prefix={<Search className='w-4 h-4 text-slate-400 mr-1.5' />}
                        placeholder={t('searchLanguagePlaceholder', 'Search language or country...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        size="large"
                        className='rounded-xl mb-3'
                        autoFocus
                    />

                    {/* Daftar Pilihan Bahasa (Scrollable & Scalable) */}
                    <div className='max-h-72 overflow-y-auto space-y-2 pr-1'>
                        {filteredLanguages.length > 0 ? (
                            filteredLanguages.map((opt) => {
                                const isActive = language === opt.code
                                return (
                                    <button
                                        key={opt.code}
                                        type="button"
                                        onClick={() => handleSelectLanguage(opt.code)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                                            isActive
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className='flex items-center gap-3'>
                                            <span className='text-2xl leading-none'>{opt.flag}</span>
                                            <div>
                                                <p className={`text-sm ${isActive ? 'font-bold text-white' : 'font-semibold text-slate-800'}`}>
                                                    {opt.nativeName}
                                                </p>
                                                <p className={`text-xs ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                                                    {opt.label} {opt.region && `• ${opt.region}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            <span
                                                className={`text-[11px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                                                    isActive
                                                        ? 'bg-teal-700 text-teal-100'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {opt.code}
                                            </span>
                                            {isActive && <Check className='w-4 h-4 text-white' />}
                                        </div>
                                    </button>
                                )
                            })
                        ) : (
                            <div className='py-8 text-center text-slate-400 text-xs sm:text-sm'>
                                <Search className='w-8 h-8 mx-auto mb-2 text-slate-300' />
                                <p>{t('noLanguageFound', 'No language matching your search.')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default LanguageSelectCard
