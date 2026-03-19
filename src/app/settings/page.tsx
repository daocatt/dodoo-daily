'use client'

import React, { useEffect, useState } from 'react'
import { Camera, Lock, LogOut, Loader2, Save, Check, X, Shield, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import NatureBackground from '@/components/NatureBackground'
import PushSubscriptionManager from '@/components/PushSubscriptionManager'
import { motion } from 'framer-motion'

interface User {
    id: string
    name: string
    nickname?: string | null
    slug?: string | null
    role: string
    avatarUrl: string | null
    isParent?: boolean
}

export default function SettingsPage() {
    const { t } = useI18n()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // Nickname
    const [nickname, setNickname] = useState('')
    const [nickSaving, setNickSaving] = useState(false)
    const [nickMessage, setNickMessage] = useState('')
    const [nickError, setNickError] = useState('')

    // Slug
    const [slug, setSlug] = useState('')
    const [slugSaving, setSlugSaving] = useState(false)
    const [slugMessage, setSlugMessage] = useState('')
    const [slugError, setSlugError] = useState('')

    // PIN
    const [pin, setPin] = useState('')
    const [pinSaving, setPinSaving] = useState(false)
    const [pinMessage, setPinMessage] = useState('')
    const [pinError, setPinError] = useState('')

    // Avatar
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.isParent) {
                    router.push('/parent')
                    return
                }
                setUser(data)
                setNickname(data.nickname || '')
                setSlug(data.slug || '')
                setLoading(false)
            })
            .catch(() => router.push('/login'))
    }, [router])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData })
            const data = await res.json()
            if (res.ok && user) setUser({ ...user, avatarUrl: data.avatarUrl })
        } catch (e) { console.error(e) }
        finally { setUploading(false) }
    }

    const handleNicknameSave = async () => {
        setNickSaving(true); setNickError(''); setNickMessage('')
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname })
            })
            const data = await res.json()
            if (res.ok) {
                if (user) setUser({ ...user, nickname: data.nickname })
                setNickMessage(t('settings.nicknameSuccess') || 'Nickname updated!')
            } else {
                setNickError(data.error || t('settings.updateFailed') || 'Failed')
            }
        } catch (e) { setNickError(t('settings.errorNetwork') || 'Network error') }
        finally { setNickSaving(false) }
    }

    const handleSlugSave = async () => {
        setSlugSaving(true); setSlugError(''); setSlugMessage('')
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug })
            })
            const data = await res.json()
            if (res.ok) {
                if (user) setUser({ ...user, slug: data.slug ?? null })
                setSlug(data.slug || '')
                setSlugMessage('Link ID updated!')
            } else {
                setSlugError(data.error || 'Failed to update')
            }
        } catch (e) { setSlugError('Network error') }
        finally { setSlugSaving(false) }
    }

    const handlePinUpdate = async () => {
        if (pin.length < 4) { setPinError(t('settings.pinLengthError') || 'Minimum 4 digits'); return }
        setPinSaving(true); setPinError(''); setPinMessage('')
        try {
            const res = await fetch('/api/user/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            })
            if (res.ok) { setPinMessage(t('settings.pinUpdateSuccess') || 'PIN updated!'); setPin('') }
            else { setPinError(t('settings.updateFailed') || 'Failed') }
        } catch (e) { setPinError(t('settings.errorNetwork') || 'Network error') }
        finally { setPinSaving(false) }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    if (loading) return (
        <div className="h-dvh flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    )

    const avatarSrc = user?.avatarUrl || '/dog.svg'
    const displayName = user?.nickname || user?.name || ''

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden">
            <NatureBackground />

            <div className="relative z-10 flex flex-col min-h-dvh">
                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="px-6 py-5 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-sm hover:bg-white/70 transition-all active:scale-90 border border-white/60"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#4a3728]">
                            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-black text-[#2c2416] tracking-tight">{t('settings.title')}</h1>
                </header>

                {/* ── Content ─────────────────────────────────────────────── */}
                <main className="flex-1 px-5 pb-10 max-w-lg mx-auto w-full space-y-4">

                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-xl overflow-hidden"
                    >
                        {/* Colorful top band */}
                        <div className="h-20 bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 relative">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />
                        </div>

                        <div className="px-6 pb-6 -mt-10">
                            {/* Avatar */}
                            <div className="relative inline-block mb-4">
                                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                    {uploading ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                    ) : (
                                        <img
                                            src={`${avatarSrc}?v=5`}
                                            alt="Avatar"
                                            className={`w-full h-full object-cover ${!user?.avatarUrl ? 'p-4' : ''}`}
                                            onError={(e) => { e.currentTarget.src = '/dog.svg'; e.currentTarget.className = 'w-full h-full object-contain p-4' }}
                                        />
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-orange-600 shadow-md shadow-orange-200 transition-all active:scale-90">
                                    <Camera className="w-3.5 h-3.5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>

                            {/* Name display */}
                            <div className="mb-5">
                                <p className="text-xl font-black text-slate-800">{displayName}</p>
                                <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{user?.role}</span>
                            </div>

                            {/* Nickname field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t('settings.nickname') || 'Nickname'}</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={e => { setNickname(e.target.value); setNickError(''); setNickMessage('') }}
                                    placeholder={t('settings.nicknamePlaceholder') || 'Your nickname'}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-bold text-slate-800 hover:border-slate-100 hover:bg-white focus:bg-white focus:border-indigo-100 transition-all"
                                />
                                <p className="text-[10px] text-indigo-400 font-bold px-1">💡 {t('settings.nicknameHint') || 'Used for login and display'}</p>
                            </div>

                            {nickError && (
                                <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                                    <X className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span className="text-xs font-bold text-rose-600">{nickError}</span>
                                </div>
                            )}
                            {nickMessage && (
                                <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="text-xs font-bold text-emerald-600">{nickMessage}</span>
                                </div>
                            )}

                            <button
                                onClick={handleNicknameSave}
                                disabled={nickSaving}
                                className="mt-4 w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.01] disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                            >
                                {nickSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {nickSaving ? (t('common.loading') || 'Saving…') : (t('settings.saveNickname') || 'Save')}
                            </button>

                            {/* Slug / Public Link ID */}
                            <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                    🔗 {t('settings.linkId') || 'Public Link ID'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">/u/</span>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setSlugError(''); setSlugMessage('') }}
                                        placeholder="your-link-id"
                                        className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none font-mono font-bold text-slate-800 text-sm hover:border-slate-100 hover:bg-white focus:bg-white focus:border-indigo-100 transition-all"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold px-1">💡 {t('settings.linkIdHint') || 'Your public exhibition page URL. Lowercase letters, numbers and hyphens only.'}</p>

                                {slugError && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span className="text-xs font-bold text-rose-600">{slugError}</span>
                                    </div>
                                )}
                                {slugMessage && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="text-xs font-bold text-emerald-600">{slugMessage}</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleSlugSave}
                                    disabled={slugSaving}
                                    className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                >
                                    {slugSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {slugSaving ? (t('common.loading') || 'Saving…') : (t('settings.saveLinkId') || 'Save Link ID')}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Security PIN Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-xl p-6 space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-sm">{t('settings.securityPin') || 'Security PIN'}</h3>
                                <p className="text-[10px] text-slate-400 font-bold">{t('settings.securityPinDesc') || 'Update your login PIN'}</p>
                            </div>
                        </div>

                        <input
                            type="password"
                            maxLength={6}
                            value={pin}
                            onChange={e => { setPin(e.target.value); setPinError(''); setPinMessage('') }}
                            placeholder="••••"
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-2xl font-black tracking-[0.5em] text-center text-slate-700 hover:border-slate-100 hover:bg-white focus:bg-white focus:border-indigo-100 transition-all"
                        />

                        {pinError && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span className="text-xs font-bold text-rose-600">{pinError}</span>
                            </div>
                        )}
                        {pinMessage && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="text-xs font-bold text-emerald-600">{pinMessage}</span>
                            </div>
                        )}

                        <button
                            onClick={handlePinUpdate}
                            disabled={pinSaving}
                            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                        >
                            {pinSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            {pinSaving ? (t('common.loading') || 'Updating…') : (t('settings.updatePin') || 'Update PIN')}
                        </button>
                    </motion.div>

                    {/* Push Notifications Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-xl px-6 py-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                                    <Bell className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800">{t('settings.pushNotifications') || 'Notifications'}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold">{t('settings.pushNotificationsDesc') || 'Real-time alerts'}</p>
                                </div>
                            </div>
                            <PushSubscriptionManager />
                        </div>
                    </motion.div>

                    {/* Logout */}
                    <motion.button
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        onClick={handleLogout}
                        className="w-full py-4 bg-white/70 backdrop-blur-2xl border border-rose-100 rounded-3xl text-rose-500 font-black flex items-center justify-center gap-2.5 shadow-xl hover:bg-rose-50 transition-all active:scale-[0.98] text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        {t('common.logout') || 'Log Out'}
                    </motion.button>
                </main>
            </div>
        </div>
    )
}
