'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, BookOpen, User, UserRound } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'

type JournalEntry = {
    id: string
    authorRole: 'CHILD' | 'PARENT'
    text: string | null
    imageUrl: string | null
    voiceUrl: string | null
    createdAt: string
}

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [loading, setLoading] = useState(true)

    // New Post State
    const [text, setText] = useState('')
    const [role, setRole] = useState<'CHILD' | 'PARENT'>('CHILD')
    const [posting, setPosting] = useState(false)

    useEffect(() => {
        fetchJournal()
    }, [])

    const fetchJournal = async () => {
        try {
            const res = await fetch('/api/journal')
            const data = await res.json()
            setEntries(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text) return
        setPosting(true)

        try {
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, authorRole: role })
            })
            if (res.ok) {
                setText('')
                fetchJournal()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setPosting(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-orange-50 text-[#2c2416]">
            {/* Different sky for Journal */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/50 via-orange-100/30 to-rose-50/10 pointer-events-none" />

            <header className="relative z-10 flex justify-between items-center p-6 backdrop-blur-sm bg-white/30 border-b border-orange-200">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-orange-600 border border-white/50">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <span className="font-extrabold text-2xl tracking-tight text-orange-800 drop-shadow flex items-center gap-2">
                        <BookOpen className="w-6 h-6" />
                        Journal (日志)
                    </span>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 hide-scrollbar flex justify-center">
                <div className="w-full max-w-2xl flex flex-col gap-8 pb-24">

                    {/* Input Area */}
                    <div className="bg-white/70 backdrop-blur-lg border border-orange-100 p-6 rounded-3xl shadow-lg">
                        <form onSubmit={handlePost} className="flex flex-col gap-4">
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="What happened today? (今天发生了什么有趣的事？)"
                                className="w-full bg-white/80 border border-orange-100 rounded-2xl p-4 focus:ring-4 focus:ring-orange-300 outline-none font-medium text-lg min-h-[120px] resize-none"
                            />

                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRole('CHILD')}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold transition-all ${role === 'CHILD'
                                                ? 'bg-amber-100 text-amber-700 shadow-inner border border-amber-300'
                                                : 'bg-[#f5f0e8] text-[#a89880] hover:bg-amber-50'
                                            }`}
                                    >
                                        <User className="w-4 h-4" /> Child (儿童)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('PARENT')}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold transition-all ${role === 'PARENT'
                                                ? 'bg-indigo-100 text-indigo-700 shadow-inner border border-indigo-300'
                                                : 'bg-[#f5f0e8] text-[#a89880] hover:bg-indigo-50'
                                            }`}
                                    >
                                        <UserRound className="w-4 h-4" /> Parent (家长)
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={posting || !text}
                                    className="bg-gradient-to-r from-orange-400 to-amber-500 text-white font-black px-6 py-3 rounded-full shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    Post (发布)
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Timeline Feed */}
                    <div className="flex flex-col gap-4">
                        {loading && <div className="text-center font-bold text-orange-400 py-8">Loading Diaries...</div>}

                        {!loading && entries.length === 0 && (
                            <div className="text-center bg-white/50 py-12 rounded-3xl border border-white/50 text-[#a89880] font-bold">
                                No entries yet. Start writing! (还没有日志哦)
                            </div>
                        )}

                        {entries.map((entry, idx) => {
                            const isChild = entry.authorRole === 'CHILD'
                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex w-full ${isChild ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-3xl shadow-sm border flex flex-col gap-2 ${isChild
                                            ? 'bg-white rounded-tl-none border-[#f5f0e8]'
                                            : 'bg-indigo-50 rounded-tr-none border-indigo-100 text-right'
                                        }`}>
                                        <div className={`flex items-center gap-2 text-xs font-black ${isChild ? 'text-amber-500' : 'text-indigo-400 flex-row-reverse'}`}>
                                            {isChild ? <User className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
                                            {isChild ? 'CHILD' : 'PARENT'} • {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {entry.text && (
                                            <p className={`text-lg leading-relaxed font-medium ${isChild ? 'text-[#2c2416]' : 'text-indigo-900'}`}>
                                                {entry.text}
                                            </p>
                                        )}
                                        {/* Placeholders if image logic is added later */}
                                        {entry.imageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={entry.imageUrl} alt="Journal" className="mt-2 rounded-xl max-h-64 object-cover" />
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </main>
        </div>
    )
}
