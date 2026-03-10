'use client'

import React from 'react'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'

interface ArtPurchaseControlsProps {
    isSold: boolean | null
    artId: string
}

export default function ArtPurchaseControls({ isSold, artId }: ArtPurchaseControlsProps) {
    const { t } = useI18n()

    if (isSold) {
        return (
            <div className="w-full py-4 bg-gray-300 text-gray-600 font-bold rounded-2xl text-center uppercase tracking-wider">
                {t('buy.alreadyCollected')}
            </div>
        )
    }

    return (
        <Link 
            href={`/buy/${artId}/checkout`} 
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2 text-lg"
        >
            {t('buy.buyNow')}
        </Link>
    )
}
