import { createConnection } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const changeGroupName = {
    typeDef: `
        changeGroupName(groupId: ID!, name: String!): Boolean
    `,
    resolver: async (
        _: unknown,
        { groupId, name }: { groupId: string; name: string },
        context: { user: LoggedInUser },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to change a group name.');
        }

        const sql = await createConnection();

        const membership = await sql`
            SELECT role FROM mn_users_groups
            WHERE user_uuid = ${context.user.uuid} AND group_uuid = ${groupId}
        `;

        if (membership.length === 0 || membership[0].role !== 'admin') {
            throw new Error('You must be an admin of the group to change its name.');
        }

        const result = await sql`
            UPDATE groups
            SET name = ${name}
            WHERE uuid = ${groupId}
        `;

        return result.length > 0;
    },
};
