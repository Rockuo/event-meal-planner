'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@/app/graphql/generated';
import { Group } from '@/app/graphql/generated/graphql';
import Cookies from 'js-cookie';
import { UserContext } from '@/hooks/context/HandledUserContext';
import GlobalLoader from '@/hooks/context/GlobalLoader';

export const GroupContext = createContext<{
    activeGroup: Group | undefined;
    setActiveGroup: (uuid: string) => void;
}>({
    activeGroup: undefined,
    setActiveGroup: () => {},
});

// Define the GraphQL query to fetch a group by UUID
export const GET_GROUP_QUERY = gql(`
    query GetGroup($uuid: ID!) {
        group(uuid: $uuid) {
            uuid
            name
            members {
                user {
                    uuid
                    email
                }
                role
            }
        }
    }
`);

export default function HandledGroupContext({ children }: { children: ReactNode }) {
    const [activeId, setActiveId] = useState<string | undefined>(Cookies.get('activeGroup'));
    const { setLoading } = useContext(GlobalLoader);
    const { user } = useContext(UserContext);

    const setActiveGroup = (uuid: string) => {
        setActiveId(uuid);
        Cookies.set('activeGroup', uuid);
    };

    if ((!activeId || user.groups.find(({ uuid }) => uuid === activeId) === undefined) && user.groups.length > 0) {
        setActiveGroup(user.groups[0]?.uuid);
    }

    // todo make loading overlay outside group and
    const { data, loading, error } = useQuery(GET_GROUP_QUERY, {
        variables: { uuid: activeId ?? '' },
        skip: !activeId, // Skip the query if no UUID is present in the URL
    });

    useEffect(() => {
        setLoading(loading);
    }, [loading, setLoading]);

    // The group data is available in data.group
    const group = data?.group || null;

    if (!group) {
        return null;
    }

    return <GroupContext value={{ activeGroup: group, setActiveGroup }}>{children}</GroupContext>;
}
