import { createConnection } from '@/lib/Infrastructure/db/sqlConnection'
import LoggedInUser from '@/lib/domain/LoggedInUser'

export const inviteUser = {
    typeDef: `
        inviteUser(groupId: ID!, email: String!): String
    `,
    resolver: async (
        _: unknown,
        { groupId, email }: { groupId: string; email: string },
        context: { user: LoggedInUser },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to invite a user.')
        }

        const sql = await createConnection()

        const adminMembership = await sql`
            SELECT role FROM mn_users_groups
            WHERE user_uuid = ${context.user.uuid} AND group_uuid = ${groupId}
        `

        if (adminMembership.length === 0 || adminMembership[0].role !== 'admin') {
            throw new Error('You must be an admin of the group to invite users.')
        }

        const usersToInvite = await sql`
            SELECT uuid FROM users WHERE email = ${email}
        `

        if (usersToInvite.length === 0) {
            return 'invalid_user'
        }

        const userToInviteId = usersToInvite[0].uuid

        const existingMembership = await sql`
            SELECT user_uuid FROM mn_users_groups
            WHERE user_uuid = ${userToInviteId} AND group_uuid = ${groupId}
        `

        if (existingMembership.length > 0) {
            return 'success'
        }

        await sql`
            INSERT INTO mn_users_groups (user_uuid, group_uuid, role)
            VALUES (${userToInviteId}, ${groupId}, 'editor')
        `

        return 'success'
    },
}
