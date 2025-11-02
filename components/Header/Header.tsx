'use client'
import React, { useState, useRef, useEffect, useContext } from 'react'
import Button from '../Button'
import Modal from '../Modal'
import UsersIcon from '../icons/UsersIcon'
import ChevronDownIcon from '../icons/ChevronDownIcon'
import CheckIcon from '../icons/CheckIcon'
import PlusIcon from '../icons/PlusIcon'
import MenuIcon from '../icons/MenuIcon'
import { usePathname, useRouter } from 'next/navigation'
import { pageNames, pages } from '@/app/pages'
import { GroupContext } from '@/hooks/context/HandledGroupContext'
import { UserContext } from '@/hooks/context/HandledUserContext'
import Cookies from 'js-cookie'
import GlobalLoader from '@/hooks/context/GlobalLoader'
import GroupForm from '@/components/Header/NewGroupModalContent'
import NavLink from '@/components/Header/NavLink'

export default function Header() {
    const {activeGroup, setActiveGroup} = useContext(GroupContext);
    const { user: { groups } } = useContext(UserContext)
    const {user} = useContext(UserContext);

    const [isGroupSwitcherOpen, setIsGroupSwitcherOpen] = useState(false)
    const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const switcherRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLElement>(null)
    const {setLoading} = useContext(GlobalLoader);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setIsGroupSwitcherOpen(false)
            }
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleGroupSelect = (uuid: string) => {
        setActiveGroup(uuid)
        setIsGroupSwitcherOpen(false)
    }

    const handleNewGroupClick = () => {
        setIsGroupSwitcherOpen(false)
        setIsNewGroupModalOpen(true)
    }

    const router = useRouter();
    const currentPage = usePathname();


    const handleNavClick = (page: string) => {
        router.push(page)
        setIsMobileMenuOpen(false)
    }

    const handleLogout = () => {
        setIsMobileMenuOpen(false)
        setLoading(true);
        Cookies.remove('token');
        router.push('/login')
    }

    const NavBar = () => <>
        {
            pages.map((page) => {
                return (
                    <NavLink key={page} page={page} currentPage={currentPage} setCurrentPage={handleNavClick}>
                        {pageNames[page]}
                    </NavLink>)
            })
        }
    </>;

    return (
        <header className="bg-white shadow-sm" ref={headerRef}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="relative" ref={switcherRef}>
                            <button
                                onClick={() => setIsGroupSwitcherOpen((prev) => !prev)}
                                className="flex items-center space-x-2 rounded-md bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                                aria-haspopup="true"
                                aria-expanded={isGroupSwitcherOpen}
                            >
                                <UsersIcon className="h-5 w-5 text-gray-600" />
                                <span className="hidden font-semibold text-gray-800 sm:block">{activeGroup?.name || '...'}</span>
                                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                            </button>

                            {isGroupSwitcherOpen && (
                                <div className="absolute left-0 z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                                    <ul>
                                        {groups.map((group) => (
                                            <li key={group.uuid}>
                                                <button
                                                    onClick={() => handleGroupSelect(group.uuid)}
                                                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <span>{group.name}</span>
                                                    {group.uuid === activeGroup?.uuid && <CheckIcon className="h-5 w-5 text-indigo-600" />}
                                                </button>
                                            </li>
                                        ))}
                                        <li>
                                            <button
                                                onClick={handleNewGroupClick}
                                                className="mt-1 flex w-full items-center border-t px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <PlusIcon className="mr-2 h-5 w-5" />
                                                Create New Group
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 0010 16.57l5.318.886a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        <h1 className="hidden text-xl font-bold text-gray-800 sm:block sm:text-2xl">Meal Planner</h1>
                    </div>
                    <div className="hidden items-center space-x-4 md:flex">
                        <nav className="flex space-x-1 sm:space-x-2">
                            <NavBar/>
                        </nav>
                        <div className="flex items-center space-x-3 border-l border-gray-200 pl-2">
                            <span className="hidden text-sm font-medium text-gray-600 sm:block">{user?.email}</span>
                            <Button onClick={handleLogout} variant="secondary" size="sm">
                                Logout
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            <MenuIcon />
                        </button>
                    </div>
                </div>
            </div>
            {isMobileMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    <nav className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                        <NavBar/>
                    </nav>
                    <div className="border-t border-gray-200 pt-4 pb-3">
                        <div className="flex items-center px-5">
                            <div className="ml-3">
                                <div className="text-base leading-none font-medium text-gray-800">{user?.email}</div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1 px-2">
                            <Button onClick={handleLogout} variant="secondary" size="sm" className="w-full justify-start">
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <Modal isOpen={isNewGroupModalOpen} onClose={() => setIsNewGroupModalOpen(false)} title="Create New Group">
                <GroupForm onClose={() => setIsNewGroupModalOpen(false)} />
            </Modal>
        </header>
    )
}