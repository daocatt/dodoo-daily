import React from 'react'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'
import ArtPurchaseControls from '@/components/ArtPurchaseControls'
import ArtBuyInfo from '@/components/ArtBuyInfo'

// Page component
export default async function BuyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const artworks = await db.select().from(artwork).where(eq(artwork.id, id))

    if (artworks.length === 0) {
        notFound()
    }

    const art = artworks[0]

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416] items-center justify-center p-4">
            <AnimatedSky />

            <main className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-xl p-8 shadow-2xl border border-white/50 flex flex-col items-center">
                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-inner mb-6 border-4 border-white bg-[#f5f0e8]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                </div>

                <h1 className="text-3xl font-black text-center mb-2">{art.title}</h1>
                
                <ArtBuyInfo priceRMB={art.priceRMB} />

                <ArtPurchaseControls isSold={art.isSold} artId={art.id} />
            </main>
        </div>
    )
}
