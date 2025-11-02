import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const deleteIngredient = {
    typeDef: `
        deleteIngredient(id: Int!, groupUuid: ID!): Boolean!
    `,
    resolver: async (
        _: unknown,
        { id, groupUuid }: { id: number; groupUuid: string },
        context: {
            user: LoggedInUser;
        },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to delete an ingredient from a group.');
        }

        // Authorization check: User must be a member of the group
        if (!context.user.groups.find(({ uuid }) => uuid === groupUuid)) {
            throw new Error('You must in the group to delete ingredients.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            // 1. Delete the association between the ingredient and the group
            const result = await client.query(
                `
                    DELETE
                    FROM mn_ingredients_groups
                    WHERE ingredient_id = $1
                      AND group_uuid = $2;
                `,
                [id, groupUuid],
            );

            // 2. Check if the ingredient has any remaining associations with other groups
            const remainingAssociations = await client.query(
                `
                    SELECT COUNT(*)
                    FROM mn_ingredients_groups
                    WHERE ingredient_id = $1;
                `,
                [id],
            );

            // 3. If no remaining associations, delete the ingredient itself
            if (remainingAssociations.rows[0].count === '0') {
                await client.query(
                    `
                        DELETE
                        FROM ingredients
                        WHERE id = $1;
                    `,
                    [id],
                );
            }

            await client.query('COMMIT');
            return result.rowCount ?? 0 > 0; // Return true if at least one association was deleted
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};
