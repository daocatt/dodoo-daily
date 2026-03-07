'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Tag, Package, Save, X } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

interface ShopItem {
    id: string
    name: string
    description: string | null
    costCoins: number
    iconUrl: string | null
    stock: number
    isActive: boolean
}

export default function ShopManagement() {
    const { t } = useI18n()
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<ShopItem | null>(null)
    const [showAdd, setShowAdd] = useState(false)
    const [newItem, setNewItem] = useState({ name: '', description: '', costCoins: 10, iconUrl: '🎁', stock: -1 })

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/shop')
            const data = await res.json()
            setItems(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchItems() }, [])

    const handleAdd = async () => {
        if (!newItem.name) return
        try {
            await fetch('/api/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            })
            setShowAdd(false)
            setNewItem({ name: '', description: '', costCoins: 10, iconUrl: '🎁', stock: -1 })
            fetchChildren() // Wait, I need a helper or just re-fetch
            fetchItems()
        } catch (e) { console.error(e) }
    }

    const handleUpdate = async (id: string, data: any) => {
        try {
            await fetch('/api/shop', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })
            setEditing(null)
            fetchItems()
        } catch (e) { console.error(e) }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('parent.rewards')}</h2>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold"
                >
                    <Plus className="w-5 h-5" />
                    {t('button.add')}
                </button>
            </div>

            {showAdd && (
                <div className="bg-white p-6 rounded-3xl border border-yellow-100 shadow-sm space-y-4">
                    <h3 className="font-bold">{t('parent.addItem')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input placeholder={t('gallery.form.titleLabel')} className="px-4 py-2 border rounded-xl" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                        <input placeholder={t('shop.form.emojiLabel')} className="px-4 py-2 border rounded-xl" value={newItem.iconUrl} onChange={e => setNewItem({ ...newItem, iconUrl: e.target.value })} />
                        <input type="number" placeholder={t('shop.form.costLabel')} className="px-4 py-2 border rounded-xl" value={newItem.costCoins} onChange={e => setNewItem({ ...newItem, costCoins: parseInt(e.target.value) })} />
                        <input type="number" placeholder="Stock (-1 for infinite)" className="px-4 py-2 border rounded-xl" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: parseInt(e.target.value) })} />
                        <input placeholder={t('emotions.form.reasonLabel')} className="px-4 py-2 border rounded-xl lg:col-span-2" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="bg-yellow-500 text-white rounded-xl font-bold px-6 py-2">{t('button.create')}</button>
                        <button onClick={() => setShowAdd(false)} className="px-6 border rounded-xl">{t('button.cancel')}</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map(item => (
                    <div key={item.id} className={`bg-white p-6 rounded-3xl border ${item.isActive ? 'border-slate-100' : 'border-slate-200 bg-slate-50 opacity-75'} shadow-sm relative group`}>
                        <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center text-4xl shrink-0">
                                {item.iconUrl || '🎁'}
                            </div>
                            <div className="flex-1">
                                {editing?.id === item.id ? (
                                    <input
                                        className="text-lg font-bold w-full bg-slate-100 px-2 py-0.5 rounded"
                                        value={editing.name}
                                        onChange={e => setEditing({ ...editing, name: e.target.value })}
                                        autoFocus
                                    />
                                ) : (
                                    <h3 className="text-lg font-bold">{item.name}</h3>
                                )}
                                <div className="text-sm text-slate-500 line-clamp-1">{item.description || 'No description'}</div>
                                <div className="mt-2 flex gap-4 text-sm font-semibold">
                                    <span className="flex items-center gap-1 text-yellow-600"><Tag className="w-4 h-4" /> {item.costCoins} Coins</span>
                                    <span className="flex items-center gap-1 text-blue-600"><Package className="w-4 h-4" /> {item.stock === -1 ? 'Infinite' : `${item.stock} Left`}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                {editing?.id === item.id ? (
                                    <>
                                        <button onClick={() => handleUpdate(item.id, editing)} className="p-2 bg-green-500 text-white rounded-lg"><Save className="w-4 h-4" /></button>
                                        <button onClick={() => setEditing(null)} className="p-2 bg-slate-200 text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setEditing(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleUpdate(item.id, { isActive: !item.isActive })} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                            {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
