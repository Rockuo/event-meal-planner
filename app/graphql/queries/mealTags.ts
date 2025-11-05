import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const mealTags = {
    typeDef: `
        mealTags(groupUuid: ID!): [MealTag!]!
    `,
    resolver: async (_: unknown, { groupUuid }: { groupUuid: string }, context: { user: LoggedInUser }) => {
        if (!context.user || !context.user.groups.find((group) => group.uuid === groupUuid)) {
            throw new Error('You must be a member of the group to view meal tags.');
        }

        const client = await createPoolClient();
        try {
            const result = await client.query(
                `
                    SELECT mt.id, mt.name
                    FROM meal_tags mt
                    JOIN mn_meal_tag_group mmtg ON mt.id = mmtg.meal_tag_id
                    WHERE mmtg.group_uuid = $1
                    ORDER BY mt.name;
                `,
                [groupUuid],
            );
            return result.rows;
        } finally {
            client.release();
        }
    },
};
