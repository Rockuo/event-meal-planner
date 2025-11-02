import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { resolvers } from '@/app/graphql/resolvers';
import { typeDefs } from '@/app/graphql/typeDefs';
import { NextRequest } from 'next/server';
import { getValidSession } from '@/lib/Infrastructure/session/session'

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
    context: async (req: NextRequest) => {
        const session= await getValidSession(req)
        return { user: session?.user };
    },
});

export { handler as GET, handler as POST };
