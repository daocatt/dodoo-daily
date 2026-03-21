'use client'

import React from 'react'

interface PanelHeaderProps {
    id: string;
    systemName?: string;
    accentColor?: string;
    showStatus?: boolean;
}

const PanelHeader = ({ 
    id, 
    systemName = "DoDoo System", 
    accentColor = "var(--accent-moss)",
    showStatus = true
}: PanelHeaderProps) => (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--groove-dark)] bg-[var(--surface-warm)] shrink-0">
        <div className="flex items-center gap-3">
            {showStatus && (
                <div 
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_var(--status-color)] animate-pulse" 
                    style={{ 
                        backgroundColor: accentColor,
                        // @ts-expect-error - Custom CSS property for status color
                        '--status-color': accentColor 
                    } as React.CSSProperties}
                />
            )}
            <span className="font-black text-sm tracking-tight uppercase">{systemName}</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden sm:block px-2 py-0.5 border border-[var(--text-muted)] rounded text-[8px] font-bold opacity-30 tracking-widest">
                VER: DO-19.C
            </div>
            <div className="px-3 py-1 bg-[var(--well-bg)] rounded-md shadow-inner text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border border-black/5">
                {id}
            </div>
        </div>
    </div>
)

export default PanelHeader;
