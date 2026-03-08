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
        <div className="bg-white border-2 border-amber-100 rounded-3xl p-4 shadow-inner max-h-[200px] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-6 gap-2">
                {COMMON_EMOJIS.map(emoji => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className={`w-10 h-10 flex items-center justify-center text-2xl rounded-xl transition-all hover:bg-amber-100 active:scale-90 ${currentEmoji === emoji ? 'bg-amber-200 shadow-sm border-2 border-amber-400' : 'hover:scale-110'}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}
