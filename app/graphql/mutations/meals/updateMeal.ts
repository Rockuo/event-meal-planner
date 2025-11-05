import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';
import { MealIngredientInput } from '@/app/graphql/generated/graphql';

export const updateMeal = {
    typeDef: `
        updateMeal(id: Int!, name: String, description: String, guide: String, ingredients: [MealIngredientInput!]!, tagIds: [Int!]!): Boolean!
    `,
    resolver: async (
        _: unknown,
        {
            id,
            name,
            description,
            guide,
            ingredients,
            tagIds,
        }: {
            id: number;
            name?: string;
            description?: string;
            guide?: string;
            ingredients: MealIngredientInput[];
            tagIds?: number[];
        },
        context: { user: LoggedInUser },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to update a meal.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');

            // Verify the meal belongs to one of the user's groups
            const groupMealResult = await client.query(
                `
                    SELECT group_uuid
                    FROM mn_meals_groups
                    WHERE meal_id = $1;
                `,
                [id],
            );

            if (
                new Set(groupMealResult.rows.map(({ group_uuid }) => group_uuid)).intersection(
                    new Set(context.user.groups.map(({ uuid }) => uuid)),
                ).size === 0
            ) {
                throw new Error('You must be in the group to update meals.');
            }

            // 1. Update meal details
            const updateMealResult = await client.query(
                `
                    UPDATE meals
                    SET name        = COALESCE($1, name),
                        description = COALESCE($2, description),
                        guide       = COALESCE($3, guide)
                    WHERE id = $4
                    RETURNING id;
                `,
                [name, description || null, guide || null, id],
            );

            if (updateMealResult.rowCount === 0) {
                throw new Error('Meal not found or not updated.');
            }

            // 2. Update ingredients: delete existing and insert new ones
            await client.query(
                `
                    DELETE
                    FROM mn_meals_ingredients
                    WHERE meal_id = $1;
                `,
                [id],
            );

            if (ingredients && ingredients.length > 0) {
                let paramIndex = 2;
                const values: (string | number | null)[] = [id];
                const placeholders = [];

                for (const ing of ingredients) {
                    placeholders.push(`($1, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                    values.push(ing.ingredientId, ing.count, ing.unit || null);
                }

                await client.query(
                    `
                        INSERT INTO mn_meals_ingredients (meal_id, ingredient_id, count, unit)
                        VALUES
                        ${placeholders.join(',')}
                    `,
                    values,
                );
            }

            // 3. Update tags: delete existing and insert new ones
            await client.query(
                `
                    DELETE
                    FROM mn_meals_tags
                    WHERE meal_id = $1;
                `,
                [id],
            );

            if (tagIds && tagIds.length > 0) {
                let paramIndex = 2;
                const values = [id];
                const placeholders = [];

                for (const tagId of tagIds) {
                    placeholders.push(`($1, $${paramIndex++})`);
                    values.push(tagId);
                }

                await client.query(
                    `
                        INSERT INTO mn_meals_tags (meal_id, meal_tag_id)
                        VALUES
                        ${placeholders.join(',')}
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
