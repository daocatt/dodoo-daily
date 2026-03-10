'use client'

import React from 'react'
import { useI18n } from '@/contexts/I18nContext'

interface ArtBuyInfoProps {
    priceRMB: number | null
}

export default function ArtBuyInfo({ priceRMB }: ArtBuyInfoProps) {
    const { t } = useI18n()

    return (
        <>
            <p className="text-center text-[#a89880] mb-8 text-sm max-w-sm">
                {t('buy.supportCreator')}
            </p>

            <div className="flex justify-between items-center w-full mb-8 bg-[#f5f0e8] p-4 rounded-xl border border-[#e8dfce]">
                <span className="font-bold text-[#6b5c45]">{t('buy.collectionPrice')}</span>
                <span className="text-3xl font-black text-purple-600">¥ {priceRMB}</span>
            </div>
        </>
    )
}
