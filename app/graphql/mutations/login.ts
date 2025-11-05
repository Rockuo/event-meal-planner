import { getVerifiedUser } from '@/lib/Infrastructure/UserRepository';
import { createSessionToken } from '@/lib/Infrastructure/session/session';

export const login = {
    typeDef: `
        login(email: String!, password: String!): String
    `,
    resolver: async (_: unknown, { email, password }: { email: string; password: string }) => {
        const user = await getVerifiedUser(email, password);
        return createSessionToken({ user });
    },
};
