'use client'

import React from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePushNotification } from '@/hooks/usePushNotification'
import { useI18n } from '@/contexts/I18nContext'

export default function PushSubscriptionManager() {
    const { permission, isSubscribed, loading, subscribe, unsubscribe } = usePushNotification()
    const { t } = useI18n()

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-slate-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">{t('common.loading')}</span>
            </div>
        )
    }

    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 text-rose-400 p-2" title="Notifications blocked in browser">
                <BellOff className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{t('settings.pushBlocked')}</span>
            </div>
        )
    }

    if (isSubscribed) {
        return (
            <button
                onClick={unsubscribe}
                className="flex items-center gap-2 text-emerald-500 hover:text-rose-500 p-2 transition-colors group"
                title="Unsubscribe from notifications"
            >
                <Bell className="w-4 h-4 fill-emerald-500 group-hover:hidden" />
                <BellOff className="w-4 h-4 hidden group-hover:block" />
                <span className="text-xs font-bold uppercase tracking-widest">{t('settings.pushSubscribed')}</span>
            </button>
        )
    }

    return (
        <button
            onClick={subscribe}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 p-2 transition-colors"
            title="Subscribe to notifications"
        >
            <Bell className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">{t('settings.pushUnsubscribed')}</span>
        </button>
    )
}

