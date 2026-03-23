'use client'

import React, { useState } from 'react'
import { Camera, Check, X, Loader2, Save, Lock, Shield, Image as ImageIcon } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { motion } from 'framer-motion'
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
            {/* ── Avatar + Identity ───────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 overflow-hidden">
                {/* Header band */}
                <div className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 relative">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                </div>

                <div className="px-8 pb-8 -mt-14">
                    {/* Avatar */}
                    <div className="relative inline-block mb-5">
                        <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                            ) : (
                                <img
                                    src={`${avatarUrl || '/dog.svg'}?v=5`}
                                    alt="Avatar"
                                    className={`w-full h-full object-cover ${!avatarUrl ? 'p-5' : ''}`}
                                    onError={(_e) => { e.currentTarget.src = '/dog.svg'; e.currentTarget.className = 'w-full h-full object-contain p-5' }}
                                />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-90">
                            <Camera className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                    </div>

                    <div className="space-y-5">
                        {/* Real Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {t('settings.realName') || 'Real Name'}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => { setName(e.target.value); setError(''); setMessage('') }}
                                placeholder="Your real name"
                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-bold text-slate-800 hover:border-slate-100 hover:bg-white focus:bg-white focus:border-indigo-100 transition-all"
                            />
                        </div>

                        {/* Nickname */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                {t('settings.nickname') || 'Nickname'}
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={e => { setNickname(e.target.value); setError(''); setMessage('') }}
                                placeholder="Display nickname"
                                className="w-full px-5 py-3.5 bg-indigo-50/30 border-2 border-indigo-50 rounded-2xl outline-none font-bold text-indigo-700 hover:border-indigo-100 hover:bg-indigo-50/50 focus:bg-white focus:border-indigo-200 transition-all"
                            />
                            <p className="text-[10px] text-indigo-400 font-bold px-1">
                                💡 {t('settings.nicknameHint') || 'Used for login and display'}
                            </p>
                        </div>

                        {/* Slug / Public Link ID */}
                        <div className="space-y-1.5 pt-4 border-t border-slate-50">
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                🔗 {t('settings.linkId') || 'Public Link ID'}
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">/u/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setError(''); setMessage('') }}
                                    placeholder="your-link-id"
                                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none font-mono font-bold text-slate-800 text-sm hover:border-slate-100 hover:bg-white focus:bg-white focus:border-indigo-100 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const randId = Math.floor(10000000 + Math.random() * 90000000).toString();
                                        setSlug(randId);
                                        setError('');
                                        setMessage('');
                                    }}
                                    className="h-[48px] px-3 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-100 hover:text-indigo-500 transition-all text-slate-400 group"
                                    title="Auto-generate numeric ID"
                                >
                                    <span className="group-hover:scale-110 block transition-transform">✨</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold px-1">
                                💡 {t('settings.linkIdHint') || 'Your public exhibition page URL.'}
                            </p>
                        </div>

                        {/* Exhibition Status Toggle */}
                        <div className="space-y-3 pt-4 border-t border-slate-50">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                    {t('settings.exhibitionStatus') || 'Exhibition Status'}
                                </label>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${exhibitionEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {exhibitionEnabled ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                            
                            <button
                                type="button"
                                onClick={() => { setExhibitionEnabled(!exhibitionEnabled); setError(''); setMessage('') }}
                                className={`w-full group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                                    exhibitionEnabled 
                                    ? 'bg-emerald-50/50 border-emerald-100/50 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200' 
                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                    exhibitionEnabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'
                                }`}>
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-sm">{exhibitionEnabled ? t('settings.exhibitionEnabled') : t('settings.exhibitionDisabled')}</div>
                                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-tight">
                                        {exhibitionEnabled ? 'People can visit your exhibition' : 'Exhibition page is hidden'}
                                    </div>
                                </div>
                                <div className={`ml-auto w-10 h-5 rounded-full relative transition-colors ${exhibitionEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${exhibitionEnabled ? 'left-6' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>

                        {/* Feedback */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 rounded-2xl border border-rose-100">
                                <X className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="text-sm font-bold text-rose-600">{error}</span>
                            </div>
                        )}
                        {message && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="text-sm font-bold text-emerald-600">{message}</span>
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.01] disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? (t('common.loading') || 'Saving…') : (t('button.save') || 'Save Changes')}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Security PIN ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800">{t('settings.securityPin') || 'Security Password'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t('settings.securityPinDesc') || 'Update your access code'}</p>
                    </div>
                </div>

                <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={e => { setPin(e.target.value); setPinError(''); setPinMessage('') }}
                    placeholder="••••"
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-3xl font-black tracking-[0.6em] text-center text-slate-700 hover:border-slate-100 hover:bg-white focus:bg-white focus:border-indigo-100 transition-all"
                />

                {pinError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 rounded-2xl border border-rose-100">
                        <X className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="text-sm font-bold text-rose-600">{pinError}</span>
                    </div>
                )}
                {pinMessage && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-bold text-emerald-600">{pinMessage}</span>
                    </div>
                )}

                <button
                    onClick={handlePinUpdate}
                    disabled={pinSaving}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                    {pinSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    {pinSaving ? (t('common.loading') || 'Updating…') : (t('settings.updatePin') || 'Update Password')}
                </button>
            </div>

            {/* ── Push Notifications ───────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-slate-800">{t('settings.pushNotifications') || 'Push Notifications'}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{t('settings.pushNotificationsDesc') || 'Get real-time alerts'}</p>
                    </div>
                    <PushSubscriptionManager />
                </div>
            </div>
        </motion.div>
    )
}
