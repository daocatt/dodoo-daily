'use client'

import React from 'react'
import { useAuthSession, AuthSession } from '@/hooks/useAuthSession'
import VisitorAuth from './VisitorAuth'
import { Loader2 } from 'lucide-react'

interface AuthGateProps {
    /**
     * Component to render when authorized.
     * Receives the current session as a prop if a function is provided.
     */
    children: React.ReactNode | ((session: AuthSession) => React.ReactNode);
    
    /**
     * Component to render when NOT authorized.
     * Defaults to the VisitorAuth (login/join) component.
     */
    fallback?: React.ReactNode;

    /**
     * Requirement:
     * - 'ANY': Either family member OR visitor (default)
     * - 'FAMILY': Only family member
     * - 'VISITOR': Only visitor (visitor)
     * - 'BOTH': Needs to be both (rare)
     */
    mode?: 'ANY' | 'FAMILY' | 'VISITOR' | 'BOTH';

    /**
     * Show loading spinner while checking session?
     */
    showLoading?: boolean;
}

export default function AuthGate({ 
    children, 
    fallback, 
    mode = 'ANY', 
    showLoading = true 
}: AuthGateProps) {
    const session = useAuthSession()
    
    if (session.loading && showLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="label-mono text-[10px] mt-4 uppercase tracking-widest">Verifying Protocol...</p>
            </div>
        )
    }

    let isAuthorized = false
    switch (mode) {
        case 'FAMILY':
            isAuthorized = session.isFamily
            break
        case 'VISITOR':
            isAuthorized = session.isVisitor
            break
        case 'BOTH':
            isAuthorized = session.isFamily && session.isVisitor
            break
        case 'ANY':
        default:
            isAuthorized = session.isFamily || session.isVisitor
            break
    }

    if (!isAuthorized) {
        if (fallback) return <>{fallback}</>
        
        // Default fallback is the VisitorAuth modal content
        return (
            <VisitorAuth 
                onSuccess={() => {
                    window.dispatchEvent(new Event('storage'))
                    session.refresh()
                }} 
            />
        )
    }

    return (
        <>
            {typeof children === 'function' ? children(session) : children}
        </>
    )
}
