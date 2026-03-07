'use client'

import React, { useState } from 'react'
import { User, Camera, Check, X, Loader2, Save, Lock, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { motion } from 'framer-motion'

export default function ProfileManagement({ user }: { user: any }) {
    const { t } = useI18n()
    const [name, setName] = useState(user?.name || '')
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // PIN state
    const [pin, setPin] = useState('')
    const [pinMessage, setPinMessage] = useState('')
    const [pinError, setPinError] = useState('')

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
                setAvatarUrl(data.avatarUrl)
                setMessage('Avatar updated locally. Click save to permanent update name.')
                // Also update the parent profile in DB
                await fetch('/api/parent/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatarUrl: data.avatarUrl })
                })
            }
        } catch (e) { setError('Failed to upload avatar') }
        finally { setUploading(false) }
    }

    const handleSave = async () => {
        try {
            const res = await fetch('/api/parent/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatarUrl })
            })
            if (res.ok) {
                setMessage(t('parent.profileUpdateSuccess') || 'Profile updated successfully!')
            } else {
                setError('Failed to update profile')
            }
        } catch (e) { setError('Error saving profile') }
    }

    const handlePinUpdate = async () => {
        if (pin.length < 4) {
            setPinError('PIN must be 4 digits')
            return
        }
        try {
            const res = await fetch('/api/user/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            })
            if (res.ok) {
                setPinMessage('Access PIN updated successfully!')
                setPin('')
                setPinError('')
            } else {
                setPinError('Failed to update PIN')
            }
        } catch (e) { setPinError('Error updating PIN') }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[60vh] py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl space-y-12"
            >
                {/* Profile Section */}
                <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-48 h-48 rounded-[3rem] bg-slate-50 border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center">
                                {uploading ? (
                                    <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                                ) : (
                                    <img
                                        src={`${avatarUrl || "/dog.svg"}?v=4`}
                                        alt="Profile"
                                        className={`w-full h-full object-cover ${!avatarUrl ? 'p-10' : ''}`}
                                    />
                                )}
                            </div>
                            <label className="absolute -bottom-4 -right-4 p-5 bg-purple-600 text-white rounded-[1.5rem] shadow-xl cursor-pointer hover:bg-purple-700 transition-all hover:scale-110 active:scale-95 border-4 border-white">
                                <Camera className="w-7 h-7" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('parent.profile')}</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{t('parent.profileDesc')}</p>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('gallery.form.titleLabel')}</label>
                            <input
                                type="text"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-purple-100 transition-all outline-none text-xl font-bold text-slate-700"
                                placeholder="Your Display Name"
                                value={name}
                                onChange={e => { setName(e.target.value); setError(''); setMessage(''); }}
                            />
                        </div>

                        {error && <p className="text-sm text-rose-500 font-bold flex items-center justify-center gap-1"><X className="w-4 h-4" /> {error}</p>}
                        {message && <p className="text-sm text-green-500 font-bold flex items-center justify-center gap-1"><Check className="w-4 h-4" /> {message}</p>}

                        <button
                            onClick={handleSave}
                            className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[2rem] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] text-lg"
                        >
                            <Save className="w-6 h-6" />
                            {t('button.save')} Account Changes
                        </button>
                    </div>
                </div>

                {/* PIN Section */}
                <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <Lock className="w-7 h-7 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">{t('parent.settings')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Update Access Code</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New 4-Digit PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-4xl font-black tracking-[1em] text-center"
                                placeholder="••••"
                                value={pin}
                                onChange={e => { setPin(e.target.value); setPinError(''); setPinMessage(''); }}
                            />
                        </div>

                        {pinError && <p className="text-sm text-rose-500 font-bold flex items-center justify-center gap-1"><X className="w-4 h-4" /> {pinError}</p>}
                        {pinMessage && <p className="text-sm text-green-500 font-bold flex items-center justify-center gap-1"><Check className="w-4 h-4" /> {pinMessage}</p>}

                        <button
                            onClick={handlePinUpdate}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl active:scale-[0.98] text-lg"
                        >
                            Update Security PIN
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
