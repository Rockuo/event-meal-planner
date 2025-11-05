import { createSessionToken } from '@/lib/Infrastructure/session/session';
import LoggedInUser from '@/lib/domain/LoggedInUser';
import { getUser } from '@/lib/Infrastructure/UserRepository';

export const refreshCredentials = {
    typeDef: `
        refreshCredentials: String
    `,
    resolver: async (_: unknown, __: unknown, context: { user: LoggedInUser }) => {
        if (!context.user) {
            throw new Error('You must be logged in to refresh credentials.');
        }

        return createSessionToken({ user: await getUser(context.user.uuid) });
    },
};
