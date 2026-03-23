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
        <main className="min-h-dvh relative flex flex-col items-center p-6 bg-[#E2DFD2] app-bg-pattern overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40 shrink-0" />
            
            <div className="w-full max-w-4xl relative z-20 flex justify-between items-center mb-12 mt-4 px-2">
                <Link href="/visitor" className="hardware-btn group">
                    <div className="hardware-cap bg-white px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-black/5 shadow-sm active:translate-y-0.5 transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-indigo-500" />
                        <span className="label-mono text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">Back</span>
                    </div>
                </Link>

                <div className="hardware-well bg-[#D1CDBC] p-1 rounded-2xl shadow-inner flex items-center gap-3">
                    <div className="bg-white/80 px-4 py-1.5 rounded-xl border border-white/50 flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">FAMILY NODE</span>
                        <span className="text-xs font-black text-slate-800 tracking-tight">PUBLIC EXHIBITIONS</span>
                    </div>
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-4xl">
                {familyMembers.length === 0 ? (
                    <div className="bg-[#F4F4F2] border-4 border-[#C8C4B0] rounded-[3rem] p-16 text-center shadow-well flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-24 h-24 bg-[#E2DFD2] rounded-full flex items-center justify-center shadow-inner mb-6">
                            <ShieldCheck className="w-10 h-10 text-slate-400 opacity-50" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">No Public Records</h2>
                        <p className="label-mono text-xs text-slate-500 uppercase tracking-widest leading-loose max-w-sm mx-auto">
                            The family has currently suspended all public exhibition broadcasts. Check back later or request access.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {familyMembers.map((member) => (
                            <Link 
                                key={member.id}
                                href={member.slug ? `/u/${member.slug}` : '#'}
                                className={`group relative hardware-well p-1 rounded-[2rem] bg-[#C8C4B0] transition-transform hover:-translate-y-1 ${!member.slug && 'opacity-60 pointer-events-none'}`}
                            >
                                <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-100 rounded-[2rem] blur-xl transition-opacity duration-500" />
                                <div className="relative bg-[#F4F4F2] p-6 rounded-[1.8rem] h-full border border-white/50 shadow-inner flex flex-col items-center">
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                    <div className="w-24 h-24 rounded-full border-4 border-[#E2DFD2] shadow-xl overflow-hidden mb-6 bg-slate-100 shrink-0">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-4xl text-slate-300">
                                                {member.name[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center w-full flex-1 flex flex-col items-center justify-center">
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mb-1">{member.nickname || member.name}</h3>
                                        <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest mb-6">
                                            {member.role} NODE
                                        </span>
                                    </div>
                                    <div className="w-full hardware-btn mt-auto">
                                        <div className="hardware-cap bg-[#2C2A20] py-3 rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-600 transition-colors">
                                            <Palette className="w-4 h-4 text-white/50 group-hover:text-white" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white">{member.slug ? 'View Exhibition' : 'Local Only'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .app-bg-pattern {
                    background-image: radial-gradient(rgba(0,0,0,0.15) 1.5px, transparent 1.5px);
                    background-size: 32px 32px;
                }
                .shadow-well {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.5);
                }
            `}</style>
        </main>
    )
}
