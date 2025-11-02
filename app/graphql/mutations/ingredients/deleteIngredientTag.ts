import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const deleteIngredientTag = {
    typeDef: `
        deleteIngredientTag(id: Int!, groupUuid: ID!): Boolean!
    `,
    resolver: async (
        _: unknown,
        { id, groupUuid }: { id: number; groupUuid: string },
        context: {
            user: LoggedInUser;
        },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to delete an ingredient tag from a group.');
        }

        // Authorization check: User must be a member of the group
        if (!context.user.groups.find(({ uuid }) => uuid === groupUuid)) {
            throw new Error('You must be in the group to delete ingredient tags.');
        }

        const client = await createPoolClient();
        // todo this will have issues with multiple groups and one tag (taag will not be removed from ingredient)
        // this will need to be solved with better connections between entities
        try {
            await client.query('BEGIN');

            // 1. Delete the association between the tag and the group
            const result = await client.query(
                `
                    DELETE
                    FROM mn_ingredients_tags_groups
                    WHERE ingredient_tag_id = $1
                      AND group_uuid = $2;
                `,
                [id, groupUuid],
            );

            // 2. Check if the tag has any remaining associations with other groups
            const remainingAssociations = await client.query(
                `
                    SELECT COUNT(*)
                    FROM mn_ingredients_tags_groups
                    WHERE ingredient_tag_id = $1;
                `,
                [id],
            );

            // 3. If no remaining associations, delete the tag itself
            if (remainingAssociations.rows[0].count === '0') {
                await client.query(
                    `
                        DELETE
                        FROM ingredient_tags
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
