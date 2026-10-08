import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
    // Ambil default language dari .env jika ada (default fallback 'en')
    const envDefaultLang = import.meta.env.VITE_DEFAULT_LANGUAGE || 'en'

    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem('app_language')
        if (saved && (saved === 'en' || saved === 'id' || saved === 'th')) {
            return saved
        }
        return envDefaultLang
    })

    const setLanguage = (lang) => {
        if (lang === 'en' || lang === 'id' || lang === 'th') {
            setLanguageState(lang)
            localStorage.setItem('app_language', lang)
        }
    }

    // Sinkronkan atribut DOM <html lang> dan meta content-language setiap pergantian bahasa
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language
            const metaLang = document.querySelector('meta[http-equiv="content-language"]')
            if (metaLang) {
                metaLang.setAttribute('content', language)
            }
        }
    }, [language])

    // Helper untuk mengambil terjemahan string dengan dukungan interpolasi {paramName}
    // Mendukung signature: t(key, params, fallback) maupun t(key, fallback, params)
    const t = useCallback((key, paramsOrFallback = '', optionalFallback = '') => {
        const currentTranslations = translations[language] || translations['en'] || {}
        let text = currentTranslations[key]

        let params = null
        let fallback = ''

        if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
            params = paramsOrFallback
            fallback = typeof optionalFallback === 'string' ? optionalFallback : key
        } else if (typeof optionalFallback === 'object' && optionalFallback !== null) {
            fallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : key
            params = optionalFallback
        } else {
            fallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : key
        }

        if (text === undefined) {
            // Fallback ke kamus bahasa Inggris jika belum ada di bahasa aktif
            text = translations['en']?.[key] !== undefined ? translations['en'][key] : fallback
        }

        // Jalankan interpolasi jika ada parameter {key}
        if (params && typeof text === 'string') {
            for (const [pKey, pVal] of Object.entries(params)) {
                text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal !== undefined && pVal !== null ? pVal : ''))
            }
        }

        return text !== undefined ? text : fallback
    }, [language])

    // Helper untuk menerjemahkan pesan respon API dari FastAPI / GeoServer Microservice
    const translateApi = useCallback((errOrMessage, fallbackKey = '') => {
        if (!errOrMessage) return fallbackKey ? t(fallbackKey) : ''
        
        let apiMessage = ''
        if (typeof errOrMessage === 'string') {
            apiMessage = errOrMessage
        } else if (typeof errOrMessage === 'object') {
            apiMessage = errOrMessage.response?.data?.detail || 
                         errOrMessage.response?.data?.message || 
                         errOrMessage.message || 
                         ''
        }

        if (!apiMessage) {
            return fallbackKey ? t(fallbackKey) : 'Terjadi kesalahan pada server.'
        }

        const currentTranslations = translations[language] || translations['en']
        const dict = currentTranslations.apiMessages || {}
        
        // 1. Exact match
        if (dict[apiMessage]) {
            return dict[apiMessage]
        }

        // 2. Partial match (untuk pesan dengan parameter dinamis)
        for (const [key, translated] of Object.entries(dict)) {
            if (apiMessage.includes(key)) {
                return translated
            }
        }

        // 3. Fallback jika ada fallbackKey
        if (fallbackKey && currentTranslations[fallbackKey]) {
            return currentTranslations[fallbackKey]
        }

        return apiMessage
    }, [language, t])

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translateApi }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export { LanguageContext }
