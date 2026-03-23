'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Pin, PinOff, Trash2, Send, MessageSquareHeart } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

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

export default function FamilyNoteBoard() {
    const { t } = useI18n()
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newText, setNewText] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentUser, setCurrentUser] = useState<{ userId: string; isParent: boolean } | null>(null)

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
                setCurrentUser({ userId: data.userId, isParent: data.isParent })
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
        <section className="mt-12 mb-20 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                        <MessageSquareHeart className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('board.title')}</h2>
                        <p className="text-sm text-slate-500 font-medium">{t('board.subtitle')}</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-500 hover:text-amber-500 hover:border-amber-200 hover:scale-110 active:scale-95 transition-all shadow-sm"
                >
                    <Plus className="w-6 h-6" />
                </button>
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
                            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                            className="relative aspect-square p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col group overflow-hidden border border-white/20"
                            style={{ backgroundColor: note.color }}
                        >
                            {/* Pin Icon */}
                            {(note.authorId === currentUser?.userId || currentUser?.isParent) && (
                                <button
                                    onClick={() => handleTogglePin(note)}
                                    className={`absolute top-4 right-4 p-1.5 rounded-full transition-all ${note.isPinned ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-black/5'}`}
                                >
                                    {note.isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                                </button>
                            )}

                            {/* Content */}
                            <p className="text-slate-800 font-bold leading-relaxed overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                {note.text}
                            </p>

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white/40 relative">
                                        <Image src={note.authorAvatar || "/dog.svg"} alt={note.authorName} fill className="object-cover" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{note.authorName}</span>
                                </div>

                                {(note.authorId === currentUser?.userId || currentUser?.isParent) && (
                                    <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
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

            {/* Add Note Modal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsAdding(false)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="p-8 md:p-12">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">{t('board.leaveNote')}</h3>
                                <p className="text-slate-500 text-sm mb-8">{t('board.prompt')}</p>

                                <form onSubmit={handleAddNote} className="space-y-8">
                                    <div
                                        className="relative rounded-[2rem] p-8 shadow-inner transition-colors border-4 border-slate-50"
                                        style={{ backgroundColor: selectedColor }}
                                    >
                                        <textarea
                                            autoFocus
                                            value={newText}
                                            onChange={(e) => setNewText(e.target.value)}
                                            placeholder={t('board.placeholder')}
                                            className="w-full h-40 bg-transparent border-none outline-none resize-none font-bold text-slate-800 placeholder:text-slate-400 text-lg leading-relaxed"
                                            maxLength={200}
                                        />
                                        <div className="absolute bottom-6 right-6 text-[10px] font-black text-black/20 uppercase">
                                            {newText.length}/200
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('board.chooseColor')}</p>
                                            <div className="flex gap-3">
                                                {COLORS.map((c) => (
                                                    <button
                                                        key={c.name}
                                                        type="button"
                                                        onClick={() => setSelectedColor(c.value)}
                                                        className={`w-10 h-10 rounded-2xl shadow-sm transition-all border-4 ${selectedColor === c.value ? 'border-slate-900 scale-110' : 'border-white hover:scale-105'}`}
                                                        style={{ backgroundColor: c.value }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!newText.trim() || isSubmitting}
                                            className="w-full bg-slate-900 text-white rounded-[1.5rem] py-5 font-black flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                                        >
                                            {isSubmitting ? t('board.posting') : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    {t('board.postBtn')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
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
