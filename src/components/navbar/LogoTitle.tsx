'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cpu } from 'lucide-react'
import { clsx } from 'clsx'
import versionData from '../../../version.json'

interface LogoTitleProps {
    systemName: string
    subtitle?: string
    status?: string
}

export function LogoTitle({ systemName, subtitle, status = 'NOMINAL' }: LogoTitleProps) {
    return (
        <div className="flex items-center gap-4">
            <div className="hardware-btn group">
                <Link href="/admin" className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#DADBD4] overflow-hidden p-1 shadow-well relative">
                    <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-all shadow-cap active:translate-y-0.5">
                        <Image src="/dog.svg" alt="DoDoo" width={28} height={28} className="contrast-125" />
                    </div>
                </Link>
            </div>
            
            <div className="hidden sm:flex flex-col justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black tracking-tighter text-slate-900 leading-none uppercase">
                        {systemName}
                    </span>
                    {subtitle && (
                        <>
                            <div className="w-[1.5px] h-2.5 bg-black/10 rounded-full" />
                            <span className="text-[11px] font-bold tracking-tighter text-indigo-600 leading-none uppercase">
                                {subtitle}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 line-clamp-1">
                    <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded border border-black/5 shadow-inner">
                        <div className={clsx(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            status === 'NOMINAL' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                        )} />
                        <span className="label-mono text-[7px] font-black text-slate-600">DoDoo</span>
                    </div>
                    <div className="w-[1px] h-3 bg-black/10" />
                    <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        <span className="label-mono text-[7px] text-slate-400">Ver. {versionData.version}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
