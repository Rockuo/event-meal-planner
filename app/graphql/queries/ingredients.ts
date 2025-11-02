import { createConnection } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const ingredients = {
    typeDef: `
        ingredients(groupUuid: ID!): [Ingredient!]!
    `,
    resolver: async (_: unknown, { groupUuid }: { groupUuid: string }, context: { user: LoggedInUser }) => {
        if (!context.user || !context.user.groups.find((group) => group.uuid === groupUuid)) {
            throw new Error('You must be a member of the group to view ingredients.');
        }

        const sql = await createConnection();

        const rows = await sql`
            SELECT 
                i.id, 
                i.name, 
                i.default_unit as "defaultUnit", 
                it.id as tag_id, 
                it.name as tag_name
            FROM ingredients i
            JOIN mn_ingredients_groups mig ON i.id = mig.ingredient_id
            LEFT JOIN mn_ingredients_tags mit ON i.id = mit.ingredient_id
            LEFT JOIN ingredient_tags it ON mit.ingredient_tag_id = it.id
            WHERE mig.group_uuid = ${groupUuid}
            ORDER BY i.id;
        `;

        if (rows.length === 0) {
            return [];
        }

        const ingredientsMap = new Map();

        for (const row of rows) {
            if (!ingredientsMap.has(row.id)) {
                ingredientsMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    defaultUnit: row.defaultUnit,
                    tags: [],
                });
            }

            if (row.tag_id) {
                ingredientsMap.get(row.id).tags.push({
                    id: row.tag_id,
                    name: row.tag_name,
                });
            }
        }

        return Array.from(ingredientsMap.values());
    },
};
