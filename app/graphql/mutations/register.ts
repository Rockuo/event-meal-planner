import { createUser } from '@/lib/Infrastructure/UserRepository';

export const register = {
    typeDef: `
        register(email: String!, password: String!): String
    `,
    resolver: async (_: unknown, { email, password }: { email: string; password: string }) => {
        await createUser(email, password);
        return `User ${email} registered successfully.`;
    },
};
