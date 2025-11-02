import React, { ReactNode } from 'react'
import XIcon from './icons/XIcon'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className={`w-full rounded-lg bg-white shadow-xl ${sizeClasses[size]} relative transform transition-all`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XIcon />
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    )
}

export default Modal
