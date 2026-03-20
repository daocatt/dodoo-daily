'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Mail, Ticket, Loader2, ArrowRight, ShieldCheck, Clock, Lock } from 'lucide-react'

interface GuestData {
    id: string
    name: string
    currency: number
    status?: string
}

interface GuestAuthProps {
    onSuccess: (guestData: GuestData) => void
    requireInvitationCode?: boolean
    disableRegistration?: boolean
}

export default function GuestAuth({ onSuccess, disableRegistration }: GuestAuthProps) {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN')
    const [identifier, setIdentifier] = useState('') // email or phone
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [invitationCode, setInvitationCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [pendingApproval, setPendingApproval] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const endpoint = mode === 'LOGIN' ? '/api/guest/login' : '/api/guest/register'
            const payload = mode === 'LOGIN' 
                ? { identifier, password }
                : { name, email, phone, password, invitationCode }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok) {
                if (data.status === 'PENDING') {
                    setPendingApproval(true)
                } else {
                    onSuccess(data)
                }
            } else {
                setError(data.error || '认证失败')
            }
        } catch (_err) {
            setError('网络连接错误')
        } finally {
            setLoading(false)
        }
    }

    if (pendingApproval) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
            >
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">等待核准</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                    您的注册申请已提交。您需要等待家长核准后才能开始访问展厅。
                </p>
                <div className="pt-6">
                    <button 
                        onClick={() => setPendingApproval(false)}
                        className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline"
                    >
                        返回登录
                    </button>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                    {mode === 'LOGIN' ? '访客登录' : '新访客注册'}
                </h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    {mode === 'LOGIN' ? '欢迎回来访问作品展' : '注册以收藏作品并管理点数'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'LOGIN' ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">手机号 / 邮箱</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    required
                                    type="text" 
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-slate-800"
                                    placeholder="输入您的账号"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">姓名 / 昵称</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    required
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-slate-800"
                                    placeholder="如何称呼您？"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">邮箱 (二选一)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    required={!phone}
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-slate-800"
                                    placeholder="example@mail.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">手机号 (二选一)</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    required={!email}
                                    type="tel" 
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-slate-800"
                                    placeholder="13812345678"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">密码</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                            required
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-slate-800"
                            placeholder="输入密码"
                        />
                    </div>
                </div>

                {mode === 'REGISTER' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">邀请码 (必填)</label>
                        <div className="relative">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                                required
                                type="text" 
                                value={invitationCode}
                                onChange={e => setInvitationCode(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-rose-50 border-2 border-rose-50 rounded-2xl focus:border-rose-500 focus:bg-white transition-all outline-none font-black text-rose-600 uppercase tracking-widest"
                                placeholder="输入访客邀请码"
                            />
                        </div>
                    </div>
                )}

                {error && <p className="text-center text-rose-500 text-xs font-bold uppercase tracking-tight">{error}</p>}

                <button 
                    disabled={loading}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest mt-4"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            <span>{mode === 'LOGIN' ? '立即进入' : '提交注册'}</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            {!disableRegistration && (
                <div className="text-center">
                    <button 
                        onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                        className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        {mode === 'LOGIN' ? '没有帐号？立即注册' : '已有访客帐号？点击登录'}
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 justify-center pt-4 opacity-30">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protected Access</span>
            </div>
        </div>
    )
}
