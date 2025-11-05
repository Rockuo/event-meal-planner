import { gql } from '@/app/graphql/generated';
import { useContext } from 'react';
import { GroupContext } from '@/hooks/context/HandledGroupContext';
import { useQuery } from '@apollo/client/react';

export const MEALS_QUERY = gql(`
    query Meals($groupUuid: ID!) {
        meals(groupUuid: $groupUuid) {
            id
            name
            description
            guide
            ingredients {
                ingredient {
                    id
                    name
                    defaultUnit
                }
                count
                unit
            }
            tags {
                id
                name
            }
        }
    }
`);

export function useMealsQuery() {
    const { activeGroup } = useContext(GroupContext);
    return useQuery(MEALS_QUERY, {
        variables: { groupUuid: activeGroup?.uuid || '' },
        skip: !activeGroup?.uuid,
    });
}
