'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Flame, AlertOctagon, Info } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'

type EmotionRecord = {
    id: string
    type: string
    notes: string | null
    resolved: boolean
    createdAt: string
}

export default function EmotionsPage() {
    const [records, setRecords] = useState<EmotionRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [recording, setRecording] = useState(false)
    const [notes, setNotes] = useState('')
    const [showModal, setShowModal] = useState(false)
    const { t } = useI18n()

    useEffect(() => {
        fetchRecords()
    }, [])

    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/emotions')
            const data = await res.json()
            setRecords(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleRecordAnger = async (e: React.FormEvent) => {
        e.preventDefault()
        setRecording(true)
        try {
            const res = await fetch('/api/emotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            })
            if (res.ok) {
                setShowModal(false)
                setNotes('')
                fetchRecords()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setRecording(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-rose-50 text-[#2c2416]">
            {/* Different background tone for Emotions */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200/50 via-red-100/30 to-rose-50/10 pointer-events-none" />

            <header className="relative z-10 flex justify-between items-center p-6 backdrop-blur-sm bg-white/20 border-b border-red-200">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-red-500 border border-white/50">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <span className="font-extrabold text-2xl tracking-tight text-red-700 drop-shadow flex items-center gap-2">
                        <AlertOctagon className="w-6 h-6" />
                        {t('emotions.title')}
                    </span>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 hide-scrollbar flex flex-col items-center">
                <div className="w-full max-w-2xl flex flex-col gap-8 pb-24">

                    {/* Big Button Area */}
                    <div className="bg-white/60 backdrop-blur-xl border border-red-100 p-8 rounded-xl shadow-xl flex flex-col items-center text-center">
                        <div className="bg-rose-100 p-4 rounded-full mb-4">
                            <Flame className="w-12 h-12 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-black text-rose-700 mb-2">{t('emotions.angerQuestion')}</h2>
                        <p className="text-rose-900/60 font-bold mb-6 text-sm">{t('emotions.recordDesc')}</p>

                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xl px-8 py-5 rounded-2xl shadow-[0_8px_30px_rgb(225,29,72,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto flex items-center justify-center gap-3"
                        >
                            <AlertOctagon className="w-6 h-6" />
                            {t('emotions.recordBtn')}
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h3 className="font-black text-xl text-rose-900 mb-2">{t('emotions.history')}</h3>
                        {loading ? (
                            <div className="text-center py-8 text-rose-500 font-bold">{t('common.loading')}</div>
                        ) : records.length === 0 ? (
                            <div className="bg-white/50 border border-white rounded-2xl p-8 text-center text-rose-800/60 font-bold text-lg flex flex-col items-center justify-center gap-2">
                                <Info className="w-8 h-8 opacity-50" />
                                {t('emotions.noRecords')}
                            </div>
                        ) : (
                            records.map((rec, idx) => (
                                <motion.div
                                    key={rec.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 flex flex-col gap-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 font-bold text-rose-600">
                                            <AlertOctagon className="w-5 h-5" />
                                            {new Date(rec.createdAt).toLocaleString()}
                                        </div>
                                        {rec.resolved ? (
                                            <span className="text-xs font-black bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-widest">{t('emotions.resolved')}</span>
                                        ) : (
                                            <span className="text-xs font-black bg-rose-100 text-rose-700 px-3 py-1 rounded-full uppercase tracking-widest">{t('emotions.penalty')}</span>
                                        )}
                                    </div>
                                    {rec.notes && <p className="text-[#6b5c45] font-medium pt-2 border-t border-rose-50 mt-1">{rec.notes}</p>}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-rose-100 flex justify-between items-center bg-rose-50">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-rose-700"><Flame className="w-5 h-5" /> {t('common.confirm')}</h3>
                            </div>
                            <form onSubmit={handleRecordAnger} className="p-6 flex flex-col gap-5 bg-white">
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-2">{t('emotions.form.reasonLabel')}</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-rose-200 outline-none font-medium text-lg min-h-[100px] resize-none"
                                        placeholder={t('emotions.form.reasonPlaceholder')}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={recording}
                                    className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-black tracking-widest shadow-lg hover:opacity-90 transition-opacity text-lg"
                                >
                                    {recording ? t('emotions.form.saving') : t('emotions.form.confirm')}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="py-2 text-[#a89880] font-bold hover:text-[#2c2416]">
                                    {t('common.cancel')}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
