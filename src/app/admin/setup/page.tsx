'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { User, SkipForward, Upload, Calendar, Terminal, ArrowRight, Loader2, Baby, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import PanelHeader from '@/components/PanelHeader'
import { useI18n } from '@/contexts/I18nContext'
import SmartDatePicker from '@/components/SmartDatePicker'

type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export default function SetupPage() {
    const router = useRouter()
    const { t } = useI18n()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Check if already setup
    React.useEffect(() => {
        fetch('/api/open/system/status')
            .then(res => res.json())
            .then(data => {
                if (data.needsSetup === false) {
                    router.push('/')
                }
            })
    }, [router])

    const genderOptions: { value: Gender; label: string; emoji: string; color: string; bg: string }[] = [
        { value: 'MALE', label: t('setup.boy'), emoji: '👦', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
        { value: 'FEMALE', label: t('setup.girl'), emoji: '👧', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
        { value: 'OTHER', label: t('setup.secret'), emoji: '🌈', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    ]

    const [name, setName] = useState('')
    const [nickname, setNickname] = useState('')
    const [gender, setGender] = useState<Gender>('OTHER')
    const [birthDate, setBirthDate] = useState<Date | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [nicknameTouched, setNicknameTouched] = useState(false)

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarFile(file)
        const url = URL.createObjectURL(file)
        setAvatarPreview(url)
    }

    const uploadAvatar = async (): Promise<string | null> => {
        if (!avatarFile) return null
        const formData = new FormData()
        formData.append('file', avatarFile)
        formData.append('type', 'IMAGE')
        try {
            const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
            if (!res.ok) return null
            const data = await res.json()
            return data.path || null
        } catch {
            return null
        }
    }

    const handleSubmit = async (skip = false) => {
        if (submitting) return
        if (!skip) {
            if (!avatarFile) {
                setError(t('setup.errorAvatar'))
                return
            }
            if (!name.trim()) {
                setError(t('setup.errorName'))
                return
            }
            if (!nickname.trim()) {
                setError(t('setup.errorNickname'))
                return
            }
        }
        setSubmitting(true)
        setError('')

        try {
            let avatarUrl: string | null = null
            if (!skip && avatarFile) {
                avatarUrl = await uploadAvatar()
            }

            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skip,
                    name: name.trim(),
                    nickname: nickname.trim() || undefined,
                    gender,
                    birthDate: birthDate ? birthDate.toISOString() : undefined,
                    avatarUrl,
                }),
            })

            if (res.ok) {
                router.push('/')
            } else {
                const data = await res.json()
                setError(data.error || t('setup.errorSubmit'))
            }
        } catch {
            setError(t('setup.errorNetwork'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="h-dvh w-full app-bg-pattern flex items-center justify-center p-4 md:p-8 relative selection:bg-indigo-500/20 overflow-hidden">
            <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'circOut' }}
                    className="baustein-panel shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full flex flex-col max-h-[90vh] overflow-hidden"
                >
                    <PanelHeader id="Initialization Routine" systemName="DoDoo Member" />
                    
                    <div className="flex-1 p-5 md:p-8 flex flex-col bg-[var(--surface-warm)] overflow-y-auto custom-scrollbar">
                        
                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 flex items-center gap-3 hardware-well">
                                <Terminal className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="label-mono text-rose-600 text-[10px] uppercase font-bold tracking-widest leading-relaxed">{error}</span>
                            </div>
                        )}

                        <div className="w-full max-w-lg mx-auto flex flex-col gap-6 md:gap-8">
                            
                            {/* Header & Avatar: Side by Side on Desktop */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 border-b-2 border-dashed border-black/5 pb-6">
                                {/* Avatar */}
                                <div className="flex flex-col items-center gap-2 shrink-0">
                                    <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] hover:scale-105 active:scale-95 transition-transform w-28 h-28 md:w-32 md:h-32 shadow-sm">
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-full bg-white/90 rounded-xl border-2 border-transparent overflow-hidden group relative flex items-center justify-center focus:outline-none hover:border-[var(--accent-moss)] transition-colors shadow-inner"
                                        >
                                            {avatarPreview ? (
                                                <Image 
                                                    src={avatarPreview} 
                                                    alt="avatar" 
                                                    width={200}
                                                    height={200}
                                                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-[var(--accent-moss)] transition-colors">
                                                    <Upload className="w-6 h-6 md:w-8 md:h-8 mb-1 opacity-50" />
                                                    <span className="label-mono text-[8px] md:text-[9px] font-black uppercase tracking-widest">{t('setup.uploadAvatar')}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm shadow-inner">
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                        </button>
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                    <p className="label-mono text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                                        {t('setup.avatarHint')} <span className="text-rose-400">*</span>
                                    </p>
                                </div>
                                
                                {/* Title and Subtitle */}
                                <div className="flex-1 flex flex-col justify-center text-center md:text-left mt-2 md:mt-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 hardware-well rounded-xl mb-3 bg-[#D1CDBC] md:hidden mx-auto">
                                        <Baby className="w-6 h-6 text-[var(--accent-blue)] drop-shadow-sm" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-black uppercase text-[var(--text-primary)] leading-none tracking-tighter mb-2">
                                        {t('setup.title')}
                                    </h1>
                                    <p className="label-mono text-[9px] md:text-[10px] text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
                                        {t('setup.subtitle')}
                                    </p>
                                </div>
                            </div>

                            {/* Form Fields: Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                {/* Name Input */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="label-mono text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> {t('setup.realName')} <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={name}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setName(val);
                                                if (!nicknameTouched) setNickname(val);
                                            }}
                                            placeholder={t('setup.namePlaceholder')}
                                            className="w-full bg-white/90 px-4 py-3.5 rounded-lg border-2 border-transparent focus:border-[var(--accent-moss)] outline-none font-black text-slate-800 placeholder:text-slate-400 text-sm shadow-inner transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Nickname Input */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="label-mono text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        {t('setup.nickname')} <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                        <input
                                            type="text"
                                            value={nickname}
                                            onChange={e => {
                                                setNickname(e.target.value);
                                                setNicknameTouched(true);
                                            }}
                                            placeholder={t('setup.nicknamePlaceholder')}
                                            className="w-full bg-white/90 px-4 py-3.5 rounded-lg border-2 border-transparent focus:border-[var(--accent-moss)] outline-none font-black text-slate-800 placeholder:text-slate-400 text-sm shadow-inner transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                {/* Gender Buttons */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="label-mono text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        {t('setup.gender')}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {genderOptions.map(opt => {
                                            const isActive = gender === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setGender(opt.value)}
                                                    className="hardware-btn group w-full block"
                                                >
                                                    <div className={`hardware-well h-14 md:h-16 w-full rounded-xl overflow-hidden relative transition-all ${
                                                        isActive ? 'ring-2 ring-indigo-500/50 outline-none' : ''
                                                    }`}>
                                                        <div className={`hardware-cap absolute inset-1 md:inset-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 md:gap-1 transition-all shadow-sm ${
                                                            isActive
                                                            ? 'bg-white shadow-md shadow-indigo-500/10 border border-indigo-100'
                                                            : 'bg-[#F4F4F2] group-hover:bg-white border border-transparent grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
                                                        }`}>
                                                            <span className={`text-lg md:text-xl leading-none transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                                {opt.emoji}
                                                            </span>
                                                            <span className={`text-[8.5px] md:text-[9px] font-black uppercase tracking-widest leading-none mt-0.5 ${
                                                                isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'
                                                            }`}>
                                                                {opt.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Birth Date */}
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="label-mono text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> {t('setup.birthDate')}
                                    </label>
                                    <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                        <SmartDatePicker
                                            selected={birthDate || undefined}
                                            onSelect={(date) => setBirthDate(date)}
                                            maxDate={new Date()}
                                            placeholder={t('setup.birthDate')}
                                            triggerClassName="w-full bg-white/90 px-4 py-3.5 rounded-lg border-2 border-transparent focus:border-[var(--accent-moss)] outline-none font-black text-slate-800 text-sm shadow-inner transition-colors flex items-center"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 md:px-8 md:py-6 border-t-2 border-[var(--groove-dark)] bg-[var(--well-bg)] shrink-0 flex flex-col md:flex-row gap-3 justify-between items-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] z-10 relative">
                        
                        <button
                            type="button"
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            className="hardware-btn group order-2 md:order-1 w-full md:w-56"
                        >
                            <div className="hardware-well h-16 w-full rounded-xl overflow-hidden relative">
                                <div className="hardware-cap absolute inset-1.5 bg-[#F4F4F2] rounded-lg flex items-center px-5 justify-between group-hover:bg-white transition-all shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 shadow-inner group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                                            <SkipForward className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
                                        </div>
                                        <span className="font-black text-slate-800 tracking-tight whitespace-nowrap text-sm leading-none">{t('setup.skip')}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors shrink-0" />
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSubmit(false)}
                            disabled={submitting || !name.trim() || !nickname.trim() || !avatarFile}
                            className="hardware-btn group order-1 md:order-2 w-full md:w-64"
                        >
                            <div className={`hardware-well h-16 w-full rounded-xl overflow-hidden relative ${submitting || !name.trim() || !nickname.trim() || !avatarFile ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                                <div className="hardware-cap absolute inset-1.5 bg-[#F4F4F2] rounded-lg flex items-center px-5 justify-between group-hover:bg-white transition-all shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 shadow-inner group-hover:bg-indigo-100 transition-colors">
                                            {submitting ? <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" /> : <ArrowRight className="w-4 h-4 text-indigo-600" />}
                                        </div>
                                        <span className="font-black text-slate-800 tracking-tight whitespace-nowrap text-sm leading-none">{t('setup.submit')}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                                </div>
                            </div>
                        </button>

                    </div>
                </motion.div>
            </div>
        </main>
    )
}
