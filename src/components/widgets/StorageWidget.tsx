'use client'

import React, { useEffect, useState } from 'react'
import { Package, Search } from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

type StorageItem = {
  id: string
  name: string
  imageUrl: string
  tags: string
}

export default function StorageWidget({ size }: { size: string, cellSize: number }) {
  const [items, setItems] = useState<StorageItem[]>([])
  const isWide = size === 'WIDE' || size === 'GIANT'
  
  useEffect(() => {
    const fetchLimit = isWide ? 8 : 4
    fetch(`/api/storage?limit=${fetchLimit}`)
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setItems(data)
      })
  }, [isWide])

  return (
    <div className="w-full h-full px-4 pt-3 pb-4 flex flex-col gap-2.5 pointer-events-none">
      <div className="flex items-center justify-end shrink-0 mb-1 z-10">
        <div className="p-1 hardware-well rounded-md border border-black/5 opacity-20">
           <Search className="w-2.5 h-2.5 text-slate-800" />
        </div>
      </div>

      <div className={clsx(
        "flex-1 grid gap-2.5 md:gap-3 overflow-hidden",
        isWide ? "grid-cols-4 grid-rows-2" : "grid-cols-2 grid-rows-2"
      )}>
        {items.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-300 gap-2 h-full py-4">
             <div className="w-12 h-12 hardware-well rounded-2xl flex items-center justify-center border border-black/5 opacity-20 shadow-inner">
                 <Package className="w-6 h-6" />
             </div>
             <span className="label-mono text-[9px] uppercase tracking-widest opacity-60 mt-1">SHELF_EMPTY</span>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="relative rounded-xl overflow-hidden hardware-well h-full border border-black/5 shadow-inner group">
               <Image 
                 src={item.imageUrl} 
                 alt={item.name} 
                 fill
                 sizes="(max-width: 768px) 25vw, 15vw"
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
               />
               <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[4px] p-2 translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center">
                 <p className="label-mono text-[8px] text-white font-black truncate tracking-wider">{item.name}</p>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
