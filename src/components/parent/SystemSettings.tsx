'use client'

import React, { useState, useEffect } from 'react'
import { Power, ShieldAlert, Cpu, RotateCcw, AlertTriangle, Check, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'

export default function SystemSettings() {
    const { t } = useI18n()
    const router = useRouter()
    const [isClosed, setIsClosed] = useState(false)
    const [starsToCoinsRatio, setStarsToCoinsRatio] = useState(10)
    const [coinsToRmbRatio, setCoinsToRmbRatio] = useState(1.0)
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    useEffect(() => {
        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => {
                setIsClosed(data.isClosed)
                setStarsToCoinsRatio(data.starsToCoinsRatio || 10)
                setCoinsToRmbRatio(data.coinsToRmbRatio || 1.0)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleUpdateSettings = async (updates: any) => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/system/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (res.ok) {
                if (updates.isClosed !== undefined) setIsClosed(updates.isClosed)
                if (updates.starsToCoinsRatio !== undefined) setStarsToCoinsRatio(updates.starsToCoinsRatio)
                if (updates.coinsToRmbRatio !== undefined) setCoinsToRmbRatio(updates.coinsToRmbRatio)
                setShowConfirm(false)
            }
        } catch (e) {
            console.error('Failed to update settings', e)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-400">Loading system status...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-12">
            <div className="text-center space-y-4 mb-12">
                <div className="w-20 h-20 bg-rose-50 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                    <Cpu className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">System Control Center</h2>
                <p className="text-slate-500 font-medium">Manage server status and app-wide availability.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* System Availability */}
                <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-4 bg-amber-50 rounded-2xl">
                                <Power className={`w-8 h-8 ${isClosed ? 'text-rose-500' : 'text-emerald-500'}`} />
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isClosed ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {isClosed ? 'Closed / Offline' : 'Active / Online'}
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">Master Switch</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            {isClosed
                                ? "The system is currently restricted. Only parents can access management features."
                                : "The system is fully operational. All users can log in and interact with the app."}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowConfirm(true)}
                        className={`w-full py-5 rounded-xl font-black text-lg transition-all shadow-xl active:scale-[0.98] mt-8 ${isClosed
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                            : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
                            }`}
                    >
                        {isClosed ? 'Activate System' : 'Close System Now'}
                    </button>
                </div>

                {/* Reward System Settings */}
                <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800">Reward Economy</h3>
                        <p className="text-slate-500 text-sm font-medium">Define conversion ratios for stars and coins.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Stars to 1 Coin</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={starsToCoinsRatio}
                                    onChange={(e) => setStarsToCoinsRatio(parseInt(e.target.value))}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                                <button
                                    onClick={() => handleUpdateSettings({ starsToCoinsRatio })}
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 transition-all"
                                >
                                    Set
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">1 Coin to $ (RMB)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={coinsToRmbRatio}
                                    onChange={(e) => setCoinsToRmbRatio(parseFloat(e.target.value))}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                                <button
                                    onClick={() => handleUpdateSettings({ coinsToRmbRatio })}
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 transition-all"
                                >
                                    Set
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-xl shadow-2xl p-10 border border-slate-100"
                        >
                            <div className={`w-20 h-20 rounded-lg flex items-center justify-center mb-8 mx-auto ${isClosed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                <ShieldAlert className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-black text-center text-slate-800 mb-4 uppercase tracking-tight">
                                {isClosed ? 'Open System?' : 'Shutdown?'}
                            </h3>
                            <p className="text-center text-slate-500 font-medium mb-10 leading-relaxed">
                                {isClosed
                                    ? "Are you sure you want to bring the system back online? All feature blocks will be removed."
                                    : "This will disable all non-parent features. Children will not be able to log in until it is reactivated."}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleUpdateSettings({ isClosed: !isClosed })}
                                    className={`w-full py-5 text-white rounded-lg font-black text-lg transition-all shadow-xl active:scale-95 ${isClosed ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}
                                >
                                    Confirm Action
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="w-full py-5 bg-slate-50 text-slate-400 rounded-lg font-bold hover:bg-slate-100 transition-all"
                                >
                                    Nevermind
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
