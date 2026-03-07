'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, User, Loader2, ArrowLeft, CheckSquare, Upload } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import NatureBackground from '@/components/NatureBackground'

type AuthUser = {
    id: string
    name: string
    role: string
    avatarUrl: string | null
    hasPin: boolean
}

export default function LoginPage() {
    const [users, setUsers] = useState<AuthUser[]>([])
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
    const [pin, setPin] = useState('')
    const [rememberMe, setRememberMe] = useState(true)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { t, locale } = useI18n()

    // First Launch States
    const [isFirstLaunch, setIsFirstLaunch] = useState(false)
    const [firstLaunchName, setFirstLaunchName] = useState('')
    const [firstLaunchAvatarPreview, setFirstLaunchAvatarPreview] = useState<string | null>(null)
    const [firstLaunchAvatarFile, setFirstLaunchAvatarFile] = useState<File | null>(null)
    const firstLaunchFileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/users').then(res => res.json()),
            fetch('/api/system/settings').then(res => res.json())
        ])
            .then(([usersData, settingsData]) => {
                setUsers(usersData)
                if (settingsData.needsSetup && usersData.length === 1 && usersData[0].role === 'PARENT' && usersData[0].name === 'Parent') {
                    setIsFirstLaunch(true)
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError(t('login.error.network'))
                setLoading(false)
            })
    }, [t])

    const handleFirstLaunchSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!firstLaunchName.trim()) {
            setError('Please enter your name.')
            return
        }
        setLoading(true)
        setError('')

        const formData = new FormData()
        formData.append('name', firstLaunchName)
        if (firstLaunchAvatarFile) {
            formData.append('file', firstLaunchAvatarFile)
        }

        try {
            const res = await fetch('/api/setup/parent', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (res.ok && data.success) {
                window.location.href = '/setup'
            } else {
                setError(data.error || 'Failed to initialize')
                setLoading(false)
            }
        } catch (err) {
            setError(t('login.error.network'))
            setLoading(false)
        }
    }

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!selectedUser) return

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: selectedUser.id,
                    pin: selectedUser.hasPin ? pin : undefined,
                    rememberMe
                })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                // Parent: check if first-run setup wizard is needed
                if (data.needsSetup) {
                    window.location.href = '/setup'
                } else {
                    window.location.href = '/'
                }
            } else {
                setError(data.error === 'Invalid PIN' ? t('login.error.invalidPin') : (data.error || t('login.error.network')))
                setLoading(true)
                setLoading(false)
            }
        } catch (err) {
            setError(t('login.error.network'))
            setLoading(false)
        }
    }

    return (
        <div className="h-dvh flex items-center justify-center relative overflow-hidden text-[#4a3728]">
            <NatureBackground />

            <div className="relative z-10 w-full max-w-4xl p-6">
                <AnimatePresence mode="wait">
                    {!selectedUser ? (
                        <motion.div
                            key="selector"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                            className="flex flex-col items-center"
                        >
                            <h1 className="text-3xl md:text-5xl font-extrabold text-[#4a3728] mb-12 drop-shadow-sm tracking-tight">
                                {t('login.title')}
                            </h1>

                            {loading ? (
                                <Loader2 className="w-12 h-12 animate-spin text-white drop-shadow-md" />
                            ) : isFirstLaunch ? (
                                <form onSubmit={handleFirstLaunchSubmit} className="flex flex-col items-center gap-6 w-full max-w-sm">
                                    <div className="relative group w-40 h-40 md:w-56 md:h-56 rounded-2xl bg-[#4a3728]/10 backdrop-blur-md border-2 border-[#43aa8b] shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 hover:bg-[#4a3728]/20 hover:shadow-2xl cursor-pointer" onClick={() => firstLaunchFileInputRef.current?.click()}>
                                        <div className={`absolute top-4 left-4 px-3 py-1 text-[10px] md:text-xs font-bold rounded-full text-white z-20 bg-[#43aa8b]/90 shadow-md flex items-center gap-1`}>
                                            <Upload className="w-3 h-3" /> {t('login.firstLaunchAvatar')}
                                        </div>
                                        {firstLaunchAvatarPreview ? (
                                            <img src={firstLaunchAvatarPreview} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 select-none" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-white/80 group-hover:scale-110 transition-transform duration-500">
                                                <img src="/parent_avatar.png" alt="default" className="w-32 h-32 object-cover rounded-full" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>
                                    <input ref={firstLaunchFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setFirstLaunchAvatarFile(file)
                                            setFirstLaunchAvatarPreview(URL.createObjectURL(file))
                                        }
                                    }} />

                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        value={firstLaunchName}
                                        onChange={e => setFirstLaunchName(e.target.value)}
                                        placeholder={t('login.firstLaunchPlaceholder')}
                                        className="w-full px-6 py-4 bg-white/90 backdrop-blur-md rounded-2xl border-2 border-slate-100 focus:border-[#43aa8b] focus:ring-4 focus:ring-[#43aa8b]/20 outline-none transition-all font-bold text-xl text-center shadow-lg text-[#4a3728]"
                                    />

                                    {error && <div className="text-rose-500 font-bold bg-white/90 px-4 py-2 rounded-xl text-sm w-full text-center">{error}</div>}

                                    <button
                                        type="submit"
                                        disabled={loading || !firstLaunchName.trim()}
                                        className="w-full py-4 mt-2 bg-[#43aa8b] hover:bg-[#328a6f] text-white rounded-xl font-bold text-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "进入系统"}
                                    </button>
                                </form>
                            ) : (
                                <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                                    {users.map((u, i) => (
                                        <motion.button
                                            key={u.id}
                                            onClick={() => {
                                                setSelectedUser(u)
                                                setPin('')
                                                setError('')
                                            }}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1, type: 'spring' }}
                                            whileTap={{ scale: 0.98 }}
                                            className="group flex flex-col items-center gap-6"
                                        >
                                            <div className={`w-40 h-40 md:w-56 md:h-56 rounded-2xl bg-[#4a3728]/5 backdrop-blur-md border-2 ${u.role === 'PARENT' ? 'border-[#43aa8b]' : 'border-[#277da1]'} shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-[#4a3728]/10 group-hover:shadow-2xl relative`}>
                                                <div className={`absolute top-4 left-4 px-3 py-1 text-[10px] md:text-xs font-bold rounded-full text-white z-20 ${u.role === 'PARENT' ? 'bg-[#43aa8b]/90' : 'bg-[#277da1]/90'}`}>
                                                    {u.role === 'PARENT' ? t('login.parent') : t('login.child')}
                                                </div>
                                                {u.avatarUrl ? (
                                                    <img
                                                        src={`${u.avatarUrl}?v=4`}
                                                        alt={u.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-125 select-none"
                                                        onError={(e) => { e.currentTarget.src = "/dog.svg"; }}
                                                    />
                                                ) : (
                                                    <User className={`w-16 h-16 md:w-20 md:h-20 text-white/80 drop-shadow-sm transition-transform duration-500 ease-out group-hover:scale-125`} />
                                                )}
                                                {/* Subtle inner shadow effect on hover */}
                                                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            </div>
                                            <span className="text-xl md:text-3xl font-bold text-white drop-shadow-md tracking-wide bg-[#4a3728]/40 px-6 py-2 rounded-xl backdrop-blur-md group-hover:bg-[#4a3728]/60 transition-colors">
                                                {u.name}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="max-w-md w-full mx-auto"
                        >
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex items-center gap-2 text-[#4a3728] hover:text-[#1a241a] mb-6 font-bold transition-all bg-white/60 px-5 py-2 rounded-xl backdrop-blur-sm mx-auto shadow-sm border border-[#4a3728]/10"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('login.back')}
                            </button>

                            <form onSubmit={handleLogin} className="bg-white/90 backdrop-blur-2xl p-8 md:p-10 rounded-2xl shadow-xl border border-white flex flex-col items-center">
                                <div className={`w-24 h-24 rounded-xl overflow-hidden bg-[#ebf3eb] shadow-inner flex items-center justify-center mb-6`}>
                                    {selectedUser.avatarUrl ? (
                                        <img
                                            src={`${selectedUser.avatarUrl}?v=4`}
                                            alt={selectedUser.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = "/dog.svg"; }}
                                        />
                                    ) : (
                                        <User className="w-10 h-10 text-white drop-shadow-sm" />
                                    )}
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedUser.name}</h2>
                                <p className="text-slate-500 font-medium mb-8 text-sm">
                                    {selectedUser.role === 'PARENT' ? t('login.parent') : t('login.child')}
                                </p>

                                {error && (
                                    <div className="w-full bg-red-50 text-red-500 font-bold px-4 py-3 rounded-2xl mb-6 text-center text-sm border border-red-100">
                                        {error}
                                    </div>
                                )}

                                {selectedUser.hasPin ? (
                                    <div className="w-full mb-6">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                value={pin}
                                                onChange={e => setPin(e.target.value)}
                                                placeholder={t('login.pinPlaceholder')}
                                                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all font-bold text-lg shadow-sm"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-6 text-slate-500 font-medium bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                        {t('login.clickToContinue')}
                                    </div>
                                )}

                                <label className="flex items-center gap-3 w-full mb-8 cursor-pointer group">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#4a5a4a] border-[#4a5a4a]' : 'border-[#d1dcd1] bg-white group-hover:border-[#4a5a4a]'}`}>
                                        {rememberMe && <CheckSquare className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="font-bold text-[#4a5a4a] select-none">{t('login.rememberMe')}</span>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                        className="hidden"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[#43aa8b] hover:bg-[#328a6f] text-white rounded-xl font-bold text-xl shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('login.loginButton')}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    )
}
