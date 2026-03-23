'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Store, Save, ExternalLink, MessageSquare, Eye, EyeOff, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'

export default function ExhibitionSettingsPage() {
    const { t } = useI18n()
    const router = useRouter()
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [slug, setSlug] = useState('')
    
    const [settings, setSettings] = useState({
        exhibitionTitle: '',
        exhibitionSubtitle: '',
        exhibitionDescription: '',
        exhibitionEnabled: true
    })
    
    // Message management state
    const [messages, setMessages] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loadingMessages, setLoadingMessages] = useState(true)

    useEffect(() => {
        fetch('/api/auth/profile/exhibition')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setSettings({
                        exhibitionTitle: data.exhibitionTitle || '',
                        exhibitionSubtitle: data.exhibitionSubtitle || '',
                        exhibitionDescription: data.exhibitionDescription || '',
                        exhibitionEnabled: data.exhibitionEnabled !== false
                    })
                    setSlug(data.slug || '')
                }
            })
            .finally(() => setLoading(false))

        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/auth/profile/messages')
            const data = await res.json()
            if (!data.error) setMessages(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingMessages(false)
        }
    }

    const toggleMessageVisibility = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/auth/profile/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isPublic: !currentStatus }),
            })
            if (res.ok) fetchMessages()
        } catch (err) {
            console.error(err)
        }
    }

    const deleteMessage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return
        try {
            const res = await fetch(`/api/auth/profile/messages?id=${id}`, {
                method: 'DELETE',
            })
            if (res.ok) fetchMessages()
        } catch (err) {
            console.error(err)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        
        try {
            const res = await fetch('/api/auth/profile/exhibition', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            
            if (res.ok) {
                // simple success feedback
                alert('Saved successfully!')
            }
        } catch (err) {
            console.error(err)
            alert('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-10 md:py-6 backdrop-blur-sm bg-white/40 border-b border-white/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-slate-800 border border-slate-200">
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-800 flex items-center gap-2">
                        <Store className="w-6 h-6 text-amber-500" />
                        Exhibition Settings
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {slug && (
                        <Link
                            href={`/u/${slug}/exhibition`}
                            target="_blank"
                            className="flex items-center justify-center p-2 rounded-2xl bg-indigo-500/80 hover:bg-indigo-500 backdrop-blur-md transition-colors text-white shadow-sm border border-indigo-400 aspect-square"
                            title="Preview Exhibition"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 hide-scrollbar flex justify-center">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50">
                        <form onSubmit={handleSave} className="flex flex-col gap-6">
                            
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={settings.exhibitionEnabled}
                                            onChange={(e) => setSettings({ ...settings, exhibitionEnabled: e.target.checked })}
                                        />
                                        <div className={`block w-14 h-8 rounded-full ${settings.exhibitionEnabled ? 'bg-indigo-500' : 'bg-slate-300'} transition-colors`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.exhibitionEnabled ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                    <span className="font-bold text-lg text-slate-700">Enable Exhibition</span>
                                </label>
                                <p className="text-sm text-slate-500 mt-1 ml-17">If disabled, the public link will be inaccessible.</p>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Exhibition Title</label>
                                <input
                                    type="text"
                                    value={settings.exhibitionTitle}
                                    onChange={e => setSettings({ ...settings, exhibitionTitle: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-amber-400 outline-none text-slate-800"
                                    placeholder="My Awesome Art Exhibition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Exhibition Subtitle</label>
                                <input
                                    type="text"
                                    value={settings.exhibitionSubtitle}
                                    onChange={e => setSettings({ ...settings, exhibitionSubtitle: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-amber-400 outline-none text-slate-800"
                                    placeholder="A journey through colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Sales & Help Description</label>
                                <p className="text-xs text-slate-500 mb-2">This is the description shown on the exhibition help page. Use it to explain your sales process (e.g. &quot;Physical copies will be shipped with a frame&quot;, &quot;Only digital files will be provided&quot;).</p>
                                <textarea
                                    value={settings.exhibitionDescription}
                                    onChange={e => setSettings({ ...settings, exhibitionDescription: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-amber-400 outline-none text-slate-800 min-h-[150px] resize-y"
                                    placeholder="All physical paintings will be framed and safely packaged..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-amber-500 text-white font-bold tracking-wide shadow-md hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>

                        {/* Signal Board Management */}
                        <div className="mt-12 pt-8 border-t border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="w-6 h-6 text-indigo-500" />
                                <h3 className="text-xl font-bold text-slate-800">Signal Board Management</h3>
                            </div>
                            
                            {loadingMessages ? (
                                <div className="py-10 text-center opacity-40">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                                    No messages received yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((m) => (
                                        <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {m.memberId ? (m.memberNickname || m.memberName) : m.visitorName || 'Visitor'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(m.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed">{m.text}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => toggleMessageVisibility(m.id, m.isPublic)}
                                                    className={`p-2 rounded-xl border transition-all ${
                                                        m.isPublic 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                                            : 'bg-slate-50 text-slate-400 border-slate-200'
                                                    }`}
                                                    title={m.isPublic ? 'Click to Hide' : 'Click to Show'}
                                                >
                                                    {m.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteMessage(m.id)}
                                                    className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-slate-400 italic text-center pt-2">
                                        * Default state for new messages: Hidden.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
