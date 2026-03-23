import React from 'react'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowLeft, Users, Palette, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FamilyPage() {
    // Fetch users with exhibitionEnabled = true
    const familyMembers = await db.select({
        id: users.id,
        name: users.name,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        slug: users.slug,
        role: users.role,
    })
    .from(users)
    .where(eq(users.exhibitionEnabled, true))
    .orderBy(desc(users.role))

    return (
        <main className="min-h-dvh relative flex flex-col items-center p-6 md:p-12 bg-[#C8C9C4] app-bg-pattern overflow-x-hidden">
             {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/5 to-transparent" />
            </div>
            
            <div className="w-full max-w-5xl relative z-20 flex justify-between items-center mb-16 mt-4 md:px-4">
                <Link href="/" className="hardware-btn group">
                    <div className="hardware-cap bg-white px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-black/5 shadow-sm active:translate-y-0.5 transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-indigo-500" />
                        <span className="label-mono text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900 uppercase tracking-widest">Back</span>
                    </div>
                </Link>

                <div className="hardware-well bg-[#D1CDBC] p-1 rounded-2xl shadow-inner flex items-center gap-3">
                    <div className="bg-white/80 px-4 py-1.5 rounded-xl border border-white/50 flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">FAMILY NODE</span>
                        <span className="text-xs font-black text-slate-800 tracking-tight uppercase">Exhibition Hub</span>
                    </div>
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-5xl">
                {/* Simplified Background Pattern using Tailwind Grid Utility */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
                    style={{ 
                        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }} 
                />
                
                {familyMembers.length === 0 ? (
                    <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[3rem] p-16 text-center shadow-[0_40px_100px_rgba(0,0,0,0.3)] border-4 border-[#C8C4B0] flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-24 h-24 bg-[#D6D2C0] rounded-full flex items-center justify-center border-4 border-[#C8C4B0] mb-8">
                            <ShieldCheck className="w-10 h-10 text-slate-400 opacity-50" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">No Public Records</h2>
                        <p className="label-mono text-[10px] text-slate-500 uppercase tracking-[0.2em] leading-loose max-w-xs mx-auto">
                            The family has currently suspended all public exhibition broadcasts. Check back later.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {familyMembers.map((member) => (
                            <Link 
                                key={member.id}
                                href={member.slug ? `/u/${member.slug}` : '#'}
                                className={`group relative baustein-panel p-1 rounded-[3rem] bg-[#C8C4B0] transition-all hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.3)] ${!member.slug && 'opacity-60 pointer-events-none'}`}
                            >
                                <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-20 rounded-[3rem] blur-2xl transition-opacity duration-700" />
                                <div className="relative bg-[#E2DFD2] p-8 rounded-[2.8rem] h-full border border-white/40 shadow-inner flex flex-col items-center overflow-hidden">
                                     {/* Scanline overlay for cards */}
                                     <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
                                    
                                    <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
                                    
                                    <div className="w-28 h-28 rounded-full border-4 border-[#D6D2C0] shadow-2xl overflow-hidden mb-8 bg-slate-100 shrink-0 relative">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-4xl text-slate-300">
                                                {member.name[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="text-center w-full flex-1 flex flex-col items-center justify-center pb-8 border-b-2 border-black/5 mb-8">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{member.nickname || member.name}</h3>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-lg border border-black/5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                {member.role === 'PARENT' ? 'AUTHORIZED ADMIN' : 'CREATIVE ENTITY'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full hardware-btn mt-auto">
                                        <div className="hardware-cap bg-[#2C2A20] py-4 rounded-2xl flex items-center justify-center gap-3 group-hover:bg-indigo-600 transition-all shadow-lg active:scale-[0.98]">
                                            <Palette className="w-4 h-4 text-white/50 group-hover:text-white group-hover:rotate-12 transition-all" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{member.slug ? 'Open Exhibition' : 'Local Node Only'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

        </main>
    )
}
