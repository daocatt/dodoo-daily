'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Locale = 'en' | 'zh-CN'

type Dictionary = {
    [key in Locale]: {
        [key: string]: string
    }
}

const dictionaries: Dictionary = {
    'en': {
        'site.title': 'DoDoo Daily',
        'footer.copyright': 'copyright @{year} by DoDoo Daily',
    },
    'zh-CN': {
        'site.title': 'DoDoo Daily',
        'footer.copyright': 'copyright @{year} by DoDoo Daily',
    }
}

interface I18nContextProps {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>('en')

    useEffect(() => {
        const saved = localStorage.getItem('dodoo-locale') as Locale
        if (saved && ['en', 'zh-CN'].includes(saved)) {
            setLocale(saved)
        } else {
            const browserLang = navigator.language
            if (browserLang.toLowerCase().includes('zh')) {
                setLocale('zh-CN')
            }
        }
    }, [])

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale)
        localStorage.setItem('dodoo-locale', newLocale)
    }

    const t = (key: string, params?: Record<string, string>) => {
        let text = dictionaries[locale][key] || key
        if (params) {
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
