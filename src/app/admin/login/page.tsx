'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Loader2, ArrowLeft, CheckCircle2, Terminal, Power, Activity } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'

type AuthUser = {
    id: string
    name: string
    nickname: string | null
    role: string
    avatarUrl: string | null
    hasPin: boolean
}

// Common Panel Header - Moved outside for React best practices
const PanelHeader = ({ id, systemName }: { id: string; systemName: string }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--groove-dark)] bg-[var(--surface-warm)]">
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-moss)] shadow-[0_0_8px_var(--accent-moss)] animate-pulse" />
            <span className="font-black text-sm tracking-tight">{systemName}</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="px-2 py-0.5 border border-[var(--text-muted)] rounded text-[8px] font-bold opacity-30">MODEL: DO-19.X</div>
            <div className="px-3 py-1 bg-[var(--well-bg)] rounded-md shadow-inner text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                {id}
            </div>
        </div>
    </div>
)

export default function LoginPage() {
    const [users, setUsers] = useState<AuthUser[]>([])
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
    const [pin, setPin] = useState('')
    const [rememberMe, setRememberMe] = useState(true)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { t } = useI18n()
    const [systemName, setSystemName] = useState('DoDoo System')
    // const [nickname, setNickname] = useState('')

    // First Launch States
    /* Future: First Launch Feature
    const [isFirstLaunch, setIsFirstLaunch] = useState(false)
    const [firstLaunchName, setFirstLaunchName] = useState('')
    const [firstLaunchAvatarPreview, setFirstLaunchAvatarPreview] = useState<string | null>(null)
    const [firstLaunchAvatarFile, setFirstLaunchAvatarFile] = useState<File | null>(null)
    const firstLaunchFileInputRef = useRef<HTMLInputElement>(null)
    */

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/users').then(res => res.json()),
            fetch('/api/system/settings').then(res => res.json())
        ])
            .then(([usersData, settingsData]) => {
                setUsers(usersData)
                if (settingsData.needsSetup && usersData.length === 1 && usersData[0].role === 'PARENT' && usersData[0].name === 'Parent') {
                    // setIsFirstLaunch(true)
                }
                // setShowAllAvatars(settingsData.showAllAvatars ?? true)
                setSystemName(settingsData.systemName || 'DoDoo System')
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
            })
    }, [])

    const handleLogin = async (e?: React.FormEvent) => {
        if (_e) e.preventDefault()
        if (!selectedUser) return
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedUser.id,
                    pin,
                    rememberMe
                })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                window.location.href = data.needsSetup ? '/admin/setup' : '/'
            } else {
                setError(data.error === 'Invalid PIN' ? t('login.error.invalidPin') : (data.error || 'Network Error'))
                setLoading(false)
            }
        } catch {
            setLoading(false)
        }
    }


    return (
        <main className="h-dvh overflow-hidden app-bg-pattern flex items-center justify-center p-4 md:p-8 relative">
            {/* Global Back Button */}
            <div className="absolute top-10 left-10 z-50">
                <button 
                    onClick={() => window.location.href = '/'}
                    className="hardware-btn group"
                >
                    <div className="hardware-cap bg-white px-6 py-3 rounded-2xl flex items-center gap-3 border border-black/5 shadow-sm active:translate-y-0.5 transition-all">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-indigo-500" />
                        <span className="label-mono text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">{t('common.back')}</span>
                    </div>
                </button>
            </div>

            <div className="w-full max-w-6xl">
                <AnimatePresence mode="wait">
                    {!selectedUser ? (
                        <motion.div
                            key="user-selector"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="baustein-panel shadow-[0_40px_100px_rgba(0,0,0,0.3)] grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:h-[640px] w-full overflow-hidden"
                        >
                            {/* Left Side: Monitor - Fixed on Desktop */}
                            <div className="hidden md:flex md:col-span-4 bg-[var(--well-bg)] p-8 flex-col items-center justify-center border-r-2 border-[var(--groove-dark)] relative overflow-hidden h-full">
                                {/* Monitor Scan Lines Effect */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                                
                                <div className="w-full max-w-xs space-y-8 relative z-10 text-center">
                                    <div className="hardware-well aspect-square rounded-2xl flex items-center justify-center border-4 border-[#C8C4B0] overflow-hidden group bg-slate-950 relative">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 1.15 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 1.2, ease: 'circOut' }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src="/cyber_home.png"
                                                alt="System Visual"
                                                fill
                                                className="object-cover opacity-70 contrast-125 grayscale-[20%]"
                                                priority
                                            />
                                        </motion.div>
                                        
                                        {/* CRT Effect Overlays */}
                                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] z-10" />
                                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 bg-[length:100%_2px,3px_100%] opacity-40 animate-scanline" />
                                        
                                        <div className="absolute bottom-3 right-3 z-30">
                                            <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded flex items-center gap-1.5 shadow-xl">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                                                <span className="label-mono text-[8px] text-emerald-400 opacity-80 uppercase tracking-widest">{t('login.monitorReady')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="label-mono">{t('login.systemCore')}</span>
                                            <span className="label-mono text-[var(--accent-moss)]">{t('login.active')}</span>
                                        </div>
                                        <div className="h-1 bg-black/10 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-[var(--accent-moss)] w-full"
                                                animate={{ x: ['-100%', '0%'] }}
                                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Controls */}
                            <div className="col-span-1 md:col-span-8 flex flex-col h-full overflow-hidden">
                                <PanelHeader id="Access Terminal" systemName={systemName} />
                                <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-[var(--surface-warm)]">
                                    <div className="mb-4 text-center md:text-left">
                                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--text-primary)] mb-1 uppercase">{t('login.identifyProfile')}</h1>
                                        <p className="label-mono opacity-60 text-[9px] uppercase tracking-widest leading-none">{t('login.selectOperator')}</p>
                                    </div>

                                    {loading ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className="hardware-well h-44 rounded-2xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`grid gap-3 md:gap-4 justify-items-center ${
                                            users.length <= 1 ? 'grid-cols-1 max-w-xs mx-auto' : 
                                            users.length === 2 ? 'grid-cols-2' : 
                                            users.length === 3 ? 'grid-cols-3' : 
                                            'grid-cols-2 lg:grid-cols-4'
                                        }`}>
                                            {users.map((u, i) => (
                                                <motion.button
                                                    key={u.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => setSelectedUser(u)}
                                                    className="hardware-btn group transition-all w-full max-w-[170px]"
                                                >
                                                    <div className="hardware-cap p-2.5 bg-white rounded-2xl flex flex-col items-center justify-center gap-2.5 border-2 border-black/5 group-hover:bg-[var(--surface-white)] transition-colors h-40">
                                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-[var(--well-bg)] shadow-inner">
                                                            {u.avatarUrl ? (
                                                                <Image 
                                                                    src={`${u.avatarUrl}?v=4`} 
                                                                    width={96}
                                                                    height={96}
                                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform duration-500 group-hover:scale-110" 
                                                                    alt={u.nickname || u.name} 
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center"><User className="w-8 h-8 text-slate-300" /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-extrabold text-[10px] md:text-[11px] uppercase tracking-tighter text-[var(--text-primary)] text-center px-1 truncate w-full">
                                                                {u.nickname || u.name}
                                                            </span>
                                                            <div className="w-6 h-1 bg-[var(--accent-blue)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="px-6 py-4 border-t-2 border-[var(--groove-dark)] bg-[var(--well-bg)] flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full hardware-well flex items-center justify-center opacity-40"><Power className="w-4 h-4" /></div>
                                        <span className="label-mono">{t('login.mainConsole')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[var(--accent-moss)]" />
                                        <span className="label-mono text-[var(--accent-moss)] uppercase">{t('login.active')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth-console"
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="baustein-panel shadow-[0_60px_120px_rgba(0,0,0,0.4)] grid grid-cols-1 md:grid-cols-12 min-h-[550px] max-h-[85vh] h-auto overflow-hidden"
                        >
                            {/* Monitor Column */}
                            <div className="md:col-span-3 bg-[var(--well-bg)] p-8 border-r-2 border-[var(--groove-dark)] flex flex-col">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="hardware-btn group w-fit mb-12"
                                >
                                    <div className="hardware-cap bg-white px-4 py-2 rounded-lg flex items-center gap-2 border border-black/5">
                                        <ArrowLeft className="w-4 h-4" />
                                        <span className="label-mono">{t('login.reset')}</span>
                                    </div>
                                </button>
                                
                                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                    <div className="hardware-well w-32 h-32 rounded-3xl border-4 border-[#C8C4B0] overflow-hidden p-1 shadow-2xl">
                                        {selectedUser.avatarUrl ? (
                                            <Image 
                                                src={`${selectedUser.avatarUrl}?v=4`} 
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-cover rounded-2xl" 
                                                alt={selectedUser.nickname || selectedUser.name} 
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/20 flex items-center justify-center"><User className="w-12 h-12 text-black/20" /></div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-black uppercase text-[var(--text-primary)]">{selectedUser.nickname || selectedUser.name}</h2>
                                        <p className="label-mono uppercase opacity-40 tracking-[0.2em]">{selectedUser.role} {t('login.accessLevel')}</p>
                                    </div>
                                    <div className="w-full bg-black/5 rounded-md p-4 space-y-2 mt-4">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                                            <span>Hardware UID</span>
                                            <span>{selectedUser.id.slice(0, 8)}</span>
                                        </div>
                                        <div className="h-0.5 bg-black/10 w-full" />
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                                            <span>{t('parent.status')}</span>
                                            <span className="text-[var(--accent-moss)]">{t('login.waitingPin')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Input Column */}
                            <div className="md:col-span-9 flex flex-col bg-[var(--surface-warm)]">
                                <PanelHeader id="Security Input" systemName={systemName} />
                                <form onSubmit={handleLogin} className="flex-1 p-8 md:p-16 flex flex-col justify-center max-w-lg mx-auto w-full overflow-y-auto custom-scrollbar">
                                    <div className="mb-10 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 hardware-well rounded-full mb-6">
                                            <Lock className="w-5 h-5 opacity-40" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase mb-2">{t('login.enterCredentials')}</h3>
                                        <p className="label-mono opacity-50 italic">{t('login.mechanicalPinEntry')}</p>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: -8, marginBottom: 24 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                className="p-3 bg-rose-50 border-l-4 border-rose-500 flex items-center gap-3 overflow-hidden rounded-r"
                                            >
                                                <Terminal className="w-4 h-4 text-rose-500 shrink-0" />
                                                <span className="label-mono text-rose-600 text-[10px] break-words">{error}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="space-y-8">
                                        <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC]">
                                            <input
                                                autoFocus
                                                type="password"
                                                required
                                                value={pin}
                                                onChange={e => setPin(e.target.value)}
                                                placeholder="####"
                                                className="w-full bg-white/90 px-6 py-6 rounded-xl border-2 border-transparent focus:border-[var(--accent-moss)] outline-none font-black text-4xl tracking-[0.4em] text-center shadow-inner placeholder:text-black/5 h-24"
                                            />
                                        </div>

                                        <div 
                                            onClick={() => setRememberMe(!rememberMe)}
                                            className="flex items-center gap-4 cursor-pointer group select-none"
                                        >
                                            <div className={`hardware-btn w-6 h-6 rounded-md ${rememberMe ? 'is-active' : ''}`}>
                                                <div className={`hardware-cap w-full h-full flex items-center justify-center rounded-md border transition-all ${
                                                    rememberMe ? 'bg-[var(--accent-moss)] text-white border-[var(--accent-moss)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]' : 'bg-white border-black/10'
                                                }`}>
                                                    {rememberMe && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                </div>
                                            </div>
                                            <span className={`label-mono transition-opacity ${rememberMe ? 'opacity-100 font-bold' : 'opacity-60'}`}>{t('login.persistentSession')}</span>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="hardware-btn w-full mt-6"
                                        >
                                            <div className="hardware-cap bg-[var(--surface-white)] py-6 rounded-2xl border-2 border-[var(--groove-dark)] flex items-center justify-center gap-4 group">
                                                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                                                    <>
                                                        <span className="text-xl font-black uppercase tracking-widest group-hover:text-[var(--accent-moss)] transition-colors">{t('login.authorize')}</span>
                                                        <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
