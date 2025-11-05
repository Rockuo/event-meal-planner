import * as queries from './queries';
import * as mutations from './mutations';

const queryResolvers = Object.entries(queries).reduce(
    (
        acc: { [key: string]: unknown },
        [name, query]: [
            string,
            {
                resolver: unknown;
            },
        ],
    ) => {
        acc[name] = query.resolver;
        return acc;
    },
    {},
);

const mutationResolvers = Object.entries(mutations).reduce(
    (
        acc: { [key: string]: unknown },
        [name, mutation]: [
            string,
            {
                resolver: unknown;
            },
        ],
    ) => {
        acc[name] = mutation.resolver;
        return acc;
    },
    {},
);

export const resolvers = {
    Query: queryResolvers,
    Mutation: mutationResolvers,
};
