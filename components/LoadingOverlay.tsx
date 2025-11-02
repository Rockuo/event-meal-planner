import { ReactNode, useState } from 'react'
import GlobalLoader from '@/hooks/context/GlobalLoader'

interface Props {
    children: ReactNode
}

export default function LoadingOverlay({ children }: Props) {
    const [loading, setLoading] = useState(false)
    return (
        <>
            {loading && (
                <div className="bg-opacity-75 fixed inset-0 z-[100] flex items-center justify-center bg-white backdrop-blur-sm">
                    <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-indigo-600"></div>
                </div>
            )}
            <GlobalLoader value={{ loading, setLoading }}>{children}</GlobalLoader>
        </>
    )
}
