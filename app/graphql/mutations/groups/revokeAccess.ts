import { createConnection } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const revokeAccess = {
    typeDef: `
        revokeAccess(groupId: ID!, userId: ID!): Boolean
    `,
    resolver: async (_: any, { groupId, userId }: { groupId: string, userId: string }, context: { user: LoggedInUser }) => {
        if (!context.user) {
            throw new Error("You must be logged in to revoke access.");
        }

        const sql = await createConnection();

        // Check if the current user is an admin of the group
        const adminMembership = await sql`
            SELECT role FROM mn_users_groups
            WHERE user_uuid = ${context.user.uuid} AND group_uuid = ${groupId}
        `;

        if (adminMembership.length === 0 || adminMembership[0].role.toLowerCase() !== 'admin') {
            throw new Error("You must be an admin of the group to revoke access.");
        }

        // Safety check: Prevent the last admin from being removed
        if (context.user.uuid === userId) {
            const adminCountResult = await sql`
                SELECT COUNT(*) FROM mn_users_groups
                WHERE group_uuid = ${groupId} AND role = 'admin'
            `;
            if (adminCountResult[0].count <= 1) {
                throw new Error("You cannot remove the last admin from the group.");
            }
        }

        // Proceed with removing the user
        const result = await sql`
            DELETE FROM mn_users_groups
            WHERE user_uuid = ${userId} AND group_uuid = ${groupId}
        `;

        return result.length > 0;
    }
};
