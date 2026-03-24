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
    <div className="w-full h-full bg-white p-3 md:p-4 flex flex-col gap-2 md:gap-3 pointer-events-none">
      <div className="flex items-center justify-end shrink-0">
        <Search className="w-3.5 h-3.5 text-slate-300" />
      </div>

      <div className={clsx(
        "flex-1 grid gap-1.5 md:gap-2 overflow-hidden",
        isWide ? "grid-cols-4 grid-rows-2" : "grid-cols-2 grid-rows-2"
      )}>
        {items.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-300 gap-1 h-full py-4">
             <Package className="w-8 h-8 opacity-20" />
             <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Shelf Empty</span>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="relative rounded-xl overflow-hidden bg-slate-50 h-full border border-slate-100 shadow-sm group">
               <Image 
                 src={item.imageUrl} 
                 alt={item.name} 
                 fill
                 sizes="(max-width: 768px) 25vw, 15vw"
                 className="w-full h-full object-cover" 
               />
               <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-[2px] p-1 translate-y-full group-hover:translate-y-0 transition-transform">
                 <p className="text-[7px] text-white font-bold truncate text-center">{item.name}</p>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
