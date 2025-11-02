import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const createIngredientTag = {
    typeDef: `
        createIngredientTag(name: String!, groupUuid: ID!): Boolean!
    `,
    resolver: async (
        _: unknown,
        { name, groupUuid }: { name: string; groupUuid: string },
        context: {
            user: LoggedInUser;
        },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to create a tag.');
        }

        if (!context.user.groups.find(({ uuid }) => uuid === groupUuid)) {
            throw new Error('You must in the group to create ingredient tags.'); // Aligned error message
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            // Insert the tag or get its ID if it already exists
            const {
                rows: [{ id }],
            } = await client.query(
                `
                    INSERT INTO ingredient_tags (name)
                    VALUES ($1)
                    RETURNING id;
                `,
                [name],
            );

            // Link the tag to the group
            await client.query(
                `
                    INSERT INTO mn_ingredients_tags_groups (ingredient_tag_id, group_uuid)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING;
                `,
                [id, groupUuid],
            );

            await client.query('COMMIT');
            return true; // Return true if tag exists/created and link attempted
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};
