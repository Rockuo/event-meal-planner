import { createConnection } from '@/lib/Infrastructure/db/sqlConnection';
import LoggedInUser from '@/lib/domain/LoggedInUser';

export const ingredientTags = {
    typeDef: `
        ingredientTags(groupUuid: ID!): [IngredientTag!]!
    `,
    resolver: async (_: unknown, { groupUuid }: { groupUuid: string }, context: { user: LoggedInUser }) => {
        if (!context.user || !context.user.groups.find((group) => group.uuid === groupUuid)) {
            throw new Error('You must be a member of the group to view ingredient tags.');
        }

        const sql = await createConnection();
        return await sql`
            SELECT it.id, it.name
            FROM ingredient_tags it
            JOIN mn_ingredients_tags_groups mitg ON it.id = mitg.ingredient_tag_id
            WHERE mitg.group_uuid = ${groupUuid}
            ORDER BY it.name;
        `;
    },
};
