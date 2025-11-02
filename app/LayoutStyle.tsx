'use client';

import { ReactNode} from 'react'
import { usePathname } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'
import Header from '@/components/Header/Header'
import HandledGroupContext from '@/hooks/context/HandledGroupContext'

interface Props {
    children: ReactNode
}

export default function LayoutStyle({children}: Props) {
    const path = usePathname();
    if (path === '/login') {
        return children;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <LoadingOverlay>
                <HandledGroupContext>
                    <Header />
                    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                        {children}
                    </main>
                </HandledGroupContext>
            </LoadingOverlay>
        </div>
    );
}