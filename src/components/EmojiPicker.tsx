'use client'

import React from 'react'

const COMMON_EMOJIS = [
    '🎁', '🧸', '🎮', '🍦', '🍕', '🍰', '🍭', '🍓',
    '🎨', '📚', '🎒', '🚲', '🛴', '⚽', '🏀', '🎸',
    '🐶', '🐱', '🐰', '🦄', '🦁', '🐼', '🦖', '🐉',
    '🌈', '⭐', '🌟', '✨', '🎈', '🎉', '🎊', '🎀',
    '🏠', '🏰', '🎡', '🎢', '🚀', '🛸', '🛫', '🛳️',
    '📱', '⌚', '🎧', '📸', '💻', '🖱️', '🔋', '🔌'
]

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
    currentEmoji?: string
}

export default function EmojiPicker({ onSelect, currentEmoji }: EmojiPickerProps) {
    return (
        <div className="hardware-well bg-[#DADBD4]/50 border-2 border-black/5 rounded-2xl p-4 shadow-well max-h-[200px] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-6 gap-2">
                {COMMON_EMOJIS.map(emoji => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className={`w-10 h-10 flex items-center justify-center text-2xl rounded-xl transition-all hover:bg-white/40 active:scale-90 ${currentEmoji === emoji ? 'bg-indigo-500 shadow-well border border-black/10 text-white' : 'hover:scale-110'}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}
