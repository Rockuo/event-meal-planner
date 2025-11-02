import React from 'react'

interface Props {
    page: string
    currentPage: string
    setCurrentPage: (page: string) => void
    children: React.ReactNode
    isMobile?: boolean
}

export default function NavLink({ page, currentPage, setCurrentPage, children, isMobile = false }: Props) {
    const isActive = currentPage === page

    return (
        <button
            onClick={() => setCurrentPage(page)}
            className={` ${
                isMobile
                    ? 'block rounded-md px-3 py-2 text-base font-medium'
                    : 'rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200'
            } ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
        >
            {children}
        </button>
    )
}
