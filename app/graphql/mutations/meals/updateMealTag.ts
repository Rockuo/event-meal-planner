import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const updateMealTag = {
    typeDef: `
        updateMealTag(id: Int!, name: String!): Boolean!
    `,
    resolver: async (_: unknown, { id, name }: { id: number; name: string }, context: { user: LoggedInUser }) => {
        if (!context.user) {
            throw new Error('You must be logged in to update a meal tag.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            const groupTagResult = await client.query(
                `
                    SELECT group_uuid
                    FROM mn_meal_tag_group
                    WHERE meal_tag_id = $1
                `,
                [id],
            );

            if (
                new Set(groupTagResult.rows.map(({ group_uuid }) => group_uuid)).intersection(
                    new Set(context.user.groups.map(({ uuid }) => uuid)),
                ).size === 0
            ) {
                throw new Error('You must be in the group to update meal tags.');
            }

            const updateResult = await client.query(
                `
                    UPDATE meal_tags
                    SET name = $1
                    WHERE id = $2;
                `,
                [name, id],
            );

            await client.query('COMMIT');
            return updateResult.rowCount ?? 0 > 0;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};
