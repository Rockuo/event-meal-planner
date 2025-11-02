import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const updateIngredient = {
    typeDef: `
        updateIngredient(id: Int!, name: String, defaultUnit: String, tagIds: [Int!]!): Boolean!
    `,
    resolver: async (
        _: unknown,
        {
            id,
            name,
            defaultUnit,
            tagIds,
        }: {
            id: number;
            name?: string;
            defaultUnit?: string;
            tagIds: number[];
        },
        context: { user: LoggedInUser },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to update an ingredient.');
        }

        const client = await createPoolClient();

        try {
            await client.query('BEGIN');

            // Verify the ingredient belongs to the group
            const groupIngredientResult = await client.query(
                `
                    SELECT group_uuid
                    FROM mn_ingredients_groups
                    WHERE ingredient_id = $1;
                `,
                [id],
            );

            console.log(groupIngredientResult.rows.map(({ group_uuid }) => group_uuid));
            console.log(context.user.groups.map(({ uuid }) => uuid));

            if (
                new Set(groupIngredientResult.rows.map(({ group_uuid }) => group_uuid)).intersection(
                    new Set(context.user.groups.map(({ uuid }) => uuid)),
                ).size === 0
            ) {
                throw new Error('You must in the group to update ingredients.');
            }

            // 1. Update the ingredient's name and defaultUnit
            const updateIngredientResult = await client.query(
                `
                    UPDATE ingredients
                    SET name         = COALESCE($1, name),
                        default_unit = COALESCE($2, default_unit)
                    WHERE id = $3
                    RETURNING id, name, default_unit;
                `,
                [name, defaultUnit || null, id],
            );

            if (updateIngredientResult.rowCount === 0) {
                throw new Error('Ingredient not found or not updated.');
            }

            // 2. Update tags: delete existing and insert new ones
            await client.query(
                `
                    DELETE
                    FROM mn_ingredients_tags
                    WHERE ingredient_id = $1;
                `,
                [id],
            );

            if (tagIds.length > 0) {
                const keys = [];
                const values = [];
                for (let i = 0; i < tagIds.length; i++) {
                    const c = i * 2;
                    keys.push(`($${c + 1}, $${c + 2})`);
                    values.push(id, tagIds[i]);
                }
                await client.query(
                    `
                        INSERT INTO mn_ingredients_tags (ingredient_id, ingredient_tag_id)
                        VALUES
                        ${keys.join(',\n')}
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
