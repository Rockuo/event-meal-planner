"use server";
import jwt from 'jsonwebtoken';
import LoggedInUser from '@/lib/domain/LoggedInUser'
import { NextRequest } from 'next/server'

interface SessionData {
    user: LoggedInUser;
}

const secret = process.env.JWT_SECRET || 'your-secret-key';

export async function createSessionToken(data: SessionData): Promise<string> {
    return jwt.sign(data, secret, { expiresIn: '1d' });
}

export async function readSessionToken(token: string): Promise<SessionData | null> {
    try {
        return jwt.verify(token, secret) as SessionData;
    } catch (error) {
        return null;
    }
}

export async function getValidSession(req: NextRequest): Promise<SessionData | null> {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '');
    return readSessionToken(token);
}