'use client'

import React, { useState } from 'react'
import { Lock, Save, Camera, Check, X } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

export default function SettingsManagement({ user }: { user: any }) {
    const { t } = useI18n()
    const [pin, setPin] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleUpdatePin = async () => {
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits')
            return
        }
        try {
            const res = await fetch('/api/user/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            })
            if (res.ok) {
                setMessage('PIN updated successfully')
                setPin('')
            } else {
                setError('Failed to update PIN')
            }
        } catch (e) { setError('Failed to update PIN') }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Security Settings
            </h2>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-4 max-w-md">
                    <h3 className="font-bold">Change PIN</h3>
                    <p className="text-sm text-slate-500">Update your access PIN for this role. Minimum 4 digits/characters.</p>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">New PIN Code</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-xl tracking-widest font-bold"
                            placeholder="••••"
                            value={pin}
                            onChange={e => { setPin(e.target.value); setError(''); setMessage(''); }}
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 flex items-center gap-1"><X className="w-4 h-4" /> {error}</p>}
                    {message && <p className="text-sm text-green-500 flex items-center gap-1"><Check className="w-4 h-4" /> {message}</p>}

                    <button
                        onClick={handleUpdatePin}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Update PIN
                    </button>
                </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-3xl border border-dashed border-gray-300">
                <h3 className="text-gray-500 font-semibold italic text-sm">Note: If you are a child, this PIN is for your privacy among siblings.</h3>
            </div>
        </div>
    )
}
