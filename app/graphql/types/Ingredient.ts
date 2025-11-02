export const IngredientTypeDef = `
  type Ingredient {
    id: Int!
    name: String!
    defaultUnit: String
    tags: [IngredientTag!]!
  }
`;
