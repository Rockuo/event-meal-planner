import { createPoolClient } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const createIngredient = {
    typeDef: `
        createIngredient(name: String!, defaultUnit: String, tagIds: [Int!]!, groupUuid: ID!): Boolean!
    `,
    resolver: async (
        _: unknown,
        {
            name,
            defaultUnit,
            tagIds,
            groupUuid,
        }: {
            name: string;
            defaultUnit?: string;
            tagIds: number[];
            groupUuid: string;
        },
        context: { user: LoggedInUser },
    ) => {
        if (!context.user) {
            throw new Error('You must be logged in to create an ingredient.');
        }

        if (!context.user.groups.find(({ uuid }) => uuid === groupUuid)) {
            throw new Error('You must in the group to create ingredients.');
        }

        const client = await createPoolClient();
        try {
            await client.query('BEGIN');
            const {
                rows: [{ id }],
            } = await client.query(
                `
                    INSERT INTO ingredients (name, default_unit)
                    VALUES ($1, $2)
                    RETURNING id;
                `,
                [name, defaultUnit || null],
            );
            await client.query(
                `
                    INSERT INTO mn_ingredients_groups (ingredient_id, group_uuid)
                    VALUES ($1, $2)
                `,
                [id, groupUuid],
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
