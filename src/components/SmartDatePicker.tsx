'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
    isSameDay, isToday, setYear, setMonth, getYear, getMonth,
    setHours, setMinutes, getHours, getMinutes, isAfter, isBefore
} from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'

interface SmartDatePickerProps {
    selected?: Date | null
    onSelect: (date: Date) => void
    maxDate?: Date
    minDate?: Date
    showTime?: boolean
    className?: string
    placeholder?: string
    triggerClassName?: string
    mode?: 'inline' | 'popover'
}

// Get all the cells for a calendar month view (always 6 weeks = 42 days)
function getCalendarDays(month: Date): Date[] {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start, end })
    // Always 42 cells (6 weeks)
    while (days.length < 42) {
        const last = days[days.length - 1]
        days.push(new Date(last.getTime() + 86400000))
    }
    return days.slice(0, 42)
}

export default function SmartDatePicker({ 
    selected, 
    onSelect, 
    maxDate, 
    minDate,
    showTime,
    className,
    placeholder,
    triggerClassName,
    mode = 'popover'
}: SmartDatePickerProps) {
    const { locale, t } = useI18n()
    const [month, setMonthState] = useState<Date>(selected || new Date())
    const [view, setView] = useState<'DAYS' | 'MONTHS' | 'YEARS' | 'TIME'>('DAYS')
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    
    const dateLocale = locale === 'zh-CN' ? zhCN : enUS

    // Outside click
    useEffect(() => {
        if (mode !== 'popover') return
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, mode])

    const calendarDays = useMemo(() => getCalendarDays(month), [month])

    const WEEK_DAYS = locale === 'zh-CN'
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    const handleSelectDay = (date: Date) => {
        if (minDate && isBefore(date, minDate)) return
        if (maxDate && isAfter(date, maxDate)) return
        let newDate = date
        if (selected) {
            newDate = setHours(newDate, getHours(selected))
            newDate = setMinutes(newDate, getMinutes(selected))
        }
        onSelect(newDate)
        if (showTime) {
            setView('TIME')
        } else {
            if (mode === 'popover') setIsOpen(false)
        }
    }

    const handleTimeSelect = (h: number, m: number) => {
        const base = selected || new Date()
        onSelect(setMinutes(setHours(base, h), m))
        if (mode === 'popover') setIsOpen(false)
        setView('DAYS')
    }

    const handleMonthSelect = (m: number) => {
        setMonthState(startOfMonth(setMonth(month, m)))
        setView('DAYS')
    }

    const handleYearSelect = (y: number) => {
        setMonthState(startOfMonth(setYear(month, y)))
        setView('MONTHS')
    }

    const currentYear = getYear(new Date())
    // 100 years ago to 10 years in future
    const years = Array.from({ length: 111 }, (_, i) => currentYear - 100 + i).reverse()

    // ── Shared Header (always visible, always on one line) ─────────────────────
    const Header = (
        <div className="flex items-center gap-2 mb-5">
            <button
                type="button"
                onClick={() => setMonthState(subMonths(month, 1))}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-90"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            <button
                type="button"
                onClick={() => setView(view === 'DAYS' ? 'YEARS' : 'DAYS')}
                className="flex-1 h-9 rounded-xl bg-slate-100 text-slate-800 font-black text-xs hover:bg-slate-200 transition-all active:scale-95 tracking-wide flex items-center justify-center"
            >
                {format(month, locale === 'zh-CN' ? 'yyyy年 M月' : 'MMMM yyyy', { locale: dateLocale })}
            </button>

            <button
                type="button"
                onClick={() => setMonthState(addMonths(month, 1))}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-90"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )

    // ── Calendar Day Grid (pure div + CSS Grid, 100% controlled) ───────────────
    const DayGrid = (
        <div className="w-full">
            {/* Week day headers */}
            <div className="grid grid-cols-7 mb-2">
                {WEEK_DAYS.map((d) => (
                    <div key={d} className="flex items-center justify-center h-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells - always 42 (6 rows × 7 cols) */}
            <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, month)
                    const isSelected = selected ? isSameDay(day, selected) : false
                    const isTodayDate = isToday(day)
                    const isDisabled = (minDate && isBefore(day, minDate)) || (maxDate && isAfter(day, maxDate))

                    return (
                        <div key={idx} className="flex items-center justify-center p-0.5 h-10">
                            <button
                                type="button"
                                disabled={!!isDisabled}
                                onClick={() => handleSelectDay(day)}
                                className={clsx(
                                    'w-9 h-9 rounded-2xl text-xs font-bold transition-all flex items-center justify-center',
                                    isSelected
                                        ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-200 scale-110'
                                        : isTodayDate && !isSelected
                                        ? 'bg-indigo-50 text-indigo-600 font-black border border-indigo-200'
                                        : isCurrentMonth
                                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                        : 'text-slate-300',
                                    isDisabled && 'opacity-30 cursor-not-allowed'
                                )}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    // ── Main body by view ──────────────────────────────────────────────────────
    const CalendarContent = (
        <div className="bg-white select-none rounded-[2rem] overflow-hidden p-5">
            {Header}

            <AnimatePresence mode="wait">
                {view === 'DAYS' && (
                    <motion.div key="days" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                        {DayGrid}
                        {showTime && selected && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setView('TIME')}
                                    className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xs hover:bg-indigo-100 active:scale-95 transition-all border border-indigo-100"
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(selected, 'HH:mm')}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'YEARS' && (
                    <motion.div key="years" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="h-[280px] flex flex-col">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{locale === 'zh-CN' ? '选择年份' : 'Select Year'}</p>
                        <div className="grid grid-cols-3 gap-2 overflow-y-auto no-scrollbar flex-1">
                            {years.map(y => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => handleYearSelect(y)}
                                    className={clsx(
                                        'py-3 rounded-2xl font-black text-xs transition-all',
                                        getYear(month) === y ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    )}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {view === 'MONTHS' && (
                    <motion.div key="months" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="h-[280px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{locale === 'zh-CN' ? '选择月份' : 'Select Month'}</p>
                            <button type="button" onClick={() => setView('YEARS')} className="text-[10px] font-black text-indigo-600 hover:underline px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                                {locale === 'zh-CN' ? '切换年份' : 'Year'}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto no-scrollbar">
                            {Array.from({ length: 12 }, (_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleMonthSelect(i)}
                                    className={clsx(
                                        'py-4 rounded-2xl font-black text-xs transition-all',
                                        getMonth(month) === i ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50/40 text-indigo-700 hover:bg-indigo-100'
                                    )}
                                >
                                    {format(setMonth(new Date(2024, i, 1), i), 'MMM', { locale: dateLocale })}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {view === 'TIME' && (
                    <motion.div key="time" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="h-[280px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{locale === 'zh-CN' ? '选择时间' : 'Select Time'}</p>
                            <button type="button" onClick={() => setView('DAYS')} className="p-1.5 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 active:scale-90">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden flex gap-3">
                            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                                {Array.from({ length: 24 }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleTimeSelect(i, getMinutes(selected || new Date()))}
                                        className={clsx(
                                            'w-full py-3.5 rounded-2xl font-black text-xs transition-all shrink-0',
                                            getHours(selected || new Date()) === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        )}
                                    >
                                        {String(i).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                                {Array.from({ length: 60 }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleTimeSelect(getHours(selected || new Date()), i)}
                                        className={clsx(
                                            'w-full py-3.5 rounded-2xl font-black text-xs transition-all shrink-0',
                                            getMinutes(selected || new Date()) === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        )}
                                    >
                                        {String(i).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )

    // ── Inline mode ────────────────────────────────────────────────────────────
    if (mode === 'inline') {
        return (
            <div className={clsx('relative w-full', className)}>
                {CalendarContent}
            </div>
        )
    }

    // ── Popover mode ───────────────────────────────────────────────────────────
    return (
        <div ref={containerRef} className={clsx('relative w-full', className)}>
            {/* Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3.5 font-bold text-slate-800 hover:bg-white hover:border-slate-100 transition-all cursor-pointer flex items-center justify-between',
                    isOpen && 'bg-white border-indigo-100',
                    triggerClassName
                )}
            >
                <span className={clsx('text-sm', !selected && 'text-slate-400 font-medium')}>
                    {selected
                        ? format(selected, showTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd')
                        : (placeholder || t('tasks.form.selectDate'))}
                </span>
                <CalendarIcon className={clsx('w-4 h-4', selected ? 'text-indigo-400' : 'text-slate-400')} />
            </div>

            {/* Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute z-[2000] bottom-full mb-3 right-0 w-[300px] shadow-[0_20px_60px_-10px_rgba(99,102,241,0.2),0_10px_30px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 rounded-[2rem] overflow-hidden origin-bottom-right"
                    >
                        {CalendarContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
