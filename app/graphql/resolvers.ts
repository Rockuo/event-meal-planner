import * as queries from "./queries";
import * as mutations from "./mutations";

const queryResolvers = Object.entries(queries).reduce((acc: any, [name, query]: any) => {
    acc[name] = query.resolver;
    return acc;
}, {});

const mutationResolvers = Object.entries(mutations).reduce((acc: any, [name, mutation]: any) => {
    acc[name] = mutation.resolver;
    return acc;
}, {});

export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
};
