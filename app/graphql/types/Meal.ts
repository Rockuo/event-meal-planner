export const MealTypeDef = `
  type Meal {
    id: Int!
    name: String!
    description: String
    guide: String
    ingredients: [MealIngredient!]!
    tags: [MealTag!]!
  }
`;
