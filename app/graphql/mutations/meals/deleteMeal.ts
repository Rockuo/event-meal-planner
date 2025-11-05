import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const deleteMeal = {
    typeDef: `
        deleteMeal(id: Int!, groupUuid: ID!): Boolean!
    `,
    resolver: async (
        _: unknown,
        { id, groupUuid }: { id: number; groupUuid: string },
        context: {
            user: LoggedInUser;
        },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to delete a meal from a group.');
        }

        if (!context.user.groups.find(({ uuid }) => uuid === groupUuid)) {
            throw new Error('You must be in the group to delete meals.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `
                    DELETE
                    FROM mn_meals_groups
                    WHERE meal_id = $1
                      AND group_uuid = $2;
                `,
                [id, groupUuid],
            );

            const remainingAssociations = await client.query(
                `
                    SELECT COUNT(*)
                    FROM mn_meals_groups
                    WHERE meal_id = $1;
                `,
                [id],
            );

            if (remainingAssociations.rows[0].count === '0') {
                await client.query(
                    `
                        DELETE
                        FROM meals
                        WHERE id = $1;
                    `,
                    [id],
                );
            }

            await client.query('COMMIT');
            return result.rowCount ?? 0 > 0;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};
