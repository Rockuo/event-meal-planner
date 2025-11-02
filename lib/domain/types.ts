


export interface Group {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
}

export interface IngredientTag {
  id: string;
  name: string;
  groupId: string;
}

export interface Ingredient {
  id: string;
  name: string;
  tagIds: string[];
  groupId: string;
}

export interface MealTag {
  id: string;
  name: string;
  groupId: string;
}

export interface MealIngredient {
  ingredientId: string;
  amountPerPerson: number;
  unit: string;
}

export interface Meal {
  id:string;
  name: string;
  tagIds: string[];
  description: string;
  cookingGuide: string;
  ingredients: MealIngredient[];
  groupId: string;
}

export interface AssignedMeal {
  id: string;
  mealId: string;
  customName: string;
  numberOfPeople: number;
}

export interface EventDay {
  id: string;
  name: string;
  assignedMeals: AssignedMeal[];
}

export interface Event {
  id: string;
  name: string;
  days: EventDay[];
  groupId: string;
}

export interface AggregatedIngredient {
  ingredient: Ingredient;
  totalAmount: number;
  unit: string;
}
