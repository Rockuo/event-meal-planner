import { gql } from '@/app/graphql/generated';
import { useQuery } from '@apollo/client/react';
import { useContext } from 'react';
import { GroupContext } from '@/hooks/context/HandledGroupContext';

export const INGREDIENTS_QUERY = gql(`
    query Ingredients($groupUuid: ID!) {
        ingredients(groupUuid: $groupUuid) {
            id
            name
            defaultUnit
            tags {
                id
                name
            }
        }
    }
`);

export function useIngredientsQuery() {
    const { activeGroup } = useContext(GroupContext);
    return useQuery(INGREDIENTS_QUERY, {
        variables: { groupUuid: activeGroup?.uuid || '' },
        skip: !activeGroup?.uuid,
    });
}
