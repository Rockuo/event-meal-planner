import { createConnection } from '@/lib/Infrastructure/db/sqlConnection'
import LoggedInUser from '@/lib/domain/LoggedInUser'

type GroupRow = {
    uuid: string
    name: string
    user_uuid: string
    email: string
    role: string
}

export const group = {
    typeDef: `
        group(uuid: ID!): Group
    `,
    resolver: async (_: unknown, { uuid }: { uuid: string }, context: { user: LoggedInUser }) => {
        if (!context.user || !context.user.groups.find((group) => group.uuid === uuid)) {
            throw new Error('You must be a member of the group to do that.')
        }

        const sql = await createConnection()
        const groups: GroupRow[] = (await sql`
            SELECT g.uuid, g.name, u.uuid as user_uuid, u.email, m.role as role
            FROM groups g
                     LEFT JOIN mn_users_groups m on g.uuid = m.group_uuid
                     LEFT JOIN users u on m.user_uuid = u.uuid
            WHERE g.uuid = ${uuid}
        `) as unknown as GroupRow[]

        if (groups.length === 0) {
            return null
        }

        const groupData = groups[0]

        const members = groups.map((row) => ({
            user: {
                uuid: row.user_uuid,
                email: row.email,
            },
            role: row.role,
        }))

        return {
            uuid: groupData.uuid,
            name: groupData.name,
            members: members,
        }
    },
}
