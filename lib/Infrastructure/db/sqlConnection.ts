'use server'
import { neon, Pool, neonConfig } from '@neondatabase/serverless'
//import ws from 'ws';
import { WebSocket } from 'undici'

neonConfig.webSocketConstructor = WebSocket

export async function createConnection() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set')
    }
    return neon(process.env.DATABASE_URL)
}

export async function createPoolClient() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set')
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    pool.on('error', (err: unknown) => console.error(err))

    return await pool.connect()
}
