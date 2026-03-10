'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { User, ChevronRight, SkipForward, Check, Upload, Sparkles, Baby, Calendar } from 'lucide-react'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Gender = 'MALE' | 'FEMALE' | 'OTHER'



export default function SetupPage() {
    const router = useRouter()
    const { t } = useI18n()
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden">
            <NatureBackground />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-3xl mx-auto px-4 md:px-6"
            >
                {/* Card */}
                <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col md:flex-row">
                    {/* Left/Top Content */}
                    <div className="bg-gradient-to-br from-[#43aa8b] to-[#277da1] p-6 md:p-8 text-white md:w-5/12 flex flex-col md:justify-center items-center md:items-start text-center md:text-left gap-4 md:gap-6 shrink-0 relative overflow-hidden">

                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-inner relative z-10">
                            <Baby className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow" />
                        </div>

                        <div className="relative z-10">
                            <h1 className="text-xl md:text-3xl font-black tracking-tight leading-tight">{t('setup.title')}</h1>
                        </div>

                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#43aa8b]/40 rounded-full blur-2xl pointer-events-none" />
                    </div>

                    {/* Form */}
                    <div className="p-5 md:p-8 flex-1 space-y-4 md:space-y-5 min-w-0">

                        <div className="flex flex-row items-center gap-5">
                            {/* Avatar Picker */}
                            <div className="flex flex-col items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative group w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-[#43aa8b] transition-colors bg-slate-50 flex items-center justify-center"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-[#43aa8b] transition-colors">
                                            <Upload className="w-5 h-5 md:w-6 md:h-6" />
                                            <span className="text-[10px] md:text-xs font-bold">{t('setup.uploadAvatar')}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                <p className="text-[10px] md:text-xs text-slate-400 font-medium text-center leading-tight flex items-center justify-center gap-0.5">
                                    {t('setup.avatarHint')} <span className="text-rose-400">*</span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 flex-1 min-w-0">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> {t('setup.realName')} <span className="text-rose-400">*</span>
                                    </label>
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
                                        className="w-full px-3 py-2 md:py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-[#43aa8b]/20 focus:border-[#43aa8b] outline-none transition-all"
                                    />
                                </div>

                                {/* Nickname */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        {t('setup.nickname')} <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => {
                                            setNickname(e.target.value);
                                            setNicknameTouched(true);
                                        }}
                                        placeholder={t('setup.nicknamePlaceholder')}
                                        className="w-full px-3 py-2 md:py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-[#43aa8b]/20 focus:border-[#43aa8b] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('setup.gender')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {genderOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setGender(opt.value)}
                                        className={`flex flex-col items-center gap-1 py-1.5 md:py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${gender === opt.value
                                            ? `${opt.bg} ${opt.color} border-current scale-[1.02] shadow-md`
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-xl md:text-2xl">{opt.emoji}</span>
                                        <span className="text-[10px] md:text-xs">{opt.label}</span>
                                        {gender === opt.value && (
                                            <motion.div
                                                layoutId="gender-check"
                                                className="absolute"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Birth Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {t('setup.birthDate')}
                            </label>
                            <DatePicker
                                selected={birthDate}
                                onChange={(date: Date | null) => setBirthDate(date)}
                                dateFormat="yyyy-MM-dd"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                placeholderText={t('setup.birthDate')}
                                className="w-full px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 focus:ring-4 focus:ring-[#43aa8b]/20 focus:border-[#43aa8b] outline-none transition-all"
                            />
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-rose-50 text-rose-500 font-bold px-4 py-3 rounded-xl border border-rose-100 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => handleSubmit(false)}
                                disabled={submitting || !name.trim() || !nickname.trim() || !avatarFile}
                                className="w-full py-3 md:py-3.5 bg-[#43aa8b] hover:bg-[#3a9679] text-white font-black rounded-xl shadow-lg shadow-[#43aa8b]/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        {t('setup.submit')}
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                className="w-full py-2 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <SkipForward className="w-4 h-4" />
                                {t('setup.skip')}
                            </button>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    )
}
