'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, X, Check, Trash2, RotateCcw } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'success' | 'info'
    icon?: React.ReactNode
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger',
    icon
}: ConfirmModalProps) {
    const { t } = useI18n()

    const colors = {
        danger: {
            well: 'bg-rose-500',
            cap: 'bg-rose-400 hover:bg-rose-500',
            text: 'text-rose-500',
            icon: <Trash2 className="w-6 h-6 text-rose-500" />
        },
        warning: {
            well: 'bg-amber-500',
            cap: 'bg-amber-400 hover:bg-amber-500',
            text: 'text-amber-500',
            icon: <AlertCircle className="w-6 h-6 text-amber-500" />
        },
        success: {
            well: 'bg-emerald-500',
            cap: 'bg-emerald-400 hover:bg-emerald-500',
            text: 'text-emerald-500',
            icon: <Check className="w-6 h-6 text-emerald-500" />
        },
        info: {
            well: 'bg-blue-500',
            cap: 'bg-blue-400 hover:bg-blue-500',
            text: 'text-blue-500',
            icon: <RotateCcw className="w-6 h-6 text-blue-500" />
        }
    }

    const activeColor = colors[variant]

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div 
                    key="modal-container"
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                >
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />
                    
                    <motion.div
                        key="modal-body"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        className="baustein-panel w-full max-w-sm bg-[#E2DFD2] rounded-[2.5rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col gap-6"
                    >
                        {/* Header Identity */}
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">{t('journal.systemConfirmation')}</span>
                             </div>
                             <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg transition-colors text-slate-400">
                                <X className="w-4 h-4" />
                             </button>
                        </div>

                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="hardware-well w-16 h-16 rounded-2xl bg-[#DADBD4] shadow-well flex items-center justify-center mb-2">
                                <div className="hardware-cap absolute inset-1.5 bg-white rounded-xl shadow-cap flex items-center justify-center border border-black/5">
                                    {icon || activeColor.icon}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest label-mono leading-relaxed px-4">{message}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <button 
                                onClick={onClose}
                                className="hardware-btn group"
                            >
                                <div className="hardware-well h-14 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-0.5 transition-all">
                                    <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-slate-50 rounded-lg shadow-cap flex items-center justify-center border border-black/5 transition-all">
                                        <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-tighter">{cancelText || t('common.cancel')}</span>
                                    </div>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => {
                                    onConfirm()
                                    onClose()
                                }}
                                className="hardware-btn group"
                            >
                                <div className={clsx("hardware-well h-14 rounded-xl shadow-well flex items-center justify-center relative active:translate-y-0.5 transition-all", activeColor.well)}>
                                    <div className={clsx("hardware-cap absolute inset-1 rounded-lg shadow-cap flex items-center justify-center border border-black/5 transition-all font-black text-[10px] uppercase italic tracking-tighter text-white", activeColor.cap)}>
                                        {confirmText || t('common.confirm')}
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Decorative Space */}
                        <div className="h-2" />
                    </motion.div>
                </motion.div>
            )}
            <style jsx>{`
                .shadow-well {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.5);
                }
                .shadow-cap {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,1);
                }
            `}</style>
        </AnimatePresence>
    )
}

import clsx from 'clsx'
