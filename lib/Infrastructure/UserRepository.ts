import LoggedInUser, { LoggedInUserGroup } from '@/lib/domain/LoggedInUser'
import { createConnection } from './db/sqlConnection'
import { UniqueViolation } from '@/lib/Infrastructure/db/DatabaseError'
import bcrypt from 'bcrypt'

export async function createUser(email: string, password: string): Promise<void> {
    const sql = await createConnection()
    try {
        await sql`
                INSERT INTO users (email, password)
                VALUES (${email}, ${await hashPassword(password)})
            `
    } catch (error: unknown) {
        // @ts-expect-error hotfix for deploy (can't rembmber the correct type)
        if (error.code === UniqueViolation) {
            throw new Error('A user with this email already exists.')
        }
        console.error(error)
        throw new Error('An error occurred during registration.')
    }
}

export async function getVerifiedUser(email: string, password: string): Promise<LoggedInUser> {
    const sql = await createConnection()
    const [userData] = await sql`SELECT uuid, email, password FROM users WHERE email = ${email} LIMIT 1`
    if (!userData) {
        throw new Error('Invalid LoggedInUser or password')
    }
    if (!(await bcrypt.compare(password, userData.password))) {
        throw new Error('Invalid LoggedInUser or password')
    }
    delete userData.password
    const groups = await sql`
        SELECT g.uuid, g.name
        FROM groups g
        JOIN mn_users_groups AS ug ON g.uuid = ug.group_uuid
        WHERE ug.user_uuid = ${userData.uuid}
    `

    return {
        uuid: userData.uuid,
        email: userData.email,
        groups: groups as LoggedInUserGroup[],
    }
}

export async function getUser(uuid: string): Promise<LoggedInUser> {
    const sql = await createConnection()
    const [userData] = await sql`SELECT uuid, email FROM users WHERE uuid = ${uuid} LIMIT 1`
    const groups = await sql`
        SELECT g.uuid, g.name
        FROM groups g
        JOIN mn_users_groups AS ug ON g.uuid = ug.group_uuid
        WHERE ug.user_uuid = ${userData.uuid}
    `

    return {
        uuid: userData.uuid,
        email: userData.email,
        groups: groups as LoggedInUserGroup[],
    }
}

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}
