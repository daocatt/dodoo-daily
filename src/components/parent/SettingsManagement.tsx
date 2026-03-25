'use client'

import React, { useState } from 'react'
import { 
    Camera, 
    Check, 
    X, 
    Loader2, 
    Save, 
    Lock, 
    Shield, 
    Image as ImageIcon,
    Activity 
} from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import PushSubscriptionManager from '@/components/PushSubscriptionManager'

type UserProp = {
    id: string
    name: string
    nickname: string | null
    slug: string | null
    exhibitionEnabled: boolean
    avatarUrl: string | null
    role: 'PARENT' | 'CHILD' | 'GRANDPARENT' | 'OTHER'
}

export default function ProfileManagement({ user }: { user: UserProp }) {
    const { t } = useI18n()
    const [name, setName] = useState(user?.name || '')
    const [nickname, setNickname] = useState(user?.nickname || '')
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
    const [slug, setSlug] = useState(user?.slug || '')
    const [exhibitionEnabled, setExhibitionEnabled] = useState(user?.exhibitionEnabled !== false)
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const [pin, setPin] = useState('')
    const [pinSaving, setPinSaving] = useState(false)
    const [pinMessage, setPinMessage] = useState('')
    const [pinError, setPinError] = useState('')

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setError(''); setMessage('')
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData })
            const data = await res.json()
            if (res.ok) {
                setAvatarUrl(data.avatarUrl)
                await fetch('/api/parent/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatarUrl: data.avatarUrl })
                })
                setMessage(t('settings.avatarSuccess') || 'Avatar updated!')
            } else {
                setError(t('settings.updateFailed') || 'Upload failed')
            }
        } catch (_e) { setError(t('settings.errorNetwork') || 'Network error') }
        finally { setUploading(false) }
    }

    const handleSave = async () => {
        if (slug && slug.length < 6) { setError('Link ID must be at least 6 characters'); return }
        setSaving(true); setError(''); setMessage('')
        try {
            const res = await fetch('/api/parent/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, nickname, avatarUrl, slug, exhibitionEnabled })
            })
            if (res.ok) {
                setMessage(t('parent.profileUpdateSuccess') || 'Profile updated!')
            } else {
                const data = await res.json()
                setError(data.error || t('settings.updateFailed') || 'Failed')
            }
        } catch (_e) { setError(t('settings.errorNetwork') || 'Network error') }
        finally { setSaving(false) }
    }

    const handlePinUpdate = async () => {
        if (pin.length < 4) { setPinError(t('settings.pinLengthError') || 'Password must be at least 4 digits'); return }
        setPinSaving(true); setPinError(''); setPinMessage('')
        try {
            const res = await fetch('/api/user/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            })
            if (res.ok) { setPinMessage(t('settings.pinUpdateSuccess') || 'Password updated!'); setPin('') }
            else { setPinError(t('settings.updateFailed') || 'Failed') }
        } catch (_e) { setPinError(t('settings.errorNetwork') || 'Network error') }
        finally { setPinSaving(false) }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto pb-12 space-y-6"
        >
            {/* ── Identity Module (Industrial Board) ─────────────────────── */}
            <div className="baustein-panel bg-[#E6E2D1] overflow-hidden">
                {/* Visual Telemetry Header */}
                <div className="h-20 bg-[#D1CDBC] relative overflow-hidden border-b border-black/5 flex items-center px-8">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{t('parent.profile')}</h3>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Avatar Upload Well */}
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="hardware-well w-32 h-32 rounded-[2rem] p-2 bg-[#DADBD4] shadow-well overflow-hidden">
                                <div className="hardware-cap w-full h-full rounded-[1.5rem] bg-white overflow-hidden shadow-cap relative flex items-center justify-center">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                    ) : (
                                        <Image
                                            src={`${avatarUrl || '/dog.svg'}?v=5`}
                                            alt="Avatar"
                                            fill
                                            className={`object-cover ${!avatarUrl ? 'p-6 opacity-30 grayscale' : 'transition-transform group-hover:scale-110'}`}
                                            onError={(e) => { 
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/dog.svg'; 
                                                target.className = 'object-contain p-6 opacity-30';
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            <label className="absolute -bottom-1 -right-1 cursor-pointer hardware-btn group/btn">
                                <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center overflow-hidden">
                                     <div className="hardware-cap absolute inset-1 bg-white rounded-lg flex items-center justify-center shadow-cap group-hover/btn:bg-slate-50 transition-colors">
                                        <Camera className="w-4 h-4 text-slate-600" />
                                     </div>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        </div>

                        <div className="flex-1 space-y-1 text-center md:text-left">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{nickname || name}</h4>
                            <div className="flex items-center justify-center md:justify-start gap-1.5 pt-1.5 opacity-50">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="label-mono text-[8px] text-slate-500 uppercase tracking-widest leading-none">
                                    UID: {user?.id.slice(0, 12)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Name Input */}
                         <div className="space-y-2">
                            <label className="label-mono text-[9px] text-slate-400 mb-1 block uppercase tracking-[0.1em]">
                                {t('settings.realName') || 'Legal Name'}
                            </label>
                            <div className="hardware-well p-1 rounded-xl bg-black/5 shadow-inner">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => { setName(e.target.value); setError(''); setMessage('') }}
                                    className="w-full h-11 px-4 bg-white/80 rounded-lg outline-none font-bold text-slate-800 text-sm focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Nickname Input */}
                        <div className="space-y-2">
                            <label className="label-mono text-[9px] text-indigo-400 mb-1 block uppercase tracking-[0.1em]">
                                {t('settings.nickname')}
                            </label>
                            <div className="hardware-well p-1 rounded-xl bg-indigo-50/20 shadow-inner">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={e => { setNickname(e.target.value); setError(''); setMessage('') }}
                                    className="w-full h-11 px-4 bg-white/80 rounded-lg outline-none font-bold text-indigo-900 text-sm focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Slug / Link ID */}
                    <div className="space-y-2.5">
                        <label className="label-mono text-[9px] text-slate-400 mb-1 block uppercase tracking-[0.1em]">
                            {t('settings.linkId') || 'Teleport Alias'}
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 hardware-well p-1 rounded-xl bg-black/5 shadow-inner flex items-center px-1">
                                <span className="label-mono text-[10px] text-slate-500 px-3 select-none">/U/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setError(''); setMessage('') }}
                                    className="flex-1 h-11 bg-transparent px-1 outline-none font-mono font-black text-slate-800 text-sm uppercase"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const randId = Math.floor(10000000 + Math.random() * 90000000).toString();
                                    setSlug(randId);
                                    setError(''); setMessage('');
                                }}
                                className="hardware-btn group shrink-0"
                            >
                                <div className="hardware-well w-12 h-12 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative">
                                     <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center shadow-cap group-hover:bg-slate-50 transition-colors">
                                        <span className="text-[12px] group-hover:scale-125 transition-transform duration-300">⚡</span>
                                     </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Exhibition Slide Switch */}
                    <div className="hardware-well p-4 rounded-2xl bg-black/5 shadow-inner">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{t('settings.exhibitionLabel')}</h5>
                                <p className="label-mono text-[8px] text-slate-400 uppercase tracking-widest">{t('settings.exhibitionDesc')}</p>
                            </div>
                            <button
                                onClick={() => { setExhibitionEnabled(!exhibitionEnabled); setError(''); setMessage('') }}
                                className="hardware-btn group"
                            >
                                <div className={clsx(
                                    "hardware-well w-20 h-9 rounded-full transition-colors relative flex items-center px-1.5",
                                    exhibitionEnabled ? "bg-emerald-100" : "bg-slate-200"
                                )}>
                                    <motion.div 
                                        animate={{ x: exhibitionEnabled ? 40 : 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className={clsx(
                                            "w-6 h-6 rounded-full shadow-cap relative z-10",
                                            exhibitionEnabled ? "bg-emerald-500" : "bg-white"
                                        )} 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                                        <span className={clsx("text-[7px] font-black", exhibitionEnabled ? "text-emerald-500 opacity-20" : "text-slate-400")}>OFF</span>
                                        <span className={clsx("text-[7px] font-black", exhibitionEnabled ? "text-emerald-700" : "text-slate-400 opacity-20")}>ON</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Feedback Console */}
                    <AnimatePresence>
                        {(error || message) && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                {error && (
                                    <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl">
                                        <X className="w-4 h-4 text-rose-500" />
                                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-wide">{error}</span>
                                    </div>
                                )}
                                {message && (
                                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">{message}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Master Save Trigger */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="hardware-btn group w-full pt-4"
                    >
                        <div className="hardware-well h-14 rounded-2xl bg-[#D1CDBC] shadow-well relative overflow-hidden">
                            <div className={clsx(
                                "hardware-cap absolute inset-2 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-[0.2em] transition-all shadow-cap",
                                saving ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700"
                            )}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? t('settings.uploading') : t('settings.commitChanges')}
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* ── Security & System Config ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PIN Configuration */}
                <div className="baustein-panel p-6 bg-[#E6E2D1] flex flex-col gap-5">
                    <div className="flex items-center gap-4 border-b border-black/5 pb-4">
                        <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] flex items-center justify-center">
                            <Lock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('settings.securityPin')}</h4>
                            <p className="text-xs font-black text-slate-900 tracking-tight leading-none">{t('settings.updateAccessCode')}</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="hardware-well p-1 rounded-2xl bg-black/5 shadow-inner">
                            <input
                                type="password"
                                maxLength={6}
                                value={pin}
                                onChange={e => { setPin(e.target.value); setPinError(''); setPinMessage('') }}
                                placeholder="••••"
                                className="w-full h-16 bg-white/80 rounded-xl outline-none text-2xl font-black tracking-[0.6em] text-center text-slate-700 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        <button
                            onClick={handlePinUpdate}
                            disabled={pinSaving}
                            className="hardware-btn group"
                        >
                            <div className="hardware-well h-12 rounded-xl bg-[#DADBD4] shadow-well relative">
                                <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center gap-2 font-black text-[10px] tracking-widest shadow-cap hover:bg-slate-50">
                                    {pinSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                                    {pinSaving ? t('settings.verifying') : t('settings.syncPin')}
                                </div>
                            </div>
                        </button>

                        {pinError && <div className="text-[8px] font-black text-rose-500 uppercase text-center">{pinError}</div>}
                        {pinMessage && <div className="text-[8px] font-black text-emerald-500 uppercase text-center">{pinMessage}</div>}
                    </div>
                </div>

                {/* Notifications Module */}
                <div className="baustein-panel p-6 bg-[#E6E2D1] flex flex-col gap-6">
                     <div className="flex items-center gap-4 border-b border-black/5 pb-4">
                        <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] flex items-center justify-center">
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('settings.pushNotifications')}</h4>
                            <p className="text-xs font-black text-slate-900 tracking-tight leading-none">{t('settings.systemAlerts')}</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="text-center space-y-2">
                             <div className="hardware-well p-5 rounded-3xl bg-black/5 shadow-inner inline-flex items-center justify-center mb-2">
                                <PushSubscriptionManager />
                             </div>
                             <p className="label-mono text-[8px] text-slate-400 max-w-[140px] leading-relaxed mx-auto">
                                Enable browser-level telemetry for real-time task alerts.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
