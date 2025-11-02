import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection'
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const createGroup = {
    typeDef: `
        createGroup(name: String!): String
    `,
    resolver: async (_: any, { name }: { name: string }, context: { user: LoggedInUser }) => {
        if (!context.user) {
            throw new Error("You must be logged in to create a group.");
        }

        const client = await createPoolClient();

        try {
            await client.query('BEGIN');

            const {
                rows: [{ uuid }],
            } = await client.query(
                'INSERT INTO groups (name) VALUES ($1) RETURNING uuid',
                [name,]
            );

            await client.query(
                `INSERT INTO mn_users_groups (user_uuid, group_uuid, role) VALUES ($1, $2, 'admin')`,
                [context.user.uuid, uuid]
            );

            await client.query('COMMIT');
            return uuid;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};
