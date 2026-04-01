'use client'

import React, { useEffect, useState } from 'react'
import { Fan, Save, ExternalLink, Loader2, Info, Globe, ChevronRight, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/contexts/I18nContext'

export default function ExhibitionSettingsPage() {
    const router = useRouter()
    const { t } = useI18n()
    
    const [loading, setLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
    const [slug, setSlug] = useState('')
    
    const [settings, setSettings] = useState({
        exhibitionTitle: '',
        exhibitionSubtitle: '',
        exhibitionDescription: '',
        exhibitionEnabled: true
    })
    
    // Exhibition settings fetching
    useEffect(() => {
        fetch('/api/auth/profile/exhibition')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setSettings({
                        exhibitionTitle: data.exhibitionTitle || '',
                        exhibitionSubtitle: data.exhibitionSubtitle || '',
                        exhibitionDescription: data.exhibitionDescription || '',
                        exhibitionEnabled: data.exhibitionEnabled !== false
                    })
                    setSlug(data.slug || '')
                }
            })
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaveStatus('saving')
        
        try {
            const res = await fetch('/api/auth/profile/exhibition', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            
            if (res.ok) {
                setSaveStatus('success')
                router.refresh()
                setTimeout(() => setSaveStatus('idle'), 3000)
            } else {
                setSaveStatus('error')
                setTimeout(() => setSaveStatus('idle'), 3000)
            }
        } catch (_err) {
            console.error(_err)
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 text-slate-900">
            <BausteinAdminNavbar 
                onBack={() => router.push('/admin/gallery')}
                actions={
                    <div className="flex items-center gap-2 md:gap-3">
                        {slug && (
                            <Link
                                href={`/u/${slug}/exhibition`}
                                target="_blank"
                                className="hardware-btn group"
                            >
                                <div className="hardware-well h-10 md:h-12 px-3 rounded-xl flex items-center bg-[#DADBD4] shadow-well active:translate-y-0.5 relative border-b-2 border-slate-400/20">
                                    <div className="hardware-cap absolute inset-1 bg-white rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-slate-50 active:translate-y-0.5" />
                                    <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-slate-500 relative z-10" />
                                </div>
                            </Link>
                        )}
                    </div>
                }
            />

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 pb-32 hide-scrollbar flex justify-center">
                {loading ? (
                    <div className="flex justify-center items-center h-64 grayscale opacity-20">
                        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-2xl"
                    >
                        <div className="baustein-panel w-full bg-[#E6E2D1] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col p-8 mb-8">
                                {/* Panel Texture & Screws */}
                                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                                <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                                <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />

                                <div className="flex items-center gap-4 mb-10 border-b-2 border-black/5 pb-6">
                                    <div className="hardware-well w-12 h-12 rounded-xl bg-[#DADBD4] shadow-well relative overflow-hidden flex items-center justify-center">
                                        <div className="hardware-cap absolute inset-1.5 bg-indigo-500 rounded-lg flex items-center justify-center shadow-cap">
                                            <Fan className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                            {t('gallery.exhibition.header')}
                                        </h2>
                                    </div>
                                </div>

                                <form onSubmit={handleSave} className="flex flex-col gap-8">
                                    {/* Enable Toggle & Slug Info */}
                                    <div className="hardware-well rounded-2xl p-6 bg-white/40 border border-[#C8C4B0]/50 shadow-inner">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex flex-col">
                                                <h3 className="font-black text-slate-700 uppercase tracking-tighter mt-0.5">{t('gallery.exhibition.enableLabel')}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('gallery.exhibition.enableDesc')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSettings({ ...settings, exhibitionEnabled: !settings.exhibitionEnabled })}
                                                className={clsx(
                                                    "hardware-well w-14 h-8 rounded-full transition-all relative p-1.5",
                                                    settings.exhibitionEnabled ? "bg-amber-500/20 shadow-[inset_0_2px_10px_rgba(245,158,11,0.2)]" : "bg-slate-200"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-5 h-5 rounded-full transition-all shadow-cap hardware-cap",
                                                    settings.exhibitionEnabled ? "translate-x-6 bg-amber-500" : "translate-x-0 bg-white"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="h-px bg-black/5 w-full mb-5" />

                                        <div className="flex items-center gap-3">
                                            <div className="hardware-well w-9 h-9 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden">
                                                <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center shadow-cap">
                                                    <Globe className="w-4 h-4 text-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="label-mono text-[9px] text-slate-400 uppercase tracking-widest font-black leading-none mb-1">
                                                    {t('gallery.exhibition.publicSlug')}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-black text-slate-700 tracking-tighter uppercase italic break-all leading-tight max-w-[280px]">
                                                            {slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${slug}/exhibition` : 'NOT_ASSIGNED'}
                                                        </p>
                                                    </div>
                                                    <Link 
                                                        href="/admin/profile" 
                                                        className="label-mono text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-600 transition-colors group/link shrink-0"
                                                    >
                                                        {t('gallery.exhibition.modifySlug')}
                                                        <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Exhibition Title */}
                                        <div>
                                            <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                                {t('gallery.exhibition.titleLabel')}
                                            </label>
                                            <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC] shadow-well">
                                                <input
                                                    type="text"
                                                    value={settings.exhibitionTitle}
                                                    onChange={e => setSettings({ ...settings, exhibitionTitle: e.target.value })}
                                                    className="w-full bg-white/90 px-5 py-4 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none font-black text-slate-800 text-base shadow-inner transition-colors"
                                                    placeholder={t('gallery.exhibition.titlePlaceholder')}
                                                />
                                            </div>
                                        </div>

                                        {/* Exhibition Subtitle */}
                                        <div>
                                            <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                                {t('gallery.exhibition.subtitleLabel')}
                                            </label>
                                            <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC] shadow-well">
                                                <input
                                                    type="text"
                                                    value={settings.exhibitionSubtitle}
                                                    onChange={e => setSettings({ ...settings, exhibitionSubtitle: e.target.value })}
                                                    className="w-full bg-white/90 px-5 py-4 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none font-black text-slate-800 text-base shadow-inner transition-colors"
                                                    placeholder={t('gallery.exhibition.subtitlePlaceholder')}
                                                />
                                            </div>
                                        </div>

                                        {/* Exhibition Description */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2 ml-1">
                                                <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {t('gallery.exhibition.descriptionLabel')}
                                                </label>
                                            </div>
                                            <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC] shadow-well">
                                                <textarea
                                                    value={settings.exhibitionDescription}
                                                    onChange={e => setSettings({ ...settings, exhibitionDescription: e.target.value })}
                                                    className="w-full bg-white/90 px-5 py-4 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors min-h-[140px] resize-none"
                                                    placeholder={t('gallery.exhibition.descriptionPlaceholder')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saveStatus === 'saving'}
                                        className="hardware-btn group w-full"
                                    >
                                        <div className="hardware-well h-14 w-full rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                            <div className={clsx(
                                                "hardware-cap absolute inset-1.5 rounded-lg flex items-center justify-center transition-all shadow-cap group-active:translate-y-0.5",
                                                saveStatus === 'success' ? "bg-emerald-500" : saveStatus === 'error' ? "bg-rose-500" : "bg-amber-500 group-hover:bg-amber-600 disabled:grayscale"
                                            )}>
                                                <span className="label-mono text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                    {saveStatus === 'saving' ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            {t('common.processing')}
                                                        </>
                                                    ) : saveStatus === 'success' ? (
                                                        <>
                                                            <Check className="w-4 h-4 text-emerald-200" />
                                                            {t('common.saveSuccess')}
                                                        </>
                                                    ) : saveStatus === 'error' ? (
                                                        <>
                                                            <AlertCircle className="w-4 h-4 text-rose-200" />
                                                            {t('common.saveError')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            {t('button.saveSettings')}
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </form>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    )
}
