'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, Ticket, Loader2, ArrowRight, ShieldCheck, Clock, Lock, Terminal, Activity, CheckCircle2 } from 'lucide-react'

interface GuestData {
    id: string
    name: string
    currency: number
    status?: string
}

interface GuestAuthProps {
    onSuccess: (guestData: GuestData) => void
    requireInvitationCode?: boolean
    disableRegistration?: boolean
}

// Reusable Industrial Header for the Modal
const ModalHeader = ({ title, id }: { title: string, id: string }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#CFCBBA] bg-[#E2DFD2] -mx-10 -mt-10 mb-8 rounded-t-[48px]">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
            <span className="font-black text-[10px] tracking-tight uppercase text-slate-700">{title}</span>
        </div>
        <div className="px-3 py-1 bg-black/5 rounded shadow-inner text-[8px] font-black uppercase tracking-widest text-slate-400">
            {id}
        </div>
    </div>
)

export default function GuestAuth({ onSuccess, disableRegistration }: GuestAuthProps) {
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

    if (pendingApproval) {
        return (
            <div className="flex flex-col h-full">
                <ModalHeader title="REGISTRY STATUS" id="PENDING_AUTH" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                >
                    <div className="w-20 h-20 hardware-well rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-4 border-[#C8C4B0] bg-[#F4F4F2]">
                        <Clock className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-4">Awaiting Approval</h3>
                    <p className="label-mono text-xs opacity-60 leading-relaxed px-4 mb-10">
                        Your identification packet has been received. Please wait for the administrator to authorize your access.
                    </p>
                    <button 
                        onClick={() => setPendingApproval(false)}
                        className="hardware-btn w-full"
                    >
                        <div className="hardware-cap bg-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-black/5">
                            Return to Entry
                        </div>
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <ModalHeader title={mode === 'LOGIN' ? 'IDENT_REQ' : 'REG_AUTH'} id={mode} />

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`hardware-well p-1 rounded-xl bg-[#CFCBBA] transition-all shadow-well ${mode === 'LOGIN' ? 'opacity-100' : 'opacity-40'}`}>
                    <button 
                        onClick={() => { setMode('LOGIN'); setError('') }}
                        className={`w-full py-3 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all ${
                            mode === 'LOGIN' ? 'bg-white shadow-sm text-black' : 'text-black/30 hover:text-black/50'
                        }`}
                    >
                        Log In
                    </button>
                </div>
                <div className={`hardware-well p-1 rounded-xl bg-[#CFCBBA] transition-all shadow-well ${mode === 'REGISTER' ? 'opacity-100' : 'opacity-40'}`}>
                    <button 
                        onClick={() => { setMode('REGISTER'); setError('') }}
                        disabled={disableRegistration}
                        className={`w-full py-3 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all ${
                            mode === 'REGISTER' ? 'bg-white shadow-sm text-black' : 'text-black/30 hover:text-black/50'
                        } disabled:cursor-not-allowed`}
                    >
                        {disableRegistration ? 'Locked' : 'Join'}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.form 
                    key={mode}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit} 
                    className="flex flex-col gap-5"
                >
                    <div className="space-y-4">
                        {mode === 'LOGIN' ? (
                            <div className="hardware-well rounded-[1.5rem] p-0.5 bg-[#C8C4B0] shadow-well">
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                    <input 
                                        required
                                        type="text" 
                                        value={identifier}
                                        onChange={e => setIdentifier(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-[#F4F4F2] rounded-[1.25rem] outline-none font-bold text-sm tracking-tight border-2 border-transparent focus:border-indigo-500/30 transition-all"
                                        placeholder="Email or Phone Identifier"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="hardware-well rounded-[1.5rem] p-0.5 bg-[#C8C4B0] shadow-well">
                                    <div className="relative">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                        <input 
                                            required
                                            type="text" 
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 bg-[#F4F4F2] rounded-[1.25rem] outline-none font-bold text-sm tracking-tight border-2 border-transparent focus:border-indigo-500/30 transition-all"
                                            placeholder="Display Name"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="hardware-well rounded-[1.5rem] p-0.5 bg-[#C8C4B0] shadow-well">
                                        <input 
                                            required={!email}
                                            type="email" 
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full px-6 py-4 bg-[#F4F4F2] rounded-[1.25rem] outline-none font-bold text-xs tracking-tight border-2 border-transparent focus:border-indigo-500/30 transition-all"
                                            placeholder="Email Addr"
                                        />
                                    </div>
                                    <div className="hardware-well rounded-[1.5rem] p-0.5 bg-[#C8C4B0] shadow-well">
                                        <input 
                                            required={!email}
                                            type="tel" 
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full px-6 py-4 bg-[#F4F4F2] rounded-[1.25rem] outline-none font-bold text-xs tracking-tight border-2 border-transparent focus:border-indigo-500/30 transition-all"
                                            placeholder="Phone Num"
                                        />
                                    </div>
                                </div>

                                <div className="hardware-well rounded-[1.5rem] p-0.5 bg-[#B88000]/20 shadow-well">
                                    <div className="relative">
                                        <Ticket className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--warm-amber)] opacity-40" />
                                        <input 
                                            required
                                            type="text" 
                                            value={invitationCode}
                                            onChange={e => setInvitationCode(e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 bg-[#F4F4F2] rounded-[1.25rem] outline-none font-black text-sm tracking-[0.2em] text-[var(--warm-amber)] border-2 border-transparent focus:border-[var(--warm-amber)]/40 transition-all"
                                            placeholder="INVITATION PIN"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="hardware-well rounded-[1.5rem] p-0.5 bg-[#C8C4B0] shadow-well">
                            <div className="relative">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input 
                                    required
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-[#F4F4F2] rounded-[1.25rem] outline-none font-bold text-sm tracking-tight border-2 border-transparent focus:border-indigo-500/30 transition-all"
                                    placeholder="Security Key"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border-l-4 border-rose-500 flex items-center gap-3 hardware-well rounded-lg">
                            <Terminal className="w-3.5 h-3.5 text-rose-500" />
                            <span className="label-mono text-rose-600 text-[9px] font-black uppercase tracking-tight">{error}</span>
                        </div>
                    )}

                    <button 
                        disabled={loading}
                        className="hardware-btn w-full mt-2"
                    >
                        <div className="hardware-cap bg-white py-5 rounded-[2rem] flex items-center justify-center gap-4 group border-2 border-[#CFCBBA] shadow-sm hover:bg-[#F4F4F2] transition-all">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : (
                                <>
                                    <span className="text-sm font-black uppercase tracking-widest text-[#2C2A20]">
                                        {mode === 'LOGIN' ? 'Authorize Access' : 'Secure Registry'}
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                    </button>
                </motion.form>
            </AnimatePresence>

            <div className="px-1 py-4 flex justify-between items-center text-[7px] shrink-0 opacity-40 mt-4 border-t border-[#CFCBBA]/30">
                <div className="flex items-center gap-2">
                    <Activity className="w-2.5 h-2.5" />
                    <span className="label-mono uppercase tracking-[0.2em]">S-Link: SECURE_PASS</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span className="label-mono uppercase tracking-[0.2em]">Prot-V2</span>
                </div>
            </div>
            
            <style jsx global>{`
                .shadow-well {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.5);
                }
            `}</style>
        </div>
    )
}
