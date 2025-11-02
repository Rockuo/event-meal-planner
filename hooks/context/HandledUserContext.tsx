'use client';
import { createContext, ReactNode, useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import jwt from 'jsonwebtoken'
import type LoggedInUser from '@/lib/domain/LoggedInUser'
import { usePathname, useRouter } from 'next/navigation'
import { gql } from '@/app/graphql/generated/gql';
import { useQuery } from '@apollo/client/react'

const REFRESH_CREDENTIALS_QUERY = gql(`
    query RefreshCredentials {
        refreshCredentials
    }
`);

const emptyUser = {
    uuid: '',
    email: '...',
    groups: [],
};

export const UserContext = createContext<{
    user: LoggedInUser,
    refresh: () => Promise<void>
}>({
    user: emptyUser,
    refresh: () => Promise.resolve()
});

export default function HandledUserContext({children}: {children: ReactNode}) {
    const [user, setUser] = useState<LoggedInUser>(emptyUser);
    // BAD solution, for serverside rerender diffs clientside
    const [autoLogin, setAutoLogin] = useState<'success'|'progress'|'failed'>('progress');
    const [token, setToken] = useState<string | undefined>(Cookies.get('token'));
    const path = usePathname();
    const router = useRouter();

    const {refetch} = useQuery(REFRESH_CREDENTIALS_QUERY, { skip: true, });
    const onSuccessLoginQueue = useRef<(() => void)[]>([]);

    useEffect(() => {
        setToken(Cookies.get('token'));
    }, [path])

    useEffect(() => {
        if (autoLogin === 'progress')
        {
            if (token) {
                const tokenData = jwt.decode(token);
                if (tokenData && typeof tokenData !== 'string' && (tokenData.exp ?? 0) > Date.now() / 1000 ) {
                    setUser(tokenData.user);
                    setAutoLogin('success');
                } else {
                    setAutoLogin('failed');
                }
            }
            else {
                setAutoLogin('failed');
            }
        }
        else if (autoLogin === 'failed' && path !== '/login') {
            router.push('/login');
        }
    }, [autoLogin, user, token])

    useEffect(() => {
        if (autoLogin === 'success') {
            onSuccessLoginQueue.current.forEach(callback => callback());
            onSuccessLoginQueue.current = [];
        }
    }, [autoLogin]);

    const refresh = async () => {
        const result = await refetch();
        if (result.data?.refreshCredentials) {
            const credentials = result.data.refreshCredentials;
            return new Promise<void>((resolve) => {
                onSuccessLoginQueue.current.push(resolve);

                setToken(credentials);
                setAutoLogin('progress');
                Cookies.set('token', credentials, { expires: 1 })
            });
        }
        router.push('/login');
    }
    

    return <UserContext.Provider value={{ user, refresh }}>{children}</UserContext.Provider>
}