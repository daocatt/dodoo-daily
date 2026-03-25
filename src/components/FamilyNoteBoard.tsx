'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Pin, PinOff, Trash2, Send, MessageSquareHeart } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import { clsx } from 'clsx'

interface Note {
    id: string
    text: string
    color: string
    isPinned: boolean
    createdAt: number
    authorId: string
    authorName: string
    authorAvatar: string | null
}

const COLORS = [
    { name: 'Yellow', value: '#FEF3C7' },
    { name: 'Blue', value: '#E0F2FE' },
    { name: 'Green', value: '#DCFCE7' },
    { name: 'Pink', value: '#FCE7F3' },
    { name: 'Purple', value: '#F3E8FF' }
]

export default function FamilyNoteBoard({ 
    isAdding, 
    setIsAdding 
}: { 
    isAdding: boolean, 
    setIsAdding: (val: boolean) => void 
}) {
    const { t } = useI18n()
    const [notes, setNotes] = useState<Note[]>([])
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)
    const [newText, setNewText] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentUser, setCurrentUser] = useState<{ userId: string; isAdmin: boolean } | null>(null)

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/family-notes')
            if (res.ok) {
                const data = await res.json()
                setNotes(data)
            }
        } catch (_error) {
            console.error('Failed to fetch notes:', _error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setCurrentUser({ userId: data.userId, isAdmin: data.isAdmin })
            }
        } catch (_e) {
            console.error('Failed to fetch user:', _e)
        }
    }

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newText.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/family-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText, color: selectedColor })
            })
            if (res.ok) {
                setNewText('')
                setIsAdding(false)
                fetchNotes()
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteNote = async (id: string) => {
        try {
            const res = await fetch(`/api/family-notes/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setNotes(prev => prev.filter(n => n.id !== id))
            }
        } catch (_error) {
            console.error('Failed to delete note:', _error)
        }
    }

    const handleTogglePin = async (note: Note) => {
        try {
            const res = await fetch(`/api/family-notes/${note.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !note.isPinned })
            })
            if (res.ok) {
                fetchNotes()
            }
        } catch (_error) {
            console.error('Failed to pin note:', _error)
        }
    }

    useEffect(() => {
        fetchNotes()
        fetchUser()
    }, [])

    if (loading) return null

    return (
        <section className="mt-4 mb-20 px-8 md:px-16 lg:px-20">
            {/* System Baustein Orange Hardware Panel (Module Indicator) */}
            <div className="flex items-center mb-12 px-4 md:px-10">
                <div className="hardware-btn group cursor-default select-none">
                    <div className="hardware-well px-6 py-3 rounded-2xl bg-[#DADBD4] shadow-well flex items-center relative gap-3 border-b-2 border-slate-400/20 active:translate-y-0 overflow-hidden">
                        {/* Mounting Rivets */}
                        <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />

                        <div className="hardware-cap absolute inset-1.5 rounded-xl bg-orange-500 shadow-cap pointer-events-none" />

                        <div className="flex items-center gap-3 relative z-10 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                            <MessageSquareHeart className="w-6 h-6 fill-white opacity-90" />
                            <div className="flex flex-col">
                                <h1 className="text-sm font-black tracking-tight leading-none uppercase label-mono text-white">
                                    {t('board.title')}
                                </h1>
                                <span className="label-mono text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap mt-1 text-white">
                                    {t('board.subtitle')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid of Notes */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                            animate={{ opacity: 1, scale: 1, rotate: note.isPinned ? 0 : (Math.random() * 4 - 2) }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            whileHover={{ scale: 1.02, rotate: 0, zIndex: 10 }}
                            onClick={() => setSelectedNote(note)}
                            className="relative aspect-square p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col group overflow-hidden border border-white/20 cursor-pointer active:scale-95 transition-transform"
                            style={{ backgroundColor: note.color }}
                        >
                            {/* Pin Icon */}
                            {(note.authorId === currentUser?.userId || currentUser?.isAdmin) && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleTogglePin(note)
                                    }}
                                    className={`absolute top-3 right-3 md:top-4 md:right-4 p-1.5 rounded-full transition-all ${note.isPinned ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-black/5'}`}
                                >
                                    {note.isPinned ? <Pin className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <PinOff className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                                </button>
                            )}

                            {/* Content - Optimized mobile proportions */}
                            <p className="text-slate-800 font-bold leading-relaxed flex-1 pr-2 line-clamp-4 md:line-clamp-6 text-sm md:text-base">
                                {note.text}
                            </p>

                            {/* Footer - Minimized for better content proportion */}
                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-black/5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                                    <div className="w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-lg md:rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white/40 relative">
                                        <Image src={note.authorAvatar || "/dog.svg"} alt={note.authorName} fill className="object-cover" />
                                    </div>
                                    <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-tight md:tracking-wider truncate">{note.authorName}</span>
                                </div>

                                {(note.authorId === currentUser?.userId || currentUser?.isAdmin) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteNote(note.id)
                                        }}
                                        className="p-1.5 md:p-2 text-slate-400 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-lg"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {notes.length === 0 && !isAdding && (
                <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('board.empty')}</p>
                </div>
            )}

            {/* Note Detail Modal (System Baustein 3.0) */}
            <AnimatePresence>
                {selectedNote && (
                    <div className="fixed inset-0 z-[2200] flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setSelectedNote(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="relative w-full max-w-lg"
                        >
                            <div 
                                className="baustein-panel w-full rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-white/20 flex flex-col"
                                style={{ backgroundColor: selectedNote.color }}
                            >
                                {/* Modal Header */}
                                <div className="px-6 py-5 relative border-b border-black/5 flex items-center justify-between bg-black/[0.03]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white/40 relative">
                                            <Image src={selectedNote.authorAvatar || "/dog.svg"} alt={selectedNote.authorName} fill className="object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedNote.authorName}</span>
                                            <span className="label-mono text-[8px] text-slate-400 uppercase tracking-[0.1em]">Message Readout</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => setSelectedNote(null)}
                                        className="hardware-btn group"
                                    >
                                        <div className="hardware-well w-10 h-10 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                            <div className="hardware-cap absolute inset-1 bg-white rounded-lg flex items-center justify-center transition-all shadow-cap group-active:translate-y-0.5">
                                                <X className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-8 md:p-12">
                                    <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {selectedNote.text}
                                    </p>
                                    
                                    <div className="mt-12 pt-8 border-t border-black/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 label-mono text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            System Verified Node
                                        </div>
                                        {/* Pin status in detail */}
                                        {selectedNote.isPinned && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                                <Pin className="w-3 h-3" />
                                                Priority Note
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Note Modal (System Baustein 3.0) */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[2100] flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsAdding(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="relative w-full max-w-md"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                {/* Compact Header */}
                                <div className="px-6 py-5 relative border-b border-black/5 bg-black/[0.02]">
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="hardware-btn group absolute top-3.5 right-6"
                                    >
                                        <div className="hardware-well w-9 h-9 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well">
                                            <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center transition-all shadow-cap">
                                                <X className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                        </div>
                                    </button>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{t('board.leaveNote')}</h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
                                        <p className="label-mono text-[8px] text-slate-400 uppercase tracking-[0.1em]">Message Node Encryption Active</p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 pt-4">
                                    <form onSubmit={handleAddNote} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('board.chatAndNotes') || 'Content'}</label>
                                            <div className="hardware-well rounded-2xl p-4 transition-colors" style={{ backgroundColor: selectedColor }}>
                                                <textarea
                                                    autoFocus
                                                    value={newText}
                                                    onChange={(e) => setNewText(e.target.value)}
                                                    placeholder={t('board.placeholder')}
                                                    className="w-full h-40 bg-transparent border-none outline-none resize-none font-bold text-slate-800 placeholder:text-slate-400 text-lg leading-relaxed"
                                                    maxLength={200}
                                                />
                                                <div className="text-right label-mono text-[8px] font-black text-black/20 uppercase">
                                                    {newText.length}/200
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('board.chooseColor')}</label>
                                                <div className="flex gap-3 hardware-well p-2 rounded-xl bg-[#D1CDBC]">
                                                    {COLORS.map((c) => (
                                                        <button
                                                            key={c.name}
                                                            type="button"
                                                            onClick={() => setSelectedColor(c.value)}
                                                            className="hardware-btn group"
                                                        >
                                                            <div className={clsx(
                                                                "w-9 h-9 rounded-lg shadow-sm transition-all border-2",
                                                                selectedColor === c.value ? "border-slate-800 scale-105" : "border-white/20"
                                                            )} style={{ backgroundColor: c.value }} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={!newText.trim() || isSubmitting}
                                                    className="hardware-btn w-full group relative"
                                                >
                                                    <div className="hardware-well h-16 bg-[#D1CDBC] rounded-[1.25rem] relative overflow-hidden">
                                                        <div className={clsx(
                                                            "hardware-cap absolute inset-1.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-cap active:translate-y-0.5",
                                                            !newText.trim() || isSubmitting ? "bg-slate-400 grayscale" : "bg-slate-900 group-hover:bg-slate-800"
                                                        )}>
                                                            <Send className="w-5 h-5 text-white" />
                                                            <span className="label-mono text-[11px] font-black text-white uppercase tracking-[0.2em]">
                                                                {isSubmitting ? t('board.posting') : t('board.postBtn')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </section>
    )
}
