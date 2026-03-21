'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Lock, Ticket, ShieldCheck, Terminal, Disc, Power, Activity } from 'lucide-react'

const PanelHeader = ({ id }: { id: string }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--groove-dark)] bg-[var(--surface-warm)]">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] shadow-[0_0_8px_var(--accent-blue)]" />
            <span className="font-black text-xs tracking-tight uppercase">Visitor Terminal</span>
        </div>
        <div className="px-3 py-1 bg-[var(--well-bg)] rounded-md shadow-inner text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            {id}
        </div>
    </div>
)
import { useRouter, useSearchParams } from 'next/navigation'
import GalleryBackground from '@/components/GalleryBackground'
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
                    setSuccessMsg('Registration submitted! Please wait for approval.')
                    setLoading(false)
                } else {
                    localStorage.setItem('dodoo_guest', JSON.stringify(data))
                    document.cookie = `dodoo_guest_id=${data.id}; path=/; max-age=${60 * 60 * 24 * 30}`
                    router.push(returnUrl)
                }
            } else {
                setError(data.error || 'Authentication failed')
                setLoading(false)
            }
        } catch (_err) {
            setError('Network connection error.')
            setLoading(false)
        }
    }



    if (settings?.disableVisitorLogin && mode === 'LOGIN') {
        return (
            <main className="min-h-dvh app-bg-pattern flex items-center justify-center p-6">
                <div className="baustein-panel max-w-md w-full shadow-2xl">
                    <PanelHeader id="SYSTEM LOCK" />
                    <div className="p-12 text-center bg-[var(--surface-warm)]">
                        <div className="w-20 h-20 hardware-well rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-[#C8C4B0]">
                            <Lock className="w-10 h-10 text-[var(--text-muted)]" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Temporarily Closed</h2>
                        <p className="label-mono opacity-60 leading-relaxed mb-10 px-4">Visitor authentication services are currently suspended for maintenance.</p>
                        <button 
                            onClick={() => router.push('/')} 
                            className="hardware-btn w-full"
                        >
                            <div className="hardware-cap bg-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-black/5">
                                Return to Origin
                            </div>
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="h-dvh overflow-hidden app-bg-pattern flex items-center justify-center p-4 md:p-8 relative">
            {/* Global Back Button */}
            <div className="absolute top-6 left-6 z-50">
                <button 
                    onClick={() => router.push('/')}
                    className="hardware-btn group"
                >
                    <div className="hardware-cap bg-white px-4 py-2 rounded-xl flex items-center gap-2 border border-black/5">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="label-mono">{t('common.back')}</span>
                    </div>
                </button>
            </div>

            <div className="w-full max-w-2xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="baustein-panel shadow-[0_40px_100px_rgba(0,0,0,0.3)] flex flex-col h-auto max-h-[95vh] md:max-h-[min(700px,85vh)] overflow-hidden"
                >
                    {/* Security Terminal Section */}
                    <div className="flex flex-col flex-1 bg-[var(--surface-warm)] min-h-0">
                        <PanelHeader id={mode === 'LOGIN' ? 'IDENT_REQ' : 'REG_AUTH'} />
                        
                        <div className="flex-1 p-4 md:p-10 pb-4 md:pb-6 flex flex-col overflow-y-auto custom-scrollbar">


                            {/* Restore original style but split into two menus */}
                            <div className="grid grid-cols-2 gap-6 md:gap-10 mb-6">
                                <div className={`hardware-well p-1.5 rounded-xl border-2 border-[var(--groove-dark)] bg-[#CFCBBA] transition-all ${mode === 'LOGIN' ? 'shadow-inner' : 'opacity-60'}`}>
                                    <button 
                                        onClick={() => { setMode('LOGIN'); setError(''); setSuccessMsg('') }}
                                        className={`w-full py-4 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${
                                            mode === 'LOGIN' ? 'bg-white shadow-md text-black' : 'text-black/30 hover:text-black/50'
                                        }`}
                                    >
                                        Log In
                                    </button>
                                </div>
                                <div className={`hardware-well p-1.5 rounded-xl border-2 border-[var(--groove-dark)] bg-[#CFCBBA] transition-all ${mode === 'REGISTER' ? 'shadow-inner' : 'opacity-60'}`}>
                                    <button 
                                        onClick={() => { setMode('REGISTER'); setError(''); setSuccessMsg('') }}
                                        className={`w-full py-4 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${
                                            mode === 'REGISTER' ? 'bg-white shadow-md text-black' : 'text-black/30 hover:text-black/50'
                                        }`}
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-0 flex flex-col">
                                <AnimatePresence mode="wait">
                                    {successMsg ? (
                                        <motion.div 
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-6"
                                        >
                                            <div className="w-16 h-16 hardware-well rounded-2xl flex items-center justify-center mx-auto mb-6 border-4 border-[#C8C4B0]">
                                                <CheckCircle2 className="w-8 h-8 text-[var(--accent-moss)]" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase mb-2">Authorized</h3>
                                            <p className="label-mono opacity-60 text-center mb-10 leading-relaxed">{successMsg}</p>
                                            <button 
                                                onClick={() => setMode('LOGIN')} 
                                                className="hardware-btn w-full"
                                            >
                                                <div className="hardware-cap bg-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-black/5">
                                                    Continue to Login
                                                </div>
                                            </button>
                                        </motion.div>
                                    ) : mode === 'REGISTER' && settings?.disableVisitorRegistration ? (
                                        <motion.div 
                                            key="disabled"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-10"
                                        >
                                            <div className="w-16 h-16 hardware-well rounded-2xl flex items-center justify-center mx-auto mb-6 border-4 border-[#C8C4B0]">
                                                <Lock className="w-8 h-8 opacity-40" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase mb-2">Restricted</h3>
                                            <p className="label-mono opacity-50 uppercase mb-10 tracking-widest">Registry node offline</p>
                                            <button 
                                                onClick={() => setMode('LOGIN')} 
                                                className="hardware-btn w-full"
                                            >
                                                <div className="hardware-cap bg-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-black/5">
                                                    Back to Login
                                                </div>
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.form 
                                            key={mode}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            onSubmit={handleAuth} 
                                            className="flex flex-col gap-4 h-auto overflow-visible"
                                        >
                                            <div className="space-y-4">
                                                {mode === 'LOGIN' ? (
                                                    <div className="hardware-well rounded-xl p-0.5 bg-[#C8C4B0]">
                                                        <div className="relative group">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                                            <input 
                                                                type="text" 
                                                                required
                                                                value={identifier}
                                                                onChange={e => setIdentifier(e.target.value)}
                                                                placeholder="Email or Phone" 
                                                                className="w-full pl-12 pr-6 py-3.5 bg-white/90 rounded-lg outline-none font-bold text-sm tracking-tight shadow-inner"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="hardware-well rounded-xl p-0.5 bg-[#C8C4B0]">
                                                            <input 
                                                                type="text" 
                                                                required
                                                                value={name}
                                                                onChange={e => setName(e.target.value)}
                                                                placeholder="Full Name" 
                                                                className="w-full px-6 py-3.5 bg-white/90 rounded-lg outline-none font-bold text-sm tracking-tight shadow-inner"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                             <div className="hardware-well rounded-xl p-0.5 bg-[#C8C4B0]">
                                                                <input type="tel" value={phone} required={!email} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full px-4 py-3.5 bg-white/90 rounded-lg outline-none font-bold text-sm shadow-inner" />
                                                            </div>
                                                            <div className="hardware-well rounded-xl p-0.5 bg-[#C8C4B0]">
                                                                <input type="email" value={email} required={!phone} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3.5 bg-white/90 rounded-lg outline-none font-bold text-sm shadow-inner" />
                                                            </div>
                                                        </div>
                                                        <div className="hardware-well rounded-xl p-0.5 bg-[#B88000]/20">
                                                            <div className="relative group">
                                                                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--warm-amber)] opacity-40" />
                                                                 <input 
                                                                    type="text" 
                                                                    required
                                                                    value={invitationCode}
                                                                    onChange={e => setInvitationCode(e.target.value)}
                                                                    placeholder="Invitation PIN" 
                                                                    className="w-full pl-12 pr-6 py-3.5 bg-white/95 rounded-lg border-2 border-transparent focus:border-[var(--warm-amber)] transition-colors outline-none font-black text-sm tracking-[0.2em] text-[var(--warm-amber)] shadow-inner"
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="hardware-well rounded-xl p-0.5 bg-[#C8C4B0]">
                                                    <div className="relative group">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                                        <input 
                                                            type="password" 
                                                            required
                                                            value={password}
                                                            onChange={e => setPassword(e.target.value)}
                                                            placeholder="Access Password" 
                                                            className="w-full pl-12 pr-6 py-3.5 bg-white/90 rounded-lg outline-none font-bold text-sm tracking-tight shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="p-3 bg-rose-50 border-l-2 border-rose-500 flex items-center gap-3">
                                                    <Terminal className="w-3.5 h-3.5 text-rose-500" />
                                                    <span className="label-mono text-rose-600 text-[8px]">{error}</span>
                                                </div>
                                            )}

                                            <button 
                                                type="submit"
                                                disabled={loading}
                                                className="hardware-btn w-full mt-4"
                                            >
                                                <div className="hardware-cap bg-white py-5 rounded-2xl flex items-center justify-center gap-4 group border-2 border-[var(--groove-dark)]">
                                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                        <>
                                                            <span className="text-base font-black uppercase tracking-widest group-hover:text-[var(--accent-blue)] transition-colors">{mode === 'LOGIN' ? 'Authorize' : 'Registry'}</span>
                                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t-2 border-[var(--groove-dark)] bg-[var(--well-bg)] flex justify-between items-center text-[8px] shrink-0">
                            <div className="flex items-center gap-4">
                                <Activity className="w-3 h-3 text-[var(--accent-blue)]" />
                                <span className="label-mono">Terminal Protocol: GUEST-ACCESS</span>
                            </div>
                            <span className="label-mono tracking-[0.4em] opacity-30">SECURE SHELL</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    )
}
