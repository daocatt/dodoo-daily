'use client'

import React, { useEffect, useState } from 'react'
import { Package, Search } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

type StorageItem = {
  id: string
  name: string
  imageUrl: string
  tags: string
}

export default function StorageWidget({ cellSize }: { size: string, cellSize: number }) {
  const [items, setItems] = useState<StorageItem[]>([])
  const { t } = useI18n()

  useEffect(() => {
    fetch('/api/storage?limit=4')
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setItems(data)
      })
  }, [])

  const fontSize = Math.max(10, Math.floor(cellSize * 0.12))

  return (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 flex items-center gap-2" style={{ fontSize }}>
          <Package className="w-4 h-4 text-amber-500" />
          {t('storage.title') || 'Family Storage'}
        </h3>
        <Search className="w-4 h-4 text-slate-300" />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden">
        {items.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center text-slate-300 gap-1 h-full">
             <Package className="w-8 h-8 opacity-20" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Shelf Empty</span>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="relative rounded-xl overflow-hidden bg-slate-50 aspect-square border border-slate-100 shadow-sm">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
               <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm p-1">
                 <p className="text-[8px] text-white font-bold truncate">{item.name}</p>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
