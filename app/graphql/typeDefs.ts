import * as queries from './queries';
import * as mutations from './mutations';
import * as types from './types';

const queryTypeDefs = Object.values(queries)
    .map((query: { typeDef: string }) => query.typeDef)
    .join('\n');

const mutationTypeDefs = Object.values(mutations)
    .map((mutation: { typeDef: string }) => mutation.typeDef)
    .join('\n');

const customTypesDefs = Object.values(types)
    .map((type: string) => type)
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
