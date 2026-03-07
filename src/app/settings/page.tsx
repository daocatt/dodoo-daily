'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft, Camera, Lock, ShieldCheck, LogOut, ChevronRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'
import NatureBackground from '@/components/NatureBackground'

export default function SettingsPage() {
    const { t } = useI18n()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [pin, setPin] = useState('')
    const [pinMessage, setPinMessage] = useState('')
    const [pinError, setPinError] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.isParent) {
                    router.push('/parent')
                    return
                }
                setUser(data)
                setLoading(false)
            })
            .catch(() => router.push('/login'))
    }, [router])

    const handlePinUpdate = async () => {
        if (pin.length < 4) {
            setPinError('PIN must be at least 4 chars')
            return
        }
        try {
            const res = await fetch('/api/user/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            })
            if (res.ok) {
                setPinMessage('PIN updated')
                setPin('')
                setPinError('')
            } else {
                setPinError('Failed to update')
            }
        } catch (e) { setPinError('Error updating') }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                setUser({ ...user, avatarUrl: data.avatarUrl })
            }
        } catch (e) { console.error(e) }
        finally { setUploading(false) }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    if (loading) return (
        <div className="h-dvh flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    )

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden text-[#4a3728]">
            <NatureBackground />

            <header className="relative z-10 p-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-3 bg-white/40 backdrop-blur-md rounded-full shadow-sm hover:bg-white/60 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold font-display tracking-tight text-[#2c2416] drop-shadow-sm">Settings & Profile</h1>
            </header>

            <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-32">

                {/* Profile Section */}
                <section className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-xl p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2rem] bg-white shadow-inner overflow-hidden border-4 border-white/50 flex items-center justify-center">
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                ) : (
                                    <img
                                        src={`${user?.avatarUrl || "/dog.svg"}?v=4`}
                                        alt="Avatar"
                                        className={`w-full h-full object-cover ${!user?.avatarUrl ? 'p-6' : ''}`}
                                        onError={(e) => { e.currentTarget.src = "/dog.svg"; e.currentTarget.className = "w-full h-full object-contain p-6"; }}
                                    />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-3 bg-purple-500 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-purple-600 transition-colors">
                                <Camera className="w-5 h-5" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-extrabold tracking-tight">{user?.name}</h2>
                            <span className="inline-block px-3 py-1 bg-slate-200/50 rounded-full text-xs font-bold uppercase tracking-widest mt-2">{user?.role}</span>
                        </div>
                    </div>

                    {user?.isParent && (
                        <Link href="/parent" className="flex items-center justify-between p-5 bg-purple-600/10 hover:bg-purple-600/20 rounded-[1.5rem] border border-purple-600/20 text-purple-700 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-200">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-extrabold text-lg">Parent Console</p>
                                    <p className="text-xs font-medium opacity-70">Manage family, rewards, and shop.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </section>

                {/* Password Section */}
                <section className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-xl p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500 rounded-xl text-white">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-[#2c2416]">Security PIN</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-500 px-1">Your personal PIN for role switching and privacy.</p>
                            <input
                                type="password"
                                placeholder="Enter new PIN"
                                className="w-full px-6 py-4 bg-white/50 border border-[#4a3728]/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-200 transition-all font-bold tracking-[0.5em] text-xl"
                                value={pin}
                                onChange={e => { setPin(e.target.value); setPinError(''); setPinMessage(''); }}
                            />
                        </div>

                        {pinError && <p className="text-sm text-red-500 px-1">⚠️ {pinError}</p>}
                        {pinMessage && <p className="text-sm text-green-600 px-1">✅ {pinMessage}</p>}

                        <button
                            onClick={handlePinUpdate}
                            className="w-full bg-[#2c2416] text-white font-extrabold py-4 rounded-2xl shadow-xl hover:bg-black transition-all"
                        >
                            Update PIN
                        </button>
                    </div>
                </section>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full p-6 bg-red-50 hover:bg-red-100/80 rounded-[2.5rem] border border-red-100 text-red-600 font-extrabold flex items-center justify-center gap-3 transition-colors shadow-sm"
                >
                    <LogOut className="w-6 h-6" />
                    Logout
                </button>

            </main>
        </div>
    )
}
