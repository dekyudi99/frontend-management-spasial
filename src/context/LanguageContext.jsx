import React, { createContext, useContext, useState, useEffect } from 'react'
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

    // Helper untuk mengambil terjemahan string
    const t = (key, fallback = '') => {
        const currentTranslations = translations[language] || translations['en']
        return currentTranslations[key] !== undefined ? currentTranslations[key] : fallback || key
    }

    // Helper untuk menerjemahkan pesan respon API dari FastAPI
    const translateApi = (apiMessage) => {
        if (!apiMessage || typeof apiMessage !== 'string') return apiMessage
        const currentTranslations = translations[language] || translations['en']
        const dict = currentTranslations.apiMessages || {}
        
        // Exact match
        if (dict[apiMessage]) {
            return dict[apiMessage]
        }

        // Partial match (misalnya jika ada dynamic parameter seperti "Verification OTP code has been sent to your new email (xxx)")
        for (const [key, translated] of Object.entries(dict)) {
            if (apiMessage.includes(key)) {
                return translated
            }
        }

        return apiMessage
    }

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
