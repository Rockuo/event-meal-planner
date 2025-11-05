import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';
import { MealIngredientInput } from '@/app/graphql/generated/graphql';
import { createMultiInsertValues } from '@/lib/Infrastructure/db/helpers';

export const createMeal = {
    typeDef: `
        createMeal(name: String!, description: String, guide: String, ingredients: [MealIngredientInput!]!, tagIds: [Int!]!, groupUuid: ID!): Boolean!
    `,
    resolver: async (
        _: unknown,
        {
            name,
            description,
            guide,
            ingredients,
            tagIds,
            groupUuid,
        }: {
            name: string;
            description?: string;
            guide?: string;
            ingredients: MealIngredientInput[];
            tagIds: number[];
            groupUuid: string;
        },
        context: { user: LoggedInUser },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to create a meal.');
        }

        if (!context.user.groups.find(({ uuid }) => uuid === groupUuid)) {
            throw new Error('You must in the group to create meals.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            const {
                rows: [{ id: mealId }],
            } = await client.query(
                `
                    INSERT INTO meals (name, description, guide)
                    VALUES ($1, $2, $3)
                    RETURNING id;
                `,
                [name, description || null, guide || null],
            );

            // Link meal to group
            await client.query(
                `
                    INSERT INTO mn_meals_groups (meal_id, group_uuid)
                    VALUES ($1, $2)
                `,
                [mealId, groupUuid],
            );

            // Link ingredients to meal
            if (ingredients && ingredients.length > 0) {
                const { keys, values } = createMultiInsertValues(
                    ingredients.map((ing) => [mealId, ing.ingredientId, ing.count, ing.unit || null]),
                );
                console.log(keys, values);
                await client.query(
                    `
                        INSERT INTO mn_meals_ingredients (meal_id, ingredient_id, count, unit)
                        VALUES
                        ${keys}
                    `,
                    values,
                );
            }

            // Link tags to meal
            if (tagIds && tagIds.length > 0) {
                const { keys, values } = createMultiInsertValues(tagIds.map((tagId) => [mealId, tagId]));

                await client.query(
                    `
                        INSERT INTO mn_meals_tags (meal_id, meal_tag_id)
                        VALUES
                        ${keys}
                    `,
                    values,
                );
            }

            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};
