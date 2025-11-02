import { makeExecutableSchema } from '@graphql-tools/schema';
import { printSchema } from 'graphql';
import { typeDefs } from '@/app/graphql/typeDefs';
import { resolvers } from '@/app/graphql/resolvers';
import fs from 'fs';
import path from 'path';

const schema = makeExecutableSchema({ typeDefs, resolvers });
const schemaAsString = printSchema(schema);

fs.writeFileSync(path.join(process.cwd(), 'app/graphql/generated/schema.graphql'), schemaAsString);

console.log('GraphQL schema generated successfully.');
