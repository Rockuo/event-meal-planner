import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const updateIngredientTag = {
    typeDef: `
        updateIngredientTag(id: Int!, name: String!): Boolean!
    `,
    resolver: async (
        _: unknown,
        { id, name }: { id: number; name: string },
        context: {
            user: LoggedInUser;
        },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to update an ingredient tag.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            // Verify the tag is associated with the group
            const groupTagResult = await client.query(
                `
                    SELECT group_uuid
                    FROM mn_ingredients_tags_groups
                    WHERE ingredient_tag_id = $1
                `,
                [id],
            );
            if (
                new Set(groupTagResult.rows.map(({ group_uuid }) => group_uuid)).intersection(
                    new Set(context.user.groups.map(({ uuid }) => uuid)),
                ).size === 0
            ) {
                throw new Error('You must in the group to update ingredient tags.');
            }

            // Update the tag name
            const updateResult = await client.query(
                `
                    UPDATE ingredient_tags
                    SET name = $1
                    WHERE id = $2;
                `,
                [name, id],
            );

            await client.query('COMMIT');
            return updateResult.rowCount ?? 0 > 0; // Return true if the tag was updated
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};
