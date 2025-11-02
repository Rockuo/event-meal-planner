import { createConnection } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const deleteGroup = {
    typeDef: `
        deleteGroup(groupId: ID!): Boolean
    `,
    resolver: async (_: any, { groupId }: { groupId: string }, context: { user: LoggedInUser }) => {
        if (!context.user) {
            throw new Error("You must be logged in to delete a group.");
        }

        const sql = await createConnection();

        // Check if the current user is an admin of the group
        const adminMembership = await sql`
            SELECT role FROM mn_users_groups
            WHERE user_uuid = ${context.user.uuid} AND group_uuid = ${groupId}
        `;

        if (adminMembership.length === 0 || adminMembership[0].role.toLowerCase() !== 'admin') {
            throw new Error("You must be an admin of the group to delete it.");
        }

        // Proceed with deleting the group
        const result = await sql`
            DELETE FROM groups
            WHERE uuid = ${groupId}
        `;

        return result.length > 0;
    }
};
