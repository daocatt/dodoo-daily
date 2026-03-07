'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { User, ChevronRight, SkipForward, Check, Upload, Sparkles, Baby, Calendar } from 'lucide-react'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'

type Gender = 'MALE' | 'FEMALE' | 'OTHER'

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string; color: string; bg: string }[] = [
    { value: 'MALE', label: '男孩', emoji: '👦', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { value: 'FEMALE', label: '女孩', emoji: '👧', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    { value: 'OTHER', label: '保密', emoji: '🌈', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
]

export default function SetupPage() {
    const router = useRouter()
    const { t } = useI18n()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [name, setName] = useState('')
    const [nickname, setNickname] = useState('')
    const [gender, setGender] = useState<Gender>('OTHER')
    const [birthDate, setBirthDate] = useState('')
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

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
        try {
            const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData })
            if (!res.ok) return null
            const data = await res.json()
            return data.url || null
        } catch {
            return null
        }
    }

    const handleSubmit = async (skip = false) => {
        if (!skip && !name.trim()) {
            setError('请输入孩子的名字')
            return
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
                    birthDate: birthDate || undefined,
                    avatarUrl,
                }),
            })

            if (res.ok) {
                router.push('/')
            } else {
                const data = await res.json()
                setError(data.error || '提交失败，请重试')
            }
        } catch {
            setError('网络错误，请重试')
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
                className="relative z-10 w-full max-w-lg mx-auto px-4"
            >
                {/* Header Badge */}
                <div className="flex justify-center mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="flex items-center gap-2 bg-[#43aa8b] text-white px-5 py-2 rounded-full text-sm font-black shadow-lg shadow-[#43aa8b]/30"
                    >
                        <Sparkles className="w-4 h-4" />
                        首次使用 · 欢迎来到 DoDoo
                    </motion.div>
                </div>

                {/* Card */}
                <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-br from-[#43aa8b] to-[#277da1] p-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Baby className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">添加孩子的信息</h1>
                                <p className="text-white/70 text-sm font-medium mt-1">可以先跳过，稍后在父母设置中添加</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-6 md:p-8 space-y-6">

                        {/* Avatar Picker */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-[#43aa8b] transition-colors bg-slate-50 flex items-center justify-center"
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-[#43aa8b] transition-colors">
                                        <Upload className="w-6 h-6" />
                                        <span className="text-[10px] font-bold">上传头像</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            <p className="text-xs text-slate-400 font-medium">点击上传头像（可选）</p>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> 真实姓名 <span className="text-rose-400">*</span>
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="孩子的名字"
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-[#43aa8b]/20 focus:border-[#43aa8b] outline-none transition-all"
                            />
                        </div>

                        {/* Nickname */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">昵称（可选）</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                placeholder="小名 / 昵称"
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-[#43aa8b]/20 focus:border-[#43aa8b] outline-none transition-all"
                            />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">性别</label>
                            <div className="grid grid-cols-3 gap-2">
                                {GENDER_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setGender(opt.value)}
                                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-bold text-sm transition-all ${gender === opt.value
                                                ? `${opt.bg} ${opt.color} border-current scale-[1.02] shadow-md`
                                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-2xl">{opt.emoji}</span>
                                        <span className="text-xs">{opt.label}</span>
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
                                <Calendar className="w-3.5 h-3.5" /> 出生年月（可选）
                            </label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={e => setBirthDate(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 focus:ring-4 focus:ring-[#43aa8b]/20 focus:border-[#43aa8b] outline-none transition-all"
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
                                disabled={submitting || !name.trim()}
                                className="w-full py-4 bg-[#43aa8b] hover:bg-[#3a9679] text-white font-black rounded-xl shadow-lg shadow-[#43aa8b]/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        完成设置，进入首页
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <SkipForward className="w-4 h-4" />
                                暂时跳过，稍后設置
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-white/60 font-medium mt-4 drop-shadow">
                    跳过后可随时在「父母设置 → 孩子管理」中添加
                </p>
            </motion.div>
        </div>
    )
}
