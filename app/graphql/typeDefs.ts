import * as queries from "./queries";
import * as mutations from "./mutations";
import * as types from "./types";

const queryTypeDefs = Object.values(queries)
    .map((query: any) => query.typeDef)
    .join('\n');

const mutationTypeDefs = Object.values(mutations)
    .map((mutation: any) => mutation.typeDef)
    .join('\n');

const customTypesDefs = Object.values(types)
    .map((type: any) => type)
    .join('\n');

export const typeDefs = `#graphql
  ${customTypesDefs}

  type Query {
    ${queryTypeDefs}
  }

  type Mutation {
    ${mutationTypeDefs}
  }
`;
