import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const createMealTag = {
    typeDef: `
        createMealTag(name: String!, groupUuid: ID!): Boolean!
    `,
    resolver: async (
        _: unknown,
        { name, groupUuid }: { name: string; groupUuid: string },
        context: {
            user: LoggedInUser;
        },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to create a meal tag.');
        }

        if (!context.user.groups.find(({ uuid }) => uuid === groupUuid)) {
            throw new Error('You must be in the group to create meal tags.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            const {
                rows: [{ id }],
            } = await client.query(
                `
                    INSERT INTO meal_tags (name)
                    VALUES ($1)
                    RETURNING id;
                `,
                [name],
            );

            await client.query(
                `
                    INSERT INTO mn_meal_tag_group (meal_tag_id, group_uuid)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING;
                `,
                [id, groupUuid],
            );

            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};
