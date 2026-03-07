'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()

    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // For simplicity, we just submit a checkout payload
    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        setLoading(true)
        try {
            const res = await fetch(`/api/buy/${params.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            })

            if (res.ok) {
                setSuccess(true)
                setTimeout(() => {
                    router.push(`/buy/${params.id}`)
                }, 3000)
            } else {
                alert('Purchase failed!')
            }
        } catch (error) {
            console.error('Purchase error', error)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center bg-[#e0f2fe] text-[#2c2416] p-4 text-center">
                <AnimatedSky />
                <div className="z-10 bg-white/80 p-12 rounded-xl shadow-2xl backdrop-blur-md">
                    <h1 className="text-4xl font-black text-green-500 mb-4">Payment Success!</h1>
                    <p className="text-xl font-bold">Thank you for your support. (感谢您的支持)</p>
                    <p className="text-[#a89880] mt-4">Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416] items-center justify-center p-4">
            <AnimatedSky />

            <form onSubmit={handlePurchase} className="relative z-10 w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-xl p-8 shadow-2xl border border-white/50 flex flex-col gap-6">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-black mb-2">Checkout</h1>
                    <p className="text-[#a89880] text-sm tracking-wide">Leave your mark as a collector</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#6b5c45] mb-2">Alias / Name (您的称呼)</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-purple-400 outline-none font-bold text-lg"
                        placeholder="e.g. Grandma, Friend X"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#6b5c45] mb-2">Phone (联系方式 - Optional)</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-purple-400 outline-none font-bold text-lg"
                        placeholder="Optional"
                    />
                </div>

                <div className="bg-purple-100 p-4 rounded-xl border border-purple-200 mt-2">
                    <p className="text-sm text-purple-800 text-center font-bold">This simulates a payment flow.</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-opacity text-xl flex justify-center items-center"
                >
                    {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full py-3 bg-white/50 text-[#6b5c45] font-bold rounded-2xl hover:bg-white/80 transition-colors"
                >
                    Cancel
                </button>
            </form>
        </div>
    )
}
