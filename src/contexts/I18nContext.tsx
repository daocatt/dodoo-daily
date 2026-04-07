'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { en } from '../i18n/locales/en'
import { zhCN } from '../i18n/locales/zh-CN'

export type Locale = 'en' | 'zh-CN'

type Dictionary = Record<Locale, Record<string, string>>

const dictionaries: Dictionary = {
    'en': en,
    'zh-CN': zhCN
}

interface I18nContextProps {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

export function I18nProvider({ children, defaultLocale = 'en' }: { children: React.ReactNode, defaultLocale?: Locale }) {
    const [locale, setLocale] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dodoo-locale') as Locale
            if (saved && ['en', 'zh-CN'].includes(saved)) {
                return saved
            }
        }
        // Ensure defaultLocale is valid
        if (defaultLocale && ['en', 'zh-CN'].includes(defaultLocale)) {
            return defaultLocale
        }
        return 'en'
    })

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale === 'zh-CN' ? 'zh' : 'en'
        }
    }, [locale])

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale)
        localStorage.setItem('dodoo-locale', newLocale)

        // Asynchronously attempt to sync with database (for family members only)
        // We use a silent background fetch to avoid blocking the UI transition.
        if (typeof window !== 'undefined') {
            fetch('/api/user/locale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale: newLocale })
            }).catch(() => { /* Silent fail */ })
        }
    }

    const t = (key: string, params?: Record<string, string>) => {
        // Fallback to English if the current locale's dictionary is missing
        const dict = dictionaries[locale] || dictionaries['en'] || {}
        let text = dict[key]

        // Fallback to English if missing in Chinese
        if (!text && locale === 'zh-CN') {
            text = dictionaries['en']?.[key]
        }

        // Fallback to Chinese if missing in English
        if (!text && locale === 'en') {
            text = dictionaries['zh-CN']?.[key]
        }

        if (!text) {
            console.warn(`[i18n] Missing translation for key: ${key}`)
            text = key
        }

        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v)
            })
        }
        return text
    }

    return (
        <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}
