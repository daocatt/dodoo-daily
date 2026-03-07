'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Tag, Package, Save, X, Camera, Clock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

interface ShopItem {
    id: string
    name: string
    description: string | null
    costCoins: number
    iconUrl: string | null
    stock: number
    deliveryDays: number
    isActive: boolean
}

export default function ShopManagement() {
    const { t } = useI18n()
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        costCoins: 10,
        iconUrl: '',
        stock: 1,
        deliveryDays: 1
    })

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/shop')
            const data = await res.json()
            setItems(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const openAdd = () => {
        setEditingItem(null)
        setFormData({
            name: '',
            description: '',
            costCoins: 10,
            iconUrl: '',
            stock: 1,
            deliveryDays: 1
        })
        setShowModal(true)
    }

    const openEdit = (item: ShopItem) => {
        setEditingItem(item)
        setFormData({
            name: item.name,
            description: item.description || '',
            costCoins: item.costCoins,
            iconUrl: item.iconUrl || '',
            stock: item.stock,
            deliveryDays: item.deliveryDays || 1
        })
        setShowModal(true)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('type', 'IMAGE')
            const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
            const data = await res.json()
            if (data.path) {
                setFormData(prev => ({ ...prev, iconUrl: data.path }))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const method = editingItem ? 'PATCH' : 'POST'
            const body = editingItem ? { id: editingItem.id, ...formData } : formData

            const res = await fetch('/api/shop', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setShowModal(false)
                fetchItems()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (item: ShopItem) => {
        try {
            await fetch('/api/shop', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, isActive: !item.isActive })
            })
            fetchItems()
        } catch (e) {
            console.error(e)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('shop.management.title')}</h2>
                    <p className="text-sm font-medium text-slate-400 mt-1">Manage manual rewards for your child.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-2xl hover:bg-yellow-600 active:scale-95 transition-all font-black shadow-lg shadow-yellow-200"
                >
                    <Plus className="w-6 h-6" />
                    <span>{t('shop.management.add')}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map(item => (
                    <div
                        key={item.id}
                        className={`group relative bg-white p-5 rounded-xl border-2 transition-all duration-300 ${item.isActive ? 'border-slate-50 hover:border-yellow-100 hover:shadow-xl hover:shadow-yellow-900/5' : 'border-slate-100 bg-slate-50 opacity-70'
                            }`}
                    >
                        <div className="flex gap-5">
                            <div className="w-24 h-24 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100/50 shadow-inner">
                                {item.iconUrl ? (
                                    <img src={item.iconUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <Package className="w-10 h-10" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 py-1">
                                <h3 className="text-lg font-black text-slate-800 mb-1 truncate">{item.name}</h3>
                                <p className="text-xs text-slate-400 font-bold mb-3 line-clamp-2 min-h-[2.5em]">
                                    {item.description || 'No detailed description.'}
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <div className="px-3 py-1.5 bg-yellow-50 rounded-xl flex items-center gap-1.5 border border-yellow-100/50">
                                        <Tag className="w-3.5 h-3.5 text-yellow-600" />
                                        <span className="text-xs font-black text-yellow-700">{item.costCoins}</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-blue-50 rounded-xl flex items-center gap-1.5 border border-blue-100/50">
                                        <Package className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-xs font-black text-blue-700">{item.stock === -1 ? '∞' : item.stock}</span>
                                    </div>
                                    {item.deliveryDays && (
                                        <div className="px-3 py-1.5 bg-green-50 rounded-xl flex items-center gap-1.5 border border-green-100/50">
                                            <Clock className="w-3.5 h-3.5 text-green-600" />
                                            <span className="text-xs font-black text-green-700">
                                                {item.deliveryDays === 1 ? t('shop.management.hours24') :
                                                    item.deliveryDays === 3 ? t('shop.management.days3') :
                                                        item.deliveryDays === 7 ? t('shop.management.days7') :
                                                            item.deliveryDays === 15 ? t('shop.management.days15') :
                                                                item.deliveryDays === 30 ? t('shop.management.days30') : `${item.deliveryDays} Days`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => openEdit(item)}
                                    className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-yellow-500 hover:border-yellow-100 transition-all shadow-sm"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => toggleActive(item)}
                                    className={`p-3 border rounded-2xl transition-all shadow-sm ${item.isActive ? 'bg-white border-slate-100 text-slate-400 hover:text-slate-600' : 'bg-yellow-500 border-yellow-500 text-white'
                                        }`}
                                >
                                    {item.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden relative max-h-[90dvh] flex flex-col"
                        >
                            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                            {editingItem ? t('shop.management.edit') : t('shop.management.add')}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-[0.2em]">Product Details</p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="flex gap-6 items-start">
                                        {/* Image Upload */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-24 h-24 rounded-xl bg-slate-50 border-4 border-white shadow-lg overflow-hidden relative group">
                                                {uploading ? (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                                    </div>
                                                ) : formData.iconUrl ? (
                                                    <img src={formData.iconUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package className="w-10 h-10" />
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    <Camera className="w-6 h-6 text-white" />
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                </label>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Photo</span>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Product Name</label>
                                                <input
                                                    className="w-full h-11 px-5 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all text-sm"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">{t('shop.management.unitPrice')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full h-11 px-5 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all text-base"
                                                    value={formData.costCoins}
                                                    onChange={e => setFormData({ ...formData, costCoins: parseInt(e.target.value) })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">{t('shop.management.stock')}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                className="w-full h-11 px-5 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all text-sm"
                                                value={formData.stock}
                                                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">{t('shop.management.delivery')}</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full h-11 px-5 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all appearance-none cursor-pointer text-sm"
                                                    value={formData.deliveryDays}
                                                    onChange={e => setFormData({ ...formData, deliveryDays: parseInt(e.target.value) })}
                                                >
                                                    <option value={1}>{t('shop.management.hours24')}</option>
                                                    <option value={3}>{t('shop.management.days3')}</option>
                                                    <option value={7}>{t('shop.management.days7')}</option>
                                                    <option value={15}>{t('shop.management.days15')}</option>
                                                    <option value={30}>{t('shop.management.days30')}</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Description</label>
                                        <textarea
                                            className="w-full h-24 p-5 bg-slate-50 rounded-2xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all resize-none text-sm"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 h-12 bg-slate-100 rounded-xl font-black text-slate-500 hover:bg-slate-200 transition-all text-sm"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-[2] h-12 bg-yellow-500 text-white rounded-xl font-black text-base hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            <span>{editingItem ? t('common.confirm') : t('button.create')}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
