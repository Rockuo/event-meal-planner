import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "app/graphql/generated/schema.graphql",
  documents: ["app/**/*.tsx", "hooks/**/*.tsx", "components/**/*.tsx", "hooks/**/*.ts", "components/**/*.ts"],
  generates: {
    "app/graphql/generated/": {
      preset: "client",
      presetConfig: {
        gqlTagName: 'gql',
      },
      plugins: [],
      config: {
        enumsAsTypes: true,
      },
    }
  }
};

export default config;
