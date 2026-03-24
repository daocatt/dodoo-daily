'use client'

import React, { useState, useEffect } from 'react'
import { Power, ShieldAlert, AlertTriangle, Check, X, Loader2, LayoutGrid, Image as ImageIcon, Globe, Mail, ExternalLink, Info, Heart } from 'lucide-react'
import pkg from '@/../package.json'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
)

export default function SystemSettings() {
    const { t } = useI18n()
    const [showConfirm, setShowConfirm] = useState(false)
    const [systemName, setSystemName] = useState('DoDoo Family')
    const [systemSubtitle, setSystemSubtitle] = useState('')
    const [showAllAvatars, setShowAllAvatars] = useState(true)
    const [hideFamilyLogin, setHideFamilyLogin] = useState(false)
    const [homepageImages, setHomepageImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isClosed, setIsClosed] = useState(false)
    const [starsToCoinsRatio, setStarsToCoinsRatio] = useState(10)
    const [coinsToRmbRatio, setCoinsToRmbRatio] = useState(1.0)
    const [timezone, setTimezone] = useState('Asia/Shanghai')
    const [defaultLocale, setDefaultLocale] = useState<'en' | 'zh-CN'>('en')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // All available timezones
    const timezones = Intl.supportedValuesOf('timeZone')

    useEffect(() => {
        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => {
                setIsClosed(data.isClosed)
                setStarsToCoinsRatio(data.starsToCoinsRatio || 10)
                setCoinsToRmbRatio(data.coinsToRmbRatio || 1.0)
                setTimezone(data.timezone || 'Asia/Shanghai')
                setSystemName(data.systemName || 'DoDoo Family')
                setSystemSubtitle(data.systemSubtitle || '')
                setShowAllAvatars(data.showAllAvatars ?? true)
                setHideFamilyLogin(data.hideFamilyLogin ?? false)
                try {
                    setHomepageImages(data.homepageImages ? JSON.parse(data.homepageImages) : [])
                } catch (_e) { setHomepageImages([]) }
                setDefaultLocale(data.defaultLocale || 'en')
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleUpdateSettings = async (updates: Record<string, unknown>) => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/system/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (res.ok) {
                if (updates.isClosed !== undefined) setIsClosed(updates.isClosed)
                if (updates.starsToCoinsRatio !== undefined) setStarsToCoinsRatio(updates.starsToCoinsRatio)
                if (updates.coinsToRmbRatio !== undefined) setCoinsToRmbRatio(updates.coinsToRmbRatio)
                if (updates.timezone !== undefined) setTimezone(updates.timezone as string)
                if (updates.systemName !== undefined) setSystemName(updates.systemName as string)
                if (updates.systemSubtitle !== undefined) setSystemSubtitle(updates.systemSubtitle as string)
                if (updates.showAllAvatars !== undefined) setShowAllAvatars(updates.showAllAvatars as boolean)
                if (updates.hideFamilyLogin !== undefined) setHideFamilyLogin(updates.hideFamilyLogin as boolean)
                if (updates.homepageImages !== undefined) {
                    try { setHomepageImages(JSON.parse(updates.homepageImages as string)) } catch (_e) { }
                }
                if (updates.defaultLocale !== undefined) setDefaultLocale(updates.defaultLocale as 'en' | 'zh-CN')
                showToast(t('settings.updateSuccess'))
                setShowConfirm(false)
            } else {
                showToast(t('settings.updateFailed'), 'error')
            }
        } catch (_err) {
            console.error('Failed to update settings', _err)
            showToast('Network error', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">{t('settings.loading')}</div>

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-12">
            {/* Toast Message */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${toast.type === 'success' ? 'bg-[#43aa8b]' : 'bg-rose-500'}`}
                    >
                        {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Base Configuration */}
                <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 col-span-1 md:col-span-2">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <LayoutGrid className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">{t('settings.baseConfig')}</h3>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">{t('settings.baseConfigDesc')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('settings.systemName')}</label>
                                    <input
                                        type="text"
                                        value={systemName}
                                        onChange={(e) => setSystemName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="DoDoo Family"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('settings.systemSubtitle')}</label>
                                    <input
                                        type="text"
                                        value={systemSubtitle}
                                        onChange={(e) => setSystemSubtitle(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="Modern Family Companion"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleUpdateSettings({ systemName, systemSubtitle })}
                                disabled={isSaving}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                            >
                                {t('settings.saveIdentity')}
                            </button>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <h4 className="font-black text-slate-800">{t('settings.showAllAvatars')}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('settings.showAllAvatarsDesc')}</p>
                                </div>
                                <button
                                    onClick={() => handleUpdateSettings({ showAllAvatars: !showAllAvatars })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${showAllAvatars ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${showAllAvatars ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <h4 className="font-black text-slate-800">{t('settings.hideFamilyLogin')}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('settings.hideFamilyLoginDesc')}</p>
                                </div>
                                <button
                                    onClick={() => handleUpdateSettings({ hideFamilyLogin: !hideFamilyLogin })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${hideFamilyLogin ? 'bg-rose-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${hideFamilyLogin ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            
                            {/* System Default Language */}
                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-indigo-400" />
                                    {t('settings.systemLanguage')}
                                </label>
                                <select
                                    value={defaultLocale}
                                    onChange={(e) => handleUpdateSettings({ defaultLocale: e.target.value })}
                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="en">English (US)</option>
                                    <option value="zh-CN">简体中文 (Chinese)</option>
                                </select>
                            </div>

                            {/* Moved System Timezone here */}
                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-indigo-400" />
                                    {t('settings.timezone')}
                                </label>
                                <div className="flex flex-col gap-3">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                        <span className="font-black text-slate-700">{timezone}</span>
                                        <span className="text-sm font-bold text-slate-400">
                                            {new Date().toLocaleTimeString(undefined, {
                                                timeZone: timezone,
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <select
                                        value={timezone}
                                        onChange={(e) => handleUpdateSettings({ timezone: e.target.value })}
                                        disabled={isSaving}
                                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                                    >
                                        {timezones.map(tz => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                                {t('settings.homeCarousel')}
                                <span className="text-[10px] text-indigo-400">{homepageImages.length}/5</span>
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                {homepageImages.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden group border border-slate-100">
                                        <Image 
                                            src={url} 
                                            alt="" 
                                            width={100} 
                                            height={100}
                                            className="w-full h-full object-cover" 
                                        />
                                        <button
                                            onClick={() => {
                                                const next = homepageImages.filter((_, i) => i !== idx);
                                                handleUpdateSettings({ homepageImages: JSON.stringify(next) });
                                            }}
                                            className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                                {homepageImages.length < 5 && (
                                    <label className="aspect-square bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group shadow-sm">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-indigo-400" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setUploading(true);
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            try {
                                                const res = await fetch('/api/upload/system', { method: 'POST', body: formData });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    const next = [...homepageImages, data.url];
                                                    handleUpdateSettings({ homepageImages: JSON.stringify(next) });
                                                }
                                            } catch (_e) { } finally { setUploading(false); }
                                        }} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reward System Settings */}
                <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800">{t('settings.rewardEconomy')}</h3>
                        <p className="text-slate-500 text-sm font-medium">{t('settings.rewardEconomyDesc')}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('settings.starsToCoins')}</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={starsToCoinsRatio}
                                    onChange={(e) => setStarsToCoinsRatio(parseInt(e.target.value))}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                                <button
                                    onClick={() => handleUpdateSettings({ starsToCoinsRatio })}
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {t('settings.set')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('settings.coinsToRmb')}</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={coinsToRmbRatio}
                                    onChange={(e) => setCoinsToRmbRatio(parseFloat(e.target.value))}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                                <button
                                    onClick={() => handleUpdateSettings({ coinsToRmbRatio })}
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {t('settings.set')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-4 bg-amber-50 rounded-2xl">
                                <Power className={`w-8 h-8 ${isClosed ? 'text-rose-500' : 'text-emerald-500'}`} />
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isClosed ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {isClosed ? t('settings.statusClosed') : t('settings.statusActive')}
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">{t('settings.masterSwitch')}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            {isClosed
                                ? t('settings.masterSwitchClosedDesc')
                                : t('settings.masterSwitchActiveDesc')}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowConfirm(true)}
                        className={`w-full py-5 rounded-xl font-black text-lg transition-all shadow-xl active:scale-[0.98] mt-8 ${isClosed
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 shadow-lg'
                            : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200 shadow-lg'
                            }`}
                    >
                        {isClosed ? t('settings.activateSystem') : t('settings.closeSystem')}
                    </button>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Info className="w-48 h-48 -rotate-12" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="relative group/logo">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center p-6 shadow-indigo-100 shadow-2xl transition-all group-hover/logo:scale-110 group-hover/logo:rotate-3">
                            <Image 
                                src="/dog.svg" 
                                alt="DoDoo Logo" 
                                width={128} 
                                height={128} 
                                className="w-full h-full object-contain" 
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white">
                            v{pkg.version}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">DoDoo Daily</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{t('settings.modernCompanion')}</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <a
                                href="https://github.com/daocatt/dodoo-daily"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                <GithubIcon className="w-4 h-4" />
                                <span>GitHub</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>

                            <a
                                href="https://zwq.me"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all active:scale-95"
                            >
                                <Globe className="w-4 h-4" />
                                <span>{t('settings.feedback')}</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>

                            <a
                                href="mailto:dev@zwq.me"
                                className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95"
                            >
                                <Mail className="w-4 h-4" />
                                <span>{t('settings.contact')}</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    <div className="flex items-center gap-1.5">
                        {t('settings.footerMadeWith')} <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> {t('settings.footerForFamily')}
                    </div>
                    <div>
                        © {new Date().getFullYear()} {t('settings.footerProject')}
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-xl shadow-2xl p-10 border border-slate-100"
                        >
                            <div className={`w-20 h-20 rounded-lg flex items-center justify-center mb-8 mx-auto ${isClosed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                <ShieldAlert className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-black text-center text-slate-800 mb-4 uppercase tracking-tight">
                                {isClosed ? t('settings.confirmOpenTitle') : t('settings.confirmCloseTitle')}
                            </h3>
                            <p className="text-center text-slate-500 font-medium mb-10 leading-relaxed">
                                {isClosed
                                    ? t('settings.confirmOpenDesc')
                                    : t('settings.confirmCloseDesc')}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleUpdateSettings({ isClosed: !isClosed })}
                                    className={`w-full py-5 text-white rounded-lg font-black text-lg transition-all shadow-xl active:scale-95 ${isClosed ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}
                                >
                                    {t('settings.confirmAction')}
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="w-full py-5 bg-slate-50 text-slate-400 rounded-lg font-bold hover:bg-slate-100 transition-all"
                                >
                                    {t('settings.nevermind')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    )
}
