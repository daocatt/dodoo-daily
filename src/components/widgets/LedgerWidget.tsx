'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

interface LedgerRecord {
    id: string
    type: 'EXPENSE' | 'INCOME'
    amount: number
    description: string
    date: string
    category?: {
        name: string
        emoji: string
    }
}

export default function LedgerWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const { t } = useI18n()
    const [balance, setBalance] = useState(0)
    const [records, setRecords] = useState<LedgerRecord[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()

    useEffect(() => {
        if (size === 'ICON') return
        fetch('/api/ledger')
            .then(res => res.json())
            .then(data => {
                setBalance(data.balance || 0)
                setRecords(data.records?.slice(0, 2) || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => router.push('/ledger')}
            className={`w-full h-full bg-indigo-50/40 backdrop-blur-xl rounded-3xl p-4 md:p-5 border border-indigo-100/50 shadow-xl shadow-indigo-200/20 flex flex-col group overflow-hidden relative cursor-pointer`}
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-2 z-10'}`}>
                <div className="flex items-center gap-2">
                    <div
                        className="rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover:rotate-12 outline-none"
                        style={{ width: cellSize * 0.35, height: cellSize * 0.35 }}
                    >
                        <Wallet style={{ width: cellSize * 0.18, height: cellSize * 0.18 }} />
                    </div>
                    {size !== 'ICON' && (
                        <span
                            className="font-black text-indigo-600 tracking-tight uppercase opacity-80"
                            style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                        >
                            {t('ledger.title')}
                        </span>
                    )}
                </div>
                {/* Total Balance right aligned */}
                {size !== 'ICON' && (
                    <div
                        className="px-2 py-0.5 bg-indigo-100/80 rounded-full font-black text-indigo-700 uppercase tracking-widest leading-none flex items-center gap-1"
                        style={{ fontSize: Math.max(8, cellSize * 0.08) }}
                    >
                        <span className="opacity-70">¥</span>
                        {balance.toFixed(2)}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-2.5 overflow-hidden z-10 flex flex-col justify-center">
                {records.length > 0 ? (
                    records.map((record) => {
                        const isIncome = record.type === 'INCOME'
                        return (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/80 group-hover:border-indigo-200 transition-colors shadow-sm min-w-0"
                            >
                                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${isIncome ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                                        {record.category?.emoji || '💰'}
                                    </div>
                                    <span
                                        className="font-bold text-slate-700 truncate min-w-0"
                                        style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                                    >
                                        {record.description || record.category?.name}
                                    </span>
                                </div>
                                <div 
                                    className={`shrink-0 font-black font-number flex items-center gap-0.5 ${isIncome ? 'text-emerald-500' : 'text-slate-600'}`}
                                    style={{ fontSize: Math.max(8, cellSize * 0.09) }}
                                >
                                    {isIncome ? '+' : '-'}{record.amount.toFixed(2)}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    size !== 'ICON' && (
                        <div className="h-full flex flex-col items-center justify-center text-indigo-300 opacity-40 italic font-medium" style={{ fontSize: Math.max(8, cellSize * 0.09) }}>
                            <span>{t('ledger.noRecords')}</span>
                        </div>
                    )
                )}
            </div>

            {/* Background decorative Icon */}
            {size !== 'ICON' && (
                <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500 opacity-[0.03] rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700 pointer-events-none" />
            )}
        </motion.div>
    )
}
