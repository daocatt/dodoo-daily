'use client'

import React, { useEffect, useState } from 'react'
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

    const formatCompactNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
        if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
        if (num >= 1000) return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'K'
        return num.toFixed(2)
    }

    return (
        <div
            onClick={() => router.push('/admin/ledger')}
            className="w-full h-full px-4 pt-10 pb-4 md:px-5 md:pt-10 md:pb-5 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            {/* Total Balance Well — Absolute positioned to align with the industrial header */}
            {size !== 'ICON' && (
                <div className="absolute top-3 right-4 z-20 flex items-center pointer-events-none">
                    <div className="px-2 py-0.5 hardware-well rounded-md flex items-center gap-1.5 shadow-inner border border-black/5 opacity-50 bg-black/[0.02]">
                        <span className="label-mono text-[7px] text-slate-400 uppercase tracking-wider">Total</span>
                        <div className="flex items-center gap-0.5">
                            <span className="text-[7.5px] font-medium text-indigo-500">¥</span>
                            <span className="label-mono text-[8.5px] font-medium text-slate-800">{formatCompactNumber(balance)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 space-y-2.5 overflow-hidden z-10 flex flex-col justify-center">
                {records.length > 0 ? (
                    records.map((record) => {
                        const isIncome = record.type === 'INCOME'
                        return (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-2 px-3 rounded-lg shadow-inner border border-black/5 transition-all group/note min-w-0 hover:brightness-[0.98] active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 shadow-inner border border-black/5 ${isIncome ? 'bg-red-500/10 border-red-500/10' : 'bg-emerald-500/10 border-emerald-500/10'}`}>
                                        {record.category?.emoji || '💰'}
                                    </div>
                                    <span
                                        className="font-medium text-slate-800 truncate min-w-0 tracking-tight uppercase"
                                        style={{ fontSize: Math.max(8, cellSize * 0.08) }}
                                    >
                                        {record.description || record.category?.name}
                                    </span>
                                </div>
                                <div 
                                    className={`shrink-0 font-medium label-mono flex items-center gap-0.5 ${isIncome ? 'text-red-500' : 'text-emerald-600'}`}
                                    style={{ fontSize: Math.max(8, cellSize * 0.08) }}
                                >
                                    {isIncome ? '+' : '-'}{record.amount.toFixed(0)}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    size !== 'ICON' && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                             <span className="label-mono text-[9px] uppercase tracking-widest">{t('ledger.noRecords')}</span>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
