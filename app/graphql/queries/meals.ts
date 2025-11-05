import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';
import { Meal } from '@/app/graphql/generated/graphql';

type MealRow = {
    id: number;
    name: string;
    description: string | null;
    guide: string | null;
    ingredient_id: number | null;
    ingredient_name: string | null;
    default_unit: string | null;
    count: number | null;
    unit: string | null;
    meal_tag_id: number | null;
    meal_tag_name: string | null;
    ingredient_tag_id: number | null;
    ingredient_tag_name: string | null;
};

export const meals = {
    typeDef: `
        meals(groupUuid: ID!): [Meal!]!
    `,
    resolver: async (_: never, { groupUuid }: { groupUuid: string }, context: { user: LoggedInUser }) => {
        if (!context.user || !context.user.groups.find((group) => group.uuid === groupUuid)) {
            throw new Error('You must be a member of the group to view meals.');
        }

        const client = await createPoolClient();
        try {
            const result = await client.query<MealRow>(
                `
                    SELECT m.id,
                           m.name,
                           m.description,
                           m.guide,
                           i.id           AS ingredient_id,
                           i.name         AS ingredient_name,
                           i.default_unit AS default_unit,
                           mmi.count,
                           mmi.unit,
                           mt.id          AS meal_tag_id,
                           mt.name        AS meal_tag_name,
                           it.id          AS ingredient_tag_id,
                           it.name        AS ingredient_tag_name
                    FROM meals m
                             JOIN mn_meals_groups mmg ON m.id = mmg.meal_id
                             LEFT JOIN mn_meals_ingredients mmi ON m.id = mmi.meal_id
                             LEFT JOIN ingredients i ON mmi.ingredient_id = i.id
                             LEFT JOIN mn_ingredients_tags mit ON i.id = mit.ingredient_id
                             LEFT JOIN ingredient_tags it ON mit.ingredient_tag_id = it.id
                             LEFT JOIN mn_meals_tags mmt ON m.id = mmt.meal_id
                             LEFT JOIN meal_tags mt ON mmt.meal_tag_id = mt.id
                    WHERE mmg.group_uuid = $1
                    ORDER BY m.id, i.id;
                `,
                [groupUuid],
            );

            const mealsMap: Map<number, Meal> = new Map();

            for (const row of result.rows) {
                if (!mealsMap.has(row.id)) {
                    mealsMap.set(row.id, {
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        guide: row.guide,
                        ingredients: [],
                        tags: [],
                    });
                }

                const meal = mealsMap.get(row.id) as Meal;

                if (row.ingredient_id) {
                    let mealIngredient = meal.ingredients.find((ing) => ing.ingredient.id === row.ingredient_id);
                    if (!mealIngredient) {
                        mealIngredient = {
                            ingredient: {
                                id: row.ingredient_id,
                                name: row.ingredient_name ?? '???',
                                defaultUnit: row.default_unit,
                                tags: [],
                            },
                            count: row.count ?? 0,
                            unit: row.unit,
                        };
                        meal.ingredients.push(mealIngredient);
                    }

                    if (
                        row.ingredient_tag_id &&
                        !mealIngredient.ingredient.tags.some((tag) => tag.id === row.ingredient_tag_id)
                    ) {
                        mealIngredient.ingredient.tags.push({
                            id: row.ingredient_tag_id,
                            name: row.ingredient_tag_name ?? '???',
                        });
                    }
                }

                if (row.meal_tag_id && !meal.tags.some((tag) => tag.id === row.meal_tag_id)) {
                    meal.tags.push({
                        id: row.meal_tag_id,
                        name: row.meal_tag_name ?? '???',
                    });
                }
            }

            return Array.from(mealsMap.values());
        } finally {
            client.release();
        }
    },
};
