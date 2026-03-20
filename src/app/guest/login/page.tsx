'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, ArrowRight, Loader2, Heart, CheckCircle2, Lock, Ticket } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'

export default function VisitorAuthPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useI18n()
    const returnUrl = searchParams.get('returnUrl') || '/'

    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN')
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [invitationCode, setInvitationCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    const [settings, setSettings] = useState<Record<string, unknown> | null>(null)

    useEffect(() => {
        fetch('/api/system/settings').then(res => res.json()).then(setSettings).catch(console.error)
    }, [])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const endpoint = mode === 'LOGIN' ? '/api/guest/login' : '/api/guest/register'
        const payload = mode === 'LOGIN' 
            ? { identifier, password }
            : { name, phone, email, password, invitationCode }
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (res.ok) {
                if (mode === 'REGISTER' && data.status === 'PENDING') {
                    setSuccessMsg('Registration submitted! Please wait for parent approval.')
                    setLoading(false)
                } else {
                    // Save guest info in localStorage (or we could use a cookie if API handled it)
                    localStorage.setItem('dodoo_guest', JSON.stringify(data))
                    document.cookie = `dodoo_guest_id=${data.id}; path=/; max-age=${60 * 60 * 24 * 30}`
                    router.push(returnUrl)
                }
            } else {
                setError(data.error || 'Authentication failed')
                setLoading(false)
            }
        } catch (_err) {
            setError('Network error. Please try again.')
            setLoading(false)
        }
    }

    if (settings?.disableVisitorLogin && mode === 'LOGIN') {
        return (
            <div className="h-dvh flex items-center justify-center p-6 bg-slate-900">
                <NatureBackground />
                <div className="relative z-10 bg-white/90 backdrop-blur-3xl p-12 rounded-[3rem] text-center max-w-md shadow-2xl border border-white">
                    <Heart className="w-16 h-16 text-rose-500/30 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-slate-800 mb-4">{t('guests.control.disableLogin') || 'Temporarily Closed'}</h2>
                    <p className="text-slate-500 font-bold leading-relaxed">{t('guest.systemMaintenance')}</p>
                    <button onClick={() => router.push('/')} className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs">{t('common.back') || 'Back Home'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-dvh flex items-center justify-center relative overflow-hidden bg-slate-900 p-4 md:p-6">
            <NatureBackground />

            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md flex flex-col items-center"
            >
                {/* Visual Header - Compact */}
                <div className="flex flex-col items-center mb-6 text-center text-white">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">Welcome, Friend</h1>
                    <p className="text-slate-300/60 font-black uppercase tracking-[0.2em] text-[10px]">Visitor Experience Center</p>
                </div>

                <div className="w-full bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/20 relative overflow-hidden flex flex-col">
                    
                    {/* Tabs - Slimmer */}
                    <div className="flex bg-slate-100/50 p-1 rounded-2xl mb-6">
                        <button 
                            onClick={() => { setMode('LOGIN'); setError(''); setSuccessMsg('') }}
                            className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'LOGIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {t('login.login') || 'Log In'}
                        </button>
                        <button 
                            onClick={() => { setMode('REGISTER'); setError(''); setSuccessMsg('') }}
                            className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'REGISTER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {t('login.register') || 'Register'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-visible">
                        <AnimatePresence mode="wait">
                            {successMsg ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-lg shadow-emerald-50">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 mb-1">Success!</h2>
                                    <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed px-4">{successMsg}</p>
                                    <button onClick={() => setMode('LOGIN')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 active:scale-95 transition-transform">Proceed to Login</button>
                                </motion.div>
                            ) : mode === 'REGISTER' && settings?.disableVisitorRegistration ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-lg shadow-rose-50">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                                        {t('guest.registrationClosed')}
                                    </h2>
                                    <p className="text-slate-500 font-bold text-xs">{t('guest.systemMaintenance')}</p>
                                    <button onClick={() => setMode('LOGIN')} className="mt-8 px-6 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors">
                                        {t('common.back') || 'Back'}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form 
                                    key={mode}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    onSubmit={handleAuth} 
                                    className="space-y-4"
                                >
                                    <div className="space-y-3">
                                        {mode === 'LOGIN' ? (
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={identifier}
                                                    onChange={e => setIdentifier(e.target.value)}
                                                    placeholder={t('guest.identifierPlaceholder') || "Email or Phone Number"} 
                                                    className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none transition-all font-bold text-base text-slate-700 placeholder:text-slate-300"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={name}
                                                        onChange={e => setName(e.target.value)}
                                                        placeholder="Your Name" 
                                                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none transition-all font-bold text-base text-slate-700 placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="relative">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                        <input 
                                                            type="tel" 
                                                            value={phone}
                                                            required={!email}
                                                            onChange={e => setPhone(e.target.value)}
                                                            placeholder="Phone" 
                                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                        <input 
                                                            type="email" 
                                                            value={email}
                                                            required={!phone}
                                                            onChange={e => setEmail(e.target.value)}
                                                            placeholder="Email" 
                                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={invitationCode}
                                                        onChange={e => setInvitationCode(e.target.value)}
                                                        placeholder="Visitor Invitation Code" 
                                                        className="w-full pl-12 pr-6 py-3.5 bg-rose-50/30 border-2 border-transparent focus:border-rose-400 focus:bg-white rounded-2xl outline-none transition-all font-black text-rose-500 placeholder:text-rose-200"
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input 
                                                type="password" 
                                                required
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="Your Password" 
                                                className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none transition-all font-bold text-base text-slate-700 placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-rose-50 text-rose-500 px-4 py-2 rounded-xl flex items-center gap-2 border border-rose-100 text-[10px] font-black uppercase tracking-tight">
                                            <span>!</span> {error}
                                        </div>
                                    )}

                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <span>{mode === 'LOGIN' ? 'Login Now' : 'Join the Family'}</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                    
                                    {mode === 'REGISTER' && (
                                        <p className="text-center text-slate-300 text-[9px] font-black uppercase tracking-widest leading-relaxed px-4 opacity-60">
                                            Requesting access to the public exhibition system
                                        </p>
                                    )}
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                
                <p className="mt-6 text-white/30 text-[8px] font-black uppercase tracking-[0.4em] opacity-40">
                    Privacy First • Secure Access • DoDoo Family
                </p>
            </motion.div>
        </div>
    )
}
