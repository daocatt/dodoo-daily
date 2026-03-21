'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, Phone, Mail, Ticket, Loader2, ArrowRight, ShieldCheck, Clock, Lock, Terminal, Activity, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react'

interface GuestData {
    id: string
    name: string
    currency: number
    status?: string
    phone?: string
    email?: string
    address?: string
}

interface GuestAuthProps {
    onSuccess: (guestData: GuestData) => void
    disableRegistration?: boolean
    /**
     * Optional: If true, renders the container as a modal-ready baustein panel.
     * Defaults to true as the primary use case is the "Visitor Auth Popup".
     */
    asTerminal?: boolean
}

export default function GuestAuth({ onSuccess, disableRegistration, asTerminal = true }: GuestAuthProps) {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN')
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [invitationCode, setInvitationCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [pendingApproval, setPendingApproval] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const endpoint = mode === 'LOGIN' ? '/api/guest/login' : '/api/guest/register'
            const payload = mode === 'LOGIN' 
                ? { identifier, password }
                : { name, email, phone, password, invitationCode }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok) {
                if (data.status === 'PENDING') {
                    setPendingApproval(true)
                } else {
                    onSuccess(data)
                }
            } else {
                setError(data.error || 'Authentication denied')
            }
        } catch (_err) {
            setError('Access signal interrupted')
        } finally {
            setLoading(false)
        }
    }

    // Use a memoized rendering to prevent component re-definition bugs
    const renderContent = () => {
        return (
            <div className="flex flex-col flex-1 bg-[#E2DFD2]">
                {/* Header Section */}
                <div className="flex items-center justify-between px-8 py-5 border-b-2 border-black/5 bg-[#F4F2E8] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)] animate-pulse" />
                        <span className="font-black text-xs tracking-[0.25em] uppercase text-slate-600">Visitor Terminal</span>
                    </div>
                    <div className="px-3 py-1 bg-black/5 rounded shadow-inner text-[9px] font-black uppercase tracking-widest text-slate-400">
                        AUTH_NODE: {mode}
                    </div>
                </div>

                <div className="flex flex-col flex-1 p-10 pt-8 min-h-[460px]">
                    {/* Mode Switcher - Mechanical Buttons */}
                    <div className="grid grid-cols-2 gap-6 mb-10 shrink-0">
                        <button 
                            type="button"
                            onClick={() => { setMode('LOGIN'); setError('') }}
                            className={`hardware-btn transition-all ${mode === 'LOGIN' ? 'scale-[1.02]' : 'opacity-40 scale-95 grayscale'}`}
                        >
                            <div className={`hardware-cap py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${
                                mode === 'LOGIN' ? 'bg-white border-black/10 text-black shadow-lg' : 'bg-transparent border-black/5 text-slate-500'
                            }`}>
                                Identify
                            </div>
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setMode('REGISTER'); setError('') }}
                            disabled={disableRegistration}
                            className={`hardware-btn transition-all ${mode === 'REGISTER' ? 'scale-[1.02]' : 'opacity-40 scale-95 grayscale'} ${disableRegistration ? 'cursor-not-allowed' : ''}`}
                        >
                            <div className={`hardware-cap py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${
                                mode === 'REGISTER' ? 'bg-white border-black/10 text-black shadow-lg' : 'bg-transparent border-black/5 text-slate-500'
                            }`}>
                                Registry
                            </div>
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {pendingApproval ? (
                            <motion.div 
                                key="pending"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/5 rounded-[2rem] border-2 border-dashed border-black/10"
                            >
                                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6 shadow-well">
                                    <ShieldCheck className="w-10 h-10 text-amber-600 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Request Transmitted</h3>
                                <p className="label-mono opacity-50 text-[10px] leading-relaxed max-w-[200px] mb-8">Node awaiting administrative validation. Termination of terminal session recommended.</p>
                                <button 
                                    onClick={() => setPendingApproval(false)}
                                    className="hardware-btn group w-full"
                                >
                                    <div className="hardware-cap bg-white py-4 rounded-xl border-2 border-black/10 flex items-center justify-center gap-3">
                                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Login</span>
                                    </div>
                                </button>
                            </motion.div>
                        ) : (disableRegistration && mode === 'REGISTER') ? (
                            <motion.div 
                                key="disabled"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center text-center p-8"
                            >
                                <div className="w-16 h-16 hardware-well rounded-2xl flex items-center justify-center mx-auto mb-6 border-4 border-[#C8C4B0] bg-[#F4F4F2]">
                                    <Lock className="w-8 h-8 opacity-40 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-black uppercase mb-2">Restricted</h3>
                                <p className="label-mono opacity-50 uppercase mb-12 tracking-widest text-[10px]">Registry node offline</p>
                                <button 
                                    onClick={() => setMode('LOGIN')} 
                                    className="hardware-btn group w-full"
                                >
                                    <div className="hardware-cap bg-white py-4 rounded-xl border-2 border-black/10 flex items-center justify-center gap-3">
                                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Login</span>
                                    </div>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form 
                                key={mode}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onSubmit={handleSubmit} 
                                className="flex flex-col flex-1 pb-4"
                            >
                                <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                                    {mode === 'LOGIN' ? (
                                        <div className="relative group hardware-well rounded-2xl bg-[#D1CDBC] p-1 shadow-inner">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 z-10" />
                                            <input 
                                                required
                                                type="text" 
                                                value={identifier}
                                                onChange={e => setIdentifier(e.target.value)}
                                                className="w-full pl-14 pr-6 py-5 bg-white rounded-xl outline-none font-bold text-sm tracking-tight shadow-md border-2 border-transparent focus:border-indigo-500/20 transition-all"
                                                placeholder="Identifier (Email / Phone)"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative group hardware-well rounded-2xl bg-[#D1CDBC] p-1 shadow-inner">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 z-10" />
                                                <input 
                                                    required
                                                    type="text" 
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full pl-14 pr-6 py-5 bg-white rounded-xl outline-none font-bold text-sm tracking-tight shadow-md border-2 border-transparent focus:border-indigo-500/20 transition-all"
                                                    placeholder="Display Name"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative group hardware-well rounded-2xl bg-[#D1CDBC] p-1 shadow-inner">
                                                    <input 
                                                        required={!phone}
                                                        type="email" 
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold text-xs tracking-tight shadow-md border-2 border-transparent focus:border-indigo-500/20 transition-all"
                                                        placeholder="Email"
                                                    />
                                                </div>
                                                <div className="relative group hardware-well rounded-2xl bg-[#D1CDBC] p-1 shadow-inner">
                                                    <input 
                                                        required={!email}
                                                        type="tel" 
                                                        value={phone}
                                                        onChange={e => setPhone(e.target.value)}
                                                        className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold text-xs tracking-tight shadow-md border-2 border-transparent focus:border-indigo-500/20 transition-all"
                                                        placeholder="Phone"
                                                    />
                                                </div>
                                            </div>

                                            <div className="relative group hardware-well rounded-2xl bg-[#B88000]/10 p-1 shadow-inner">
                                                <Ticket className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--warm-amber)] opacity-40 z-10" />
                                                <input 
                                                    required
                                                    type="text" 
                                                    value={invitationCode}
                                                    onChange={e => setInvitationCode(e.target.value)}
                                                    className="w-full pl-14 pr-6 py-5 bg-white rounded-xl outline-none font-black text-sm tracking-[0.2em] text-[var(--warm-amber)] shadow-md border-2 border-transparent focus:border-[var(--warm-amber)]/30 transition-all"
                                                    placeholder="INVITATION CODE"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="relative group hardware-well rounded-2xl bg-[#D1CDBC] p-1 shadow-inner">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 z-10" />
                                        <input 
                                            required
                                            type="password" 
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full pl-14 pr-24 py-5 bg-white rounded-xl outline-none font-bold text-sm tracking-tight shadow-md border-2 border-transparent focus:border-indigo-500/20 transition-all"
                                            placeholder="密码"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400 opacity-40 tracking-widest pointer-events-none">密码 / PW</span>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="my-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 rounded-lg"
                                    >
                                        <Terminal className="w-4 h-4 text-red-500" />
                                        <span className="label-mono text-red-600 text-[10px] font-black uppercase tracking-tighter leading-none">{error}</span>
                                    </motion.div>
                                )}

                                {/* Standardized Hardware Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="hardware-btn w-full mt-10 shrink-0"
                                >
                                    <div className="hardware-cap bg-white py-6 rounded-2xl border-2 border-black/10 flex items-center justify-center gap-4 group transition-all shadow-xl group-hover:bg-slate-50">
                                        {loading ? <Loader2 className="w-8 h-8 animate-spin text-amber-500" /> : (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-black/5 shrink-0 shadow-inner group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                                                    <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                                                </div>
                                                <span className="text-lg font-black uppercase tracking-[0.2em] text-slate-700 group-hover:text-black transition-colors">{mode === 'LOGIN' ? 'Authorize' : 'Join Node'}</span>
                                                <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        )
    }

    if (!asTerminal) return renderContent()

    // Complete self-contained Baustein Panel Shell
    return (
        <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[3rem] shadow-[0_60px_150px_rgba(0,0,0,0.5)] relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
            {renderContent()}
        </div>
    )
}
