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
                            className="flex items-center justify-between p-2 px-3 rounded-lg shadow-inner border border-black/5 transition-all group/note min-w-0 hover:brightness-[0.98] active:scale-[0.99]"
                            style={{ backgroundColor: note.color ? `${note.color}40` : '#FEF3C740' }}
                        >
                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <p
                                    className="font-medium text-slate-800/80 tracking-tight truncate uppercase"
                                    style={{ fontSize: Math.max(8, cellSize * 0.08) }}
                                >
                                    {note.text}
                                </p>
                            </div>
                            {note.isPinned && (
                                <Pin
                                    className="text-amber-500 fill-amber-500 shrink-0 ml-2 opacity-60"
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
