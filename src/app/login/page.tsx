'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, User, Loader2, ArrowLeft, CheckSquare } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import AnimatedSky from '@/components/AnimatedSky'

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
    const { locale } = useI18n()

    useEffect(() => {
        fetch('/api/auth/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError('Failed to load users')
                setLoading(false)
            })
    }, [])

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
                window.location.href = '/' // full reload to re-run middleware and contextual fetches
            } else {
                setError(data.error || 'Login failed')
                setLoading(false)
            }
        } catch (err) {
            setError('Network error')
            setLoading(false)
        }
    }

    const title = locale === 'en' ? 'Who is playing?' : '谁在玩？'
    const parentTag = locale === 'en' ? 'Parent' : '家长'
    const childTag = locale === 'en' ? 'Child' : '儿童'

    return (
        <div className="h-dvh flex items-center justify-center relative overflow-hidden text-[#2c2416]">
            <AnimatedSky />

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
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-12 drop-shadow-lg tracking-tight">
                                {title}
                            </h1>

                            {loading ? (
                                <Loader2 className="w-12 h-12 animate-spin text-white drop-shadow-md" />
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
                                            whileHover={{ scale: 1.05, y: -10 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="group flex flex-col items-center gap-4"
                                        >
                                            <div className={`w-36 h-36 md:w-48 md:h-48 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border-4 ${u.role === 'PARENT' ? 'border-[#a18cd1]/80' : 'border-[#4facfe]/80'} shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:bg-white/40 group-hover:shadow-2xl relative`}>
                                                <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full text-white ${u.role === 'PARENT' ? 'bg-purple-500/80' : 'bg-blue-500/80'}`}>
                                                    {u.role === 'PARENT' ? parentTag : childTag}
                                                </div>
                                                {u.avatarUrl ? (
                                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className={`w-16 h-16 md:w-20 md:h-20 ${u.role === 'PARENT' ? 'text-purple-100' : 'text-blue-100'} drop-shadow-sm group-hover:scale-110 transition-transform`} />
                                                )}
                                            </div>
                                            <span className="text-xl md:text-3xl font-bold text-white drop-shadow-md tracking-wide bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm">
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
                                className="flex items-center gap-2 text-white/80 hover:text-white mb-6 font-medium transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm mx-auto"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {locale === 'en' ? 'Back' : '返回'}
                            </button>

                            <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] shadow-2xl border border-white flex flex-col items-center">
                                <div className={`w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br ${selectedUser.role === 'PARENT' ? 'from-purple-400 to-indigo-400' : 'from-blue-400 to-cyan-400'} shadow-inner flex items-center justify-center mb-6`}>
                                    {selectedUser.avatarUrl ? (
                                        <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-white drop-shadow-sm" />
                                    )}
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedUser.name}</h2>
                                <p className="text-slate-500 font-medium mb-8 text-sm">
                                    {selectedUser.role === 'PARENT' ? parentTag : childTag}
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
                                                placeholder="PIN / Password"
                                                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all font-bold text-lg shadow-sm"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-6 text-slate-500 font-medium bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                                        {locale === 'en' ? 'Click login to continue' : '点击登录继续'}
                                    </div>
                                )}

                                <label className="flex items-center gap-3 w-full mb-8 cursor-pointer group">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                        {rememberMe && <CheckSquare className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="font-bold text-slate-600 select-none">{locale === 'en' ? 'Remember me' : '自动登录 (记住我)'}</span>
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
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (locale === 'en' ? 'Login' : '登录')}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
