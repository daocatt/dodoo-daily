'use client'

import React, { useEffect, useState } from 'react'
import { Pin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

interface Note {
    id: string
    text: string
    authorId: string
    color: string
    isPinned: boolean
}

export default function NotesWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()
    const { t } = useI18n()

    const displayCount = size === 'ICON' ? 0 : size === 'SQUARE' ? 2 : 4

    useEffect(() => {
        if (size === 'ICON') return
        fetch('/api/family-notes')
            .then(res => res.json())
            .then(data => {
                setNotes(data.slice(0, displayCount))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size, displayCount])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    return (
        <div
            className="w-full h-full flex flex-col p-6 pt-10 group overflow-hidden relative cursor-pointer"
            onClick={() => router.push('/admin/notes')}
        >
            <div className="flex-1 space-y-2 overflow-hidden relative">
                {notes.length > 0 ? (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            className="flex items-center justify-between p-2.5 bg-white border border-black/5 rounded-lg shadow-sm group-hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                <div className="w-2 h-2 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: note.color || '#FEF3C7' }} />
                                <p
                                    className="font-black text-slate-800 tracking-tight truncate"
                                    style={{ fontSize: Math.max(9, cellSize * 0.11) }}
                                >
                                    {note.text}
                                </p>
                            </div>
                            {note.isPinned && (
                                <Pin
                                    className="text-amber-500 fill-amber-500 shrink-0 ml-1"
                                    style={{ width: cellSize * 0.1, height: cellSize * 0.1 }}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                         <span className="label-mono text-[9px] uppercase tracking-widest">{t('widget.notes.waiting')}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
