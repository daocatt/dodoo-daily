'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'

export default function SetPinPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { t } = useI18n()
    const userId = searchParams.get('userId')
    
    const [pin, setPin] = useState('')
    const [confirmPin, setConfirmPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!userId) {
            router.push('/admin/login')
        }
    }, [userId, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits.')
            return
        }
        if (pin !== confirmPin) {
            setError('PINs do not match.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/set-initial-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, pin })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                // Success! Now they can login.
                router.push('/admin/login?message=PIN set successfully. Please login.')
            } else {
                setError(data.error || 'Failed to set PIN.')
                setLoading(false)
            }
        } catch (err) {
            setError('Network error. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="h-dvh flex items-center justify-center relative overflow-hidden bg-slate-900">
            <NatureBackground />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md p-8 md:p-12 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 shadow-deep">
                        <ShieldCheck className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Security Required</h1>
                    <p className="text-slate-500 font-bold leading-relaxed">
                        To keep your account safe, please set a security PIN before proceeding.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">New Security PIN</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input 
                                type="password"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="Enter 4-6 digits"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none transition-all font-black text-xl tracking-[0.5em]"
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Confirm PIN</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input 
                                type="password"
                                value={confirmPin}
                                onChange={e => setConfirmPin(e.target.value)}
                                placeholder="Repeat PIN"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none transition-all font-black text-xl tracking-[0.5em]"
                                maxLength={6}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-rose-50 text-rose-500 p-4 rounded-xl flex items-center gap-3 border border-rose-100"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="font-bold text-sm tracking-tight">{error}</p>
                        </motion.div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading || pin.length < 4}
                        className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <span>Save & Continue</span>
                                <ArrowRight className="w-6 h-6" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Secure Account Setup
                </p>
            </motion.div>

            <style jsx global>{`
                .shadow-deep {
                    box-shadow: 0 10px 40px -10px rgba(79, 70, 229, 0.2);
                }
            `}</style>
        </div>
    )
}
