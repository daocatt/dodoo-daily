import React from 'react'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'
import Link from 'next/link'

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
                <p className="text-center text-[#a89880] mb-8 text-sm max-w-sm">Support our little creator by collecting this artwork! Your purchase translates to real rewards for them.</p>

                <div className="flex justify-between items-center w-full mb-8 bg-[#f5f0e8] p-4 rounded-xl border border-[#e8dfce]">
                    <span className="font-bold text-[#6b5c45]">Collection Price</span>
                    <span className="text-3xl font-black text-purple-600">¥ {art.priceRMB}</span>
                </div>

                {art.isSold ? (
                    <div className="w-full py-4 bg-gray-300 text-gray-600 font-bold rounded-2xl text-center uppercase tracking-wider">
                        Already Collected (已售出)
                    </div>
                ) : (
                    <Link href={`/buy/${art.id}/checkout`} className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2 text-lg">
                        Buy Now (即刻购买)
                    </Link>
                )}
            </main>
        </div>
    )
}
